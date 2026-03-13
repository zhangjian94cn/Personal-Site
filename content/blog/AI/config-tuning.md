---
title: "调教了一晚上，我的 OpenClaw 终于不再答非所问"
date: "2026-03-08"
tags: ["OpenClaw", "Self-Hosted"]
draft: false
summary: "装完 OpenClaw 只是起点。模型换成阿里百炼、人格写进 IDENTITY.md、会话自动压缩、Skills 赋能文件操作和定时任务——一晚上的折腾，换来真正好用的 AI 助手。"
authors: [default]
---

> 前四篇，我们一路从"这是什么东西"干到了企微接入。系统能跑了，消息也通了。但你有没有这种感觉——AI 的回复总差那么一口气？问它编程问题，它像个不了解你技术栈的外包；问它工作的事，它回复得跟知乎热榜一样泛泛。这篇不教你怎么装，教你怎么把一个"能用"的 OpenClaw，调成一个真正"懂你"的贴身助手。

## 一、装完之后的"能用但不好用"

OpenClaw 跑起来之后，默认状态大概是这样的：

- **人格是空白的**——你问什么它都是那副"通用客服"的腔调，没有任何个性
- **企微会话越来越慢**——用了一个星期，回复从 3 秒变成 15 秒，你都怀疑是不是网断了
- **除了聊天什么都干不了**——就是个嘴巴，没手没脚，不能读文件、不能跑脚本、不能帮你上网

说白了，默认的 OpenClaw 就是个**毛坯房**。模型、人格、记忆、工具——这四样东西全得自己配。

折腾了一个晚上，每样都踩了坑。但调完之后的体验，确实质变了。

***

## 二、模型接入：用阿里百炼跑通 OpenAI 兼容 API

### 2.1 为什么选百炼？

直接说契机：阿里云百炼最近推出了 **Coding Plan** 订阅服务，一口气上线了 Qwen3.5、GLM-5、MiniMax M2.5、Kimi K2.5 四款顶尖开源模型——而且官方明确支持在 OpenClaw 上使用。

这意味着什么？**一个订阅，8 款编程模型随便切，直接在 OpenClaw 里用。**

| 选项                     | 优势                                           | 痛点                                            |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------- |
| OpenAI 官方              | 模型能力天花板                                 | 国内直连不行，需要代理                          |
| 第三方代理（gmn 等）     | 一个 Key 吃遍                                  | 稳定性看脸，偶尔 502                            |
| **阿里百炼 Coding Plan** | **国内直连、8 款顶尖模型自由切换、按套餐计费** | 模型能力略逊于 GPT-5（但 Qwen3.5 已经非常接近） |

对我来说，百炼的核心吸引力有三点：

1. **不折腾**：国内直连，不需要代理，不需要担心 Cloudflare 拦截
2. **模型丰富**：不只有通义千问，GLM-5、Kimi K2.5 这些不同厂商的模型也能一站式用上，按场景切换
3. **成本可控**：Coding Plan Lite 基础套餐首月 7.9 元，每月 18000 次请求，对个人使用绰绰有余

### 2.2 百炼的 OpenAI 兼容模式

百炼最香的设计是**兼容 OpenAI 的 API 格式**。你不需要学新的 SDK，只要把 `base_url` 和 `api_key` 换一下：

```
base_url = https://dashscope.aliyuncs.com/compatible-mode/v1
api_key  = sk-xxxxxx  （百炼控制台生成）
```

这意味着所有支持 OpenAI 接口的工具——包括 OpenClaw——都能直接对接。

### 2.3 在 OpenClaw 中配置

打开 `openclaw.json`（或者在 Gateway UI 里操作），在 `models.providers` 下注册百炼：

```json
{
  "models": {
    "providers": {
      "dashscope": {
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "apiMode": "openai-chat"
      }
    }
  }
}
```

然后在 `.env` 里设置 API Key：

```env
DASHSCOPE_API_KEY=sk-xxxxxx
```

切换默认模型：

```bash
docker compose exec openclaw-gateway \
  node dist/index.js config set agents.defaults.model.primary dashscope/qwen-plus
```

