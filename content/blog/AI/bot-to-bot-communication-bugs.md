---
title: "Bot-to-Bot 通信踩坑全记录：飞书多 Agent 群聊的 7 个 Bug 和 3 个隐藏配置"
date: "2026-03-23"
tags: ["OpenClaw", "AI-Agent"]
draft: false
summary: "在飞书群里搭建多 Agent 协作系统时踩过的每一个坑：API 排序陷阱、富文本双格式、SDK 消息去重、AppId 碰撞、@mention 转换，以及 requireMention / groupPolicy / im:message.group_msg 这三个决定 Bot 行为的隐藏配置。"
authors: ["default"]
---

> 这篇是给自己留的技术笔记。搭建 OpenClaw 多 Agent 飞书协作系统时，遇到了 7 个 Bug 和 3 个关键配置问题，全部记录在这里，以备后查。

## 背景

在搭建 CEO（若言）+ 产品经理（观澜）+ 工程师（知行）三个 Bot 在飞书群里自主协作的过程中，核心机制是 **Read Before Speak**：每个 Bot 在回复前先用飞书 API 读取群里的最新消息（包括其他 Bot 的），然后基于完整上下文做出回复。

这个机制涉及三条关键路径：
1. **读取**：`im/v1/messages` API 获取群历史 → 解析各种消息格式 → 注入 Agent 上下文
2. **接力**：Bot A 回复后 → 等 15s → 检测到新消息 → 触发 Bot B re-dispatch（Conversation Relay）
3. **发送**：Agent 生成回复 → 构造飞书消息 → 通过 `send.js` / `deliver.js` 发出

这三条路径上，每一条都有坑。

## 一、飞书 API 的隐形规则

### Bug #1：API 返回最旧的消息

**现象**：Bot 读到的"最新消息"是一个月前的建群通知。

**原因**：飞书 `im/v1/messages` 接口的 `sort_type` 参数默认值是 `ByCreateTimeAsc`。也就是说，默认返回**最早**的消息。

```javascript
// ❌ 错误：不指定排序，默认返回最旧消息
const url = `https://open.feishu.cn/open-apis/im/v1/messages?container_id=${chatId}&page_size=10`;

// ✅ 正确：显式指定倒序
const url = `https://open.feishu.cn/open-apis/im/v1/messages?container_id=${chatId}&sort_type=ByCreateTimeDesc&page_size=10`;
```

**教训**：API 的默认行为永远不要假设，显式指定每一个关键参数。

### Bug #2：Bot 消息内容显示为空

**现象**：读取群历史时，Bot 发送的消息内容全部解析为空，日志中只显示 `[bot:cli_a937xxx]`。

**原因**：飞书 `post` 类型的富文本消息实际上有两种嵌套格式：

```javascript
// 格式 A：locale 包装格式（人类用户发送的消息通常是这种）
{
  "zh_cn": {
    "title": "标题",
    "content": [[{ "tag": "text", "text": "内容" }]]
  }
}

