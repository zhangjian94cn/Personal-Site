---
title: "手把手：Claude Code 接上 DeepSeek，Skill 一键跑起来"
date: "2026-06-06"
tags: [Skill, "Claude Code", DeepSeek, "AI Coding", 教程]
draft: false
summary: "从零开始，5 分钟把 Claude Code 接上 DeepSeek V4 Pro，再用 Skill 跑通一条真实工作流。国内环境可操作，跟着做就行。"
authors: [default]
---

如果你关注ai，最近不管刷小红书、刷抖音、看公众号，可能满屏都是这种标题——

"我用 Skill 一天写了 10 篇文章""一个 Skill 省掉我半天工作量""装上这个 Skill，代码审查全自动"。

你心动了。装上。然后傻眼了：

要么根本不触发，要么触发了跟普通聊天没区别，写个文件还要自己复制粘贴。跟那些宣传里说的"全自动""省半天"……不能说一模一样，只能说毫无关系。

你开始怀疑：是不是我装错了？是不是这个 Skill 写得太烂了？

**其实都不是。**

真相很简单：你只装了"说明书"，但没给说明书配一个能干活的人，也没给他一张能用的工作台。

打个比方你就懂了：

Skill 就像一份拉力赛路书——告诉你什么时候转弯、什么时候加速、什么时候检查车况。路书写得再细，开车的如果是驾校刚拿本的新手，车如果是辆没方向盘的报废车，你觉得能跑完吗？

所以公式很简单：

> **Skill 效果上限 = 模型选择 × 运行环境**

模型是开车的人。模型越强，理解路线、处理突发、控制节奏的能力就越好。

运行环境是车。Claude Code 这类工具提供项目上下文、文件读写、工具调用、Skill 发现——这是一台正经赛车，不是聊天框那个三蹦子。

今天这篇文章，我就手把手带你走完一条路：

**用 Claude Code 当赛车，用 DeepSeek 当赛车手，让 Skill 真正跑起来。**

全程国内互联网环境，不需要折腾，新手也能 5 分钟搞定。

## 第一步：搞到 DeepSeek 的 API Key

咱们先解决"车手"。

DeepSeek 目前是国内性价比最高的选择——V4 Pro 模型能力强、1M 超长上下文、Anthropic API 兼容可以直接对接 Claude Code，价格还比 Claude 官方便宜一截。

**三步走：**

1. 打开 `platform.deepseek.com`，注册账号（手机号或邮箱都行）。