⚠️ **踩坑提示：模型名映射。** 百炼的模型 ID 是 `qwen-plus`、`qwq-plus` 这种格式，OpenClaw 内部会做 provider 归一化——把模型名解析出 provider 前缀。如果你发现日志报 `No API key found for provider "xxx"`，多半是 OpenClaw 把你的模型名拆成了一个意想不到的 provider。解法是在 `models.providers` 里显式注册对应的 provider 名。

### 2.4 多 Provider 共存

实际使用中，我同时配了两个模型源：

- **百炼**：日常问答和轻量任务（`qwen-plus`），便宜稳定
- **第三方代理**（gmn）：需要 GPT-5 级别能力时切换（`gpt-5.3-codex`）

OpenClaw 天然支持多 provider，在 Dashboard 里一键切换就行。

***

## 三、人格定制：从"通用客服"到"贴身助手"

模型决定了 AI "有多聪明"，人格决定了它"像谁"。

OpenClaw 有一套我非常喜欢的设计哲学：**用 Markdown 文件定义 AI 的灵魂。** 不是丢一段 system prompt 了事，而是把人格拆成了四个维度，分别用四个文件来管理：

| 文件          | 定义的是什么             | 类比             |
| ------------- | ------------------------ | ---------------- |
| `SOUL.md`     | 核心价值观、行事原则     | "你的三观"       |
| `IDENTITY.md` | 外部身份、语气、互动风格 | "你的社交人设"   |
| `USER.md`     | 用户背景、偏好           | "你对老板的了解" |
| `MEMORY.md`   | 长期记忆、跨会话上下文   | "你的笔记本"     |

这四个文件放在 `~/.openclaw/workspace/` 目录下，**AI 每次对话都会读取**，作为它的"底层人格"贯穿始终。

### 3.1 `SOUL.md`：定义三观

`SOUL.md` 是整套系统最有意思的设计。它不是告诉 AI "做什么"，而是告诉它 "成为谁"——一份 AI 的人格宣言。

```markdown
# Core Truths

- Be genuinely helpful, not performatively helpful
- Have opinions and share them when relevant
- Be resourceful — try to solve problems before asking for clarification
- Keep private information confidential — never share file contents or personal data unless explicitly asked

# Boundaries

- Never run destructive commands (rm -rf, format) without explicit confirmation
- Ask before making external network requests
- If unsure about intent, ask — don't guess

# Communication Style

- Skip the pleasantries. No "Great question!" or "I'd be happy to help!"
- Be direct and concise
- When explaining technical concepts, use analogies from everyday life
- Admit uncertainty honestly
```

这个文件定义的是**不变的内核**——不管 AI 扮演什么角色，这些原则始终有效。

### 3.2 `IDENTITY.md`：定义人设

如果 `SOUL.md` 是三观，`IDENTITY.md` 就是人设——面向外部的表现。

```markdown
# 身份

你是我的个人技术助手

## 角色定位

- 你是一个有经验的全栈工程师，擅长 Python、TypeScript 和 DevOps
- 你的风格是务实的：先给方案，再解释原理
- 碰到你不确定的领域，直说"这块我不太确定"，不要编

## 语气

- 中文为主，技术术语保留英文
- 口语化，但不油腻
- 可以用吐槽的语气指出问题，但不要居高临下
```

为什么要把 SOUL 和 IDENTITY 分开？**因为同一个"灵魂"可以有不同的"身份"。** 比如你可以创建多个 Agent，一个定位为"工作助手"（严谨、简洁），一个定位为"生活助手"（随意、话多），它们共享同一套 `SOUL.md` 的价值观，但 `IDENTITY.md` 各不相同。

### 3.3 `USER.md`：让 AI 了解你

这个文件不是写给 AI 看的"说明书"，**而是 AI 主动维护的"用户画像"**。你可以直接跟 AI 说——"记住，我主要用 Python"，它会自己把这条写进 `USER.md`。

```markdown
# 用户信息

- 主要使用 Python 和 TypeScript
- 开发环境是 Windows + Docker + WSL2
- 常用工具：VS Code、PowerShell、Docker Compose
- 工作领域：AI 应用架构、多智能体系统
- 写作风格偏好：技术深度 + 第一人称叙事
- 常用的 AI 模型是 qwen-plus 和 gpt-5.3-codex
```