// 格式 B：直接格式（Bot 通过 API 发送的消息通常是这种）
{
  "title": "标题",
  "content": [[{ "tag": "text", "text": "内容" }]]
}
```

原来的 `extractPostText` 函数只处理格式 A，遇到格式 B 直接返回空。

**修复**：

```javascript
function extractPostText(content) {
  let postBody = content;
  // 兼容 locale 包装格式
  if (content.zh_cn) postBody = content.zh_cn;
  else if (content.en_us) postBody = content.en_us;
  // 此时 postBody 应该直接是 { title, content }
  
  const lines = [];
  if (postBody.title) lines.push(postBody.title);
  if (postBody.content) {
    for (const paragraph of postBody.content) {
      for (const node of paragraph) {
        if (node.tag === 'text') lines.push(node.text);
        if (node.tag === 'a') lines.push(`[${node.text}](${node.href})`);
      }
    }
  }
  return lines.join('\n');
}
```

**教训**：飞书的同一种消息类型（`post`），在不同发送路径下的 JSON 结构可以不同。文档不会告诉你这件事。

### Bug #3：Card 消息完全不可见

**现象**：群历史中某些消息"消失"了，Bot 上下文中完全没有这些消息的内容。

**原因**：飞书的交互式卡片消息类型是 `interactive`，它的结构跟 `text` 和 `post` 完全不同。原有的消息解析逻辑没有覆盖这个类型。

卡片消息的典型结构：
```json
{
  "msg_type": "interactive",
  "content": {
    "elements": [
      [{ "tag": "div", "text": { "tag": "plain_text", "content": "这是卡片内容" } }],
      [{ "tag": "action", "actions": [{ "tag": "button", "text": { "tag": "plain_text", "content": "点击" } }] }]
    ]
  }
}
```

**修复**：递归提取 elements 中所有 text 节点：

```javascript
function extractCardText(elements) {
  const texts = [];
  function walk(node) {
    if (!node) return;
    if (typeof node === 'string') { texts.push(node); return; }
    if (node.content && typeof node.content === 'string') texts.push(node.content);
    if (node.text) walk(node.text);
    if (node.elements) node.elements.forEach(row => row.forEach(walk));
    if (node.actions) node.actions.forEach(walk);
  }
  if (Array.isArray(elements)) elements.forEach(row => {
    if (Array.isArray(row)) row.forEach(walk);
    else walk(row);
  });
  return texts.join(' ');
}
```

**教训**：飞书消息生态远比"纯文本"复杂。`text`、`post`、`interactive`、`image`、`file`……做消息读取必须覆盖所有类型，否则上下文就有盲区。

## 二、消息去重与身份碰撞

### Bug #4：AppId 前缀碰撞，Bot 认错自己

**现象**：Bot 观澜读取群消息后，把知行发的消息也判定为"自己发的"，直接跳过不处理。

**原因**：两个 Bot 的 AppId 分别是：
- 观澜：`cli_a937e2523c78dbc2`
- 知行：`cli_a937e29eeaf8dbca`

注意它们都以 `cli_a937` 开头。原来的判断逻辑用的是前缀匹配：

```javascript
// ❌ 错误：前缀匹配
if (sender.startsWith(myAppIdPrefix)) {
  // 跳过"自己的消息"
}
```

两个不同 Bot 的 AppId 前缀相同，导致误判。

**修复**：

```javascript
// ✅ 正确：完整精确匹配
if (sender === myAppId) {
  // 跳过自己的消息
}
```

**教训**：飞书 AppId 有规律的前缀结构（`cli_a937` 这种），永远不要用前缀匹配来判断身份。

### Bug #5：Relay 第二轮沉默

**现象**：Conversation Relay 机制的第一轮正常触发，Bot 顺利接力对话。但第二轮完全沉默——事件被触发了，但 Bot 没有任何反应。

**原因**：OpenClaw 的飞书插件 SDK 内部有基于 `messageId` 的去重机制。Relay 触发时用的伪造 `messageId` 在两轮中相同：

```javascript
// ❌ 错误：两轮 relay 用同一个 messageId
const fakeEvent = { messageId: `relay_${chatId}`, ... };
```

SDK 看到相同的 `messageId`，认为是重复事件，直接丢弃。

**修复**：每轮生成唯一的 messageId：

```javascript
// ✅ 正确：加入轮次变量
const fakeEvent = { 
  messageId: `relay_${chatId}_r${round}_${Date.now()}`, 
  ... 
};
```

**教训**：IM SDK 的消息去重是一个隐形的守门人。任何手动构造的事件都要确保 ID 唯一性。

### Bug #6：Relay 第二轮发送 400

**现象**：绕过去重后，Bot 成功处理了 relay 事件并生成回复，但发送时飞书 API 返回 HTTP 400。

**原因**：伪造的 `messageId`（如 `relay_xxx_r2_1711234567890`）骗过了 SDK 去重，但它被原样传给了飞书的回复 API 作为 `replyToMessageId`。飞书 API 发现这个 ID 不存在于真实的消息列表中，返回 400。

```javascript
// 问题：同一个 ID 同时用于去重和回复
dispatch({ 
  messageId: fakeId,           // 这个 ID 骗过去重 ✅
  replyToMessageId: fakeId     // 这个 ID 用于回复 ❌ 飞书不认
});
```

**修复**：分离两个用途的 ID：

```javascript
// dedup 用假 ID（绕过 SDK 去重），reply 用真实消息 ID
dispatch({ 
  messageId: `relay_${chatId}_r${round}_${Date.now()}`,  // 去重用：每轮唯一
  replyToMessageId: latestRealMessageId                   // 回复用：真实 API 消息 ID
});
```

**教训**：消息 ID 在不同层有不同用途——SDK 层用于去重，API 层用于定位。必须分离处理。

## 三、@mention 与权限配置

### Bug #7：@mention 只有文字没有效果

**现象**：Bot 回复中写了 `@观澜 你怎么看？`，但飞书群里显示的只是纯文字，没有 @ 的高亮和通知效果。

**原因**：飞书的 @mention 必须使用富文本标签：

```json
// ❌ 纯文字：飞书不认
{ "text": "@观澜 你怎么看？" }