![DeepSeek 开放平台登录注册](https://assets.zhangjian94cn.top/images/blog/claude-code-deepseek-skill-guide/deepseek-login.png)

2. 登录后进入控制台 → **API Keys** → **创建 API Key**。起个名字（比如"Claude Code"），复制 Key，**立刻保存**——关掉弹窗就再也看不到了。

![DeepSeek 创建 API Key](https://assets.zhangjian94cn.top/images/blog/claude-code-deepseek-skill-guide/deepseek-apikey-create.png)

3. 充值。不用多，先充个几十块能用很久。

![DeepSeek 充值页面](https://assets.zhangjian94cn.top/images/blog/claude-code-deepseek-skill-guide/deepseek-topup.png)

> ⚠️ **API Key 是你的车手通行证，不要截图发给任何人，不要贴在公开仓库里。**

搞定。Key 在手，往下走。

## 第二步：装上 Claude Code——你的"赛车"

现在解决"赛车"。

先说一个最容易搞混的点：**Claude Code ≠ Claude 网页版。** 网页版是聊天框，Claude Code 才是能跑 Skill 的工作台。它有两种入口：

- **App 端**：桌面版里的 Code 模式，图形界面，可以选项目、看 diff、审修改、多开会话——像一台完整的驾驶舱。
- **CLI 端**：终端里敲 `claude` 命令，适合老司机。

**如果你不是天天写命令行的开发者，我强烈建议用 App 端。** 体验好太多了。

下载入口在这里（macOS / Windows 都支持，Linux 走 CLI）：
```text
https://code.claude.com/docs/en/desktop-quickstart
```
我也把 App 安装包打包好了，不想翻官网的直接找我要。

装好 → 打开 Claude → 切到顶部 **Code** 标签 → 选你的项目文件夹。赛车就位。

**命令行用户：**
```bash
# macOS
brew install claude-code
# 或者 npm（需 Node.js >= 18，全平台通用）
npm install -g @anthropic-ai/claude-code
```
```bash
claude --version   # 弹出版本号 = 搞定
```

## 第三步：用 CC-Switch 一键切换模型

这是核心——**让 Claude 用上 DeepSeek。**

手动改 `~/.claude/settings.json` 当然可以，但我推荐新手先走 **CC-Switch**。它把繁琐的 JSON 配置变成填表式操作，点几下就行。

官网：`https://ccswitch.io/zh/`

![CC-Switch 主界面](https://assets.zhangjian94cn.top/images/blog/claude-code-deepseek-skill-guide/ccswitch-1.png)

**操作三步：**

**① 选目标** → 点顶部工具栏里的 **Claude Desktop Official** 图标。

![CC-Switch 添加模型配置](https://assets.zhangjian94cn.top/images/blog/claude-code-deepseek-skill-guide/ccswitch-add-model-2.png)

**② 加模型** → 点右侧橙色 **"+"** → 选 **DeepSeek** 预设 → 把第一步创建的 API Key 填进去。Base URL 已经帮你预设好了，你不用自己找。

![CC-Switch DeepSeek 配置完成](https://assets.zhangjian94cn.top/images/blog/claude-code-deepseek-skill-guide/ccswitch-deepseek-3.png)

![CC-Switch 填入 API Key](https://assets.zhangjian94cn.top/images/blog/claude-code-deepseek-skill-guide/ccswitch-deepseek-apikey-4.png)

**③ 开路由** —— 很多人卡在这一步，配完了发现用不了，跑回来问我怎么回事。问题就出在这里。

点左上角 **设置 → 路由**，三件事缺一不可：

- **本地路由**：运行中
- **路由总开关**：打开

![CC-Switch 打开设置](https://assets.zhangjian94cn.top/images/blog/claude-code-deepseek-skill-guide/ccswitch-setup-5.png)

- **路由启用**：**Claude 打开**（Codex / Gemini 先不用管）

![CC-Switch 打开 Claude 路由](https://assets.zhangjian94cn.top/images/blog/claude-code-deepseek-skill-guide/ccswitch-setup-open-router.png)

三步做完，保存启用。DeepSeek 这位赛车手就真正坐进 Claude 这台车里了。

![Claude + DeepSeek 联动成功](https://assets.zhangjian94cn.top/images/blog/claude-code-deepseek-skill-guide/claude+deepseek.png)

## 第四步：拿一个真实 Skill 跑起来

配置完了，别急着说"搞定"。大部分人就倒在这一步。

进你的项目目录，启动：

```bash
cd 你的项目
claude
```

进去之后先敲 `/status`，看一眼当前模型是不是 `deepseek-v4-pro[1m]`。不是？回去检查路由开了没。

**然后重点来了——你得给它一个 Skill 让它跑。**

很多新手到这儿会懵：我还没有 Skill 啊，怎么验证？

很简单：把我之前分享的 Skill 下载下来，放到一个目录里，然后告诉 Claude Code 这个目录在哪。Claude Code 会自动发现并加载它，不需要你手动"安装"任何东西。

放好之后，在 Claude Code 里说一句：

> "加载我放在 xxx 目录下的写作 Skill，帮我生成一篇文章草稿，主题是「AI 工具如何改变个人生产力」。"

如果它回复的时候告诉你"已触发写作 Skill"，并且真的在你指定的目录里生成了 `.md` 文件——恭喜，全套跑通了。

就这么简单。不用问"你好"，不用纠结配置对不对。**能跑通一个真实 Skill，就说明车手、赛车、路书三件套全部就位。**

## 关于 Skill 的小预告

你可能会问：Skill 到底怎么选？怎么写？怎么嵌入日常工作流？

简单说：Skill 就是一套 SOP 文件，告诉 Agent 什么时候触发、读什么、调什么工具、产出放哪、怎么验证。用不好 Skill，往往不是 Skill 写错了，而是**模型和环境没配对**——前面四步就是在解决这个问题。

至于 Skill 的进阶玩法……这篇先打住，**下一篇专门展开。** 你会知道怎么让 Skill 每天帮你省两小时。

今天记住一句话就够了：

> **先用对赛车 + 选对车手，Skill 才会从"装了很多"变成"真的能干活"。**

## 总结

回顾一下你刚才完成的四件事：

1. ✅ **注册 DeepSeek，拿到 API Key** — 高性价比赛车手就位。
2. ✅ **安装 Claude Code（App 或 CLI）** — 正经赛车，不是三蹦子。
3. ✅ **CC-Switch 配 DeepSeek + 开路由** — 车手上车，引擎点火。
4. ✅ **跑真实 Skill 验证** — 不是问"你好"，是跑完整圈赛道。

花几十块充值，你换来的是一个能长期运转的 AI 工作流底座。

模型会更新，价格会变化，工具会迭代。但这个思路不会过时：

> **先把工作流跑在正确的环境里，再给它配上合适的模型。好司机配好车，好 Skill 才能跑出好成绩。**

下一篇深入聊 Skill 的选、写、用。不见不散 🚀