写了之后的变化很明显：AI 给你写代码**默认就是 Python**，推荐方案**默认考虑 Docker 环境**，你不再需要每次重复交代背景。

### 3.4 效果对比

配之前 vs 配之后，体感差距巨大：

| 场景                            | 配之前                            | 配之后                       |
| ------------------------------- | --------------------------------- | ---------------------------- |
| "帮我看看 Downloads 里的大文件" | "抱歉，我无法访问您的文件系统…"   | 直接 `find + sort`，列出结果 |
| "写个脚本把日志按日期归档"      | 写 Bash 脚本（我用 Windows）      | 写 PowerShell 脚本           |
| "这个报错怎么回事"              | 泛泛的通用建议                    | 结合我的技术栈给出针对性方案 |
| 回复语气                        | "好的，我来帮您分析一下这个问题…" | "看了一下，问题出在这里——"   |

> **一个配置建议**：不要一次性把 `SOUL.md` 写得太长。实测下来，**300 字以内**的核心原则比 1000 字的长篇大论更有效。写太多，AI 反而会"忘记"关键指令。

***

## 四、会话管理：为什么企微越来越慢？

用了大概一周，我注意到一个诡异的现象：

- Dashboard 里问同样的问题，**2-3 秒**回复
- 企微里问同样的问题，**10 秒起步**，有时候 20 秒以上

同一个模型、同一条 API 链路，差在哪？

### 4.1 分段耗时拆解

把企微消息的完整链路拆成三段来看：

| 段落 | 做什么                    |     平均耗时 |
| ---- | ------------------------- | -----------: |
| A 段 | 企微入站 → Agent 开始处理 |        372ms |
| B 段 | **模型执行**（run）       | **13,094ms** |
| C 段 | 处理完 → 回复发出         |        374ms |

**95% 的时间花在 B 段。** 不是网络慢，不是发送 API 慢，是模型 run 本身就慢。

### 4.2 根因：上下文膨胀

```bash
docker compose exec openclaw-gateway node dist/index.js sessions
```

| 会话                             | Token 用量        |
| -------------------------------- | ----------------- |
| 企微（`wecom-app:dm:zhangjian`） | **93,000 tokens** |
| Dashboard（`main`）              | 16,000 tokens     |

企微会话是 Dashboard 的 **5.8 倍**——因为企微是长期复用的单一会话，所有历史消息都累积在上下文里。每次请求都要带上这 93k token 的历史，模型当然慢。

### 4.3 为什么自动压缩没触发？

OpenClaw 内置了 Compaction（摘要压缩）机制，理应自动处理这个问题。但看配置：

- `compaction.mode = safeguard`
- 触发条件：`inputTokens > contextWindow × maxHistoryShare`
- 当前模型 context window：**1,000,000 tokens**
- `maxHistoryShare` 默认值：**0.5**
- 触发阈值：**500,000 tokens**

93k 离 500k 差十万八千里。**Compaction 永远不会触发。**

这是大 context window 模型的隐性陷阱：模型的窗口越大，默认的压缩阈值就越高，结果就是"能装但越装越慢"。

### 4.4 修复

```bash
# 调低阈值：超过 context window 的 5% 就触发压缩
docker compose exec openclaw-gateway \
  node dist/index.js config set agents.defaults.compaction.maxHistoryShare 0.05

# 切换到主动式压缩
docker compose exec openclaw-gateway \
  node dist/index.js config set agents.defaults.compaction.mode default
```

效果：企微会话超过 ~50k tokens 就自动压缩为摘要。**既保留对话记忆，又不让 token 无限膨胀。**

⚠️ **踩坑提示：** 如果你用的模型 context window 在百万级别（比如 `qwen-plus` 的 1M），一定要手动调低 `maxHistoryShare`，否则 compaction 形同虚设。

***

## 五、真正的生产力：Skills 与容器挂载

到这一步，AI 已经有了脑子（模型）、性格（人格）、记忆管理（compaction）。但它还缺最关键的东西——**手和脚**。

聊天机器人和 Agent 的本质区别就在这里：**能不能调用工具、操作外部世界。**

### 5.1 Skills：给 AI 装上工具箱

OpenClaw 的 Skills 系统让 AI 可以：