// ✅ 富文本标签：飞书才认
{
  "content": [[
    { "tag": "at", "user_id": "ou_xxx", "text": "观澜" },
    { "tag": "text", "text": " 你怎么看？" }
  ]]
}
```

问题在于 LLM 生成的回复只是纯文字 `@观澜`，而发送路径（`send.js` 和 `deliver.js`）没有做转换。

**修复**：在两条发送路径上都加入系统级自动转换：

```javascript
// auto-convert: 纯文字 @name → 飞书 at 标签
function convertMentions(text, memberMap) {
  return text.replace(/@(\S+)/g, (match, name) => {
    const member = memberMap[name];
    if (member) {
      return `<at user_id="${member.open_id}">${name}</at>`;
    }
    return match;
  });
}
```

需要覆盖 `send.js`（直接发送）和 `deliver.js`（投递发送）两条路径。

**教训**：飞书的 @mention 是「结构化数据」，不是「文本约定」。LLM 不可能直接生成正确的 at 标签，必须在发送层做系统级拦截转换。

## 四、决定 Bot 行为的 3 个隐藏配置

除了 Bug 修复，还有三个关键配置直接决定了 Bot 在群聊中的行为模式：

### 配置 1：`requireMention` — 三级优先级

控制 Bot 是否需要被 @ 才回复。

**优先级**：`account 级别 > 全局级别 > 默认值(true)`

```json
{
  "channels": {
    "feishu": {
      "requireMention": true,
      "accounts": {
        "default": { "requireMention": false },
        "product": { "requireMention": true },
        "dev": { "requireMention": true }
      }
    }
  }
}
```

**推荐**：多 Agent 场景下，只给"主导者"（CEO）设 `false`，其他 Bot 保持 `true`，避免消息风暴。

### 配置 2：`groupPolicy` — 群聊准入三档

| 值 | 行为 | 适用场景 |
|----|------|---------|
| `"open"` | 任何群都能交互 | 开发测试 |
| `"allowlist"` | 只在白名单群中交互 | **生产环境（推荐）** |
| `"disabled"` | 禁用所有群聊 | 只用私聊 |

### 配置 3：`im:message.group_msg` — 隐藏权限

**这是最容易忽略的一个**。

设置了 `requireMention: false`，Bot 还是不回复非 @ 消息？大概率是因为没有在飞书开放平台后台申请 `im:message.group_msg`（获取群组中所有消息）权限。

没有这个权限，飞书根本不会把非 @ 消息推送给 Bot。配置再怎么改都没用。

**安全建议**：只给需要 `requireMention: false` 的 Bot 申请此权限。其他 Bot 不申请 = 天然的权限隔离。

## 补丁管理

以上所有修复都通过 patch 机制管理：

```bash
# 补丁目录
~/.openclaw/patches/feishu-plugin/
├── files/
│   ├── messaging/inbound/read-before-speak.js   # Read Before Speak
│   ├── messaging/inbound/handler.js              # Relay Loop + 去重修复
│   ├── messaging/outbound/send.js                # @mention 转换
│   └── messaging/outbound/deliver.js             # @mention 转换
├── apply.sh   # 应用补丁
└── restore.sh # 回退到官方原版

# 插件升级后重新应用
bash ~/.openclaw/patches/feishu-plugin/apply.sh

# 回退到官方原版
bash ~/.openclaw/patches/feishu-plugin/restore.sh
```

整个 patch 目录用 Git 管理，每次修复都有 commit 记录。

## 总结速查表

| # | Bug / 配置 | 根因 | 修复 |
|---|-----------|------|------|
| 1 | API 返回最旧消息 | `sort_type` 默认正序 | 加 `ByCreateTimeDesc` |
| 2 | Bot 消息内容为空 | `post` 格式 A/B 差异 | `extractPostText` 兼容双格式 |
| 3 | Card 消息不可见 | `interactive` 类型未处理 | 递归提取 card elements text |
| 4 | AppId 碰撞误判 | 前缀匹配 `cli_a937` 相同 | 改用 `===` 精确匹配 |
| 5 | Relay 第二轮沉默 | SDK 去重吞掉相同 messageId | 每轮生成唯一 messageId |
| 6 | Relay 发送 400 | 假 messageId 用于 reply API | 分离 dedup-id 和 replyToMessageId |
| 7 | @mention 无效 | 纯文字 ≠ 飞书 at 标签 | 系统级 auto-convert 覆盖两条路径 |
| C1 | requireMention | 三级优先级 | CEO=false, 其他=true |
| C2 | groupPolicy | 群聊准入策略 | 生产用 allowlist |
| C3 | im:message.group_msg | 隐藏权限 | 只给需要的 Bot 申请 |