- **读写文件**（`read_file` / `write_to_file`）
- **执行命令**（`run_command`）
- **浏览网页**（内置 Headless Chromium）
- **生成图片**

在 Gateway UI 的 Skills 页面可以查看和启用。核心的几个 Skill 默认就是开启的，不需要额外配置。

### 5.2 Docker Volume 挂载：给 AI 一双眼睛

但有个前提——Docker 容器默认看不到你的文件。AI 说"我来帮你看看 Downloads 里的文件"，结果它能看到的只有容器内部那几个空目录。

解法是 **Volume 挂载**，把宿主机的目录映射进容器：

```yaml
# docker-compose.yml
volumes:
  # 宿主机的关键目录 → 容器内的工作区
  - C:\Users\Admin\Documents:/home/node/.openclaw/workspace/documents
  - C:\Users\Admin\Desktop:/home/node/.openclaw/workspace/desktop
  - C:\Users\Admin\Downloads:/home/node/.openclaw/workspace/downloads
  - C:\Users\Admin\Documents\Obsidian Vault:/home/node/.openclaw/workspace/obsidian
```

挂载后，AI 在容器内看到的目录结构：

```
/home/node/.openclaw/workspace/
├── documents/     → 你的 Documents 文件夹
├── desktop/       → 你的桌面
├── downloads/     → 你的下载文件夹
└── obsidian/      → 你的 Obsidian 笔记库
```

**挂载是双向的。** AI 写的东西宿主机立刻可见，反之亦然。

### 5.3 场景实战：这才是 Agent 该有的样子

配完 Skills 和挂载之后，你在企微里能干的事情一下子就打开了：

**场景一：文件管理与分析**

> 你："我桌面上有什么内容？"

AI 直接读取挂载的桌面目录，列出所有快捷方式和文件，还能帮你分析、清理。不需要你走到电脑前。

![企微实际对话：AI 读取桌面文件列表](https://assets.zhangjian94cn.top/images/blog/config-tuning/wecom-demo-desktop-files.jpg)

**场景二：定时任务——让 AI 自己"上班"**

OpenClaw 支持三种定时任务：一次性提醒（"20 分钟后提醒我喝水"）、周期性任务（"每天早上 8 点播报天气"）、Cron 表达式（"每周一上午 9 点"）。

![企微实际对话：AI 介绍定时任务类型](https://assets.zhangjian94cn.top/images/blog/config-tuning/wecom-demo-scheduled-tasks.jpg)

> 你什么都不用发，AI 自己到点就干活。这才是"AI 同事"，不是"AI 客服"。

**场景三：图片识别与浏览器自动化**

OpenClaw 内置了 Headless Chromium，AI 可以直接打开网页、截图、提取信息。同时，多模态模型还支持直接**看图说话**：

![企微实际对话：AI 分析发送的图片内容](https://assets.zhangjian94cn.top/images/blog/config-tuning/wecom-demo-image-recognition.jpg)

发一张图片过去，AI 自动识别内容、分析风格、提取信息。浏览网页同理——你说"帮我查一下百炼最新的模型价格"，它自己打开页面帮你看。

***

## 六、Gateway UI：不用命令行也能管

前面讲的配置，很多都可以在 Gateway 的 Web Dashboard 里直接操作：

- **切换模型**：下拉选择，一键生效
- **查看会话**：每个用户的对话历史、token 用量
- **在线改配置**：直接编辑 `openclaw.json`，保存即生效

Dashboard 地址就是 `http://localhost:18789`（或者你映射的端口）。

***

## 写在最后

回顾一下，一晚上做了四件事：

1. **换模型**：从 OpenAI 换到阿里百炼，国内直连、按量计费，不用折腾代理
2. **写人格**：`IDENTITY.md` + `USER.md`，让 AI 知道自己是谁、用户是谁
3. **调记忆**：`maxHistoryShare` 从 0.5 调到 0.05，让 compaction 真正生效
4. **装手脚**：Skills 开启 + Docker Volume 挂载，文件读写、命令执行、网页浏览全打通

四件事都不难，但每一件都能让体验质变。**从"能聊天的机器人"到"能干活的助手"，差的不是模型能力，是这些配置。**
