---
title: "Paperclip：57.8k Star，这个开源项目想让你一键下载一家公司"
date: "2026-04-23"
tags: ["AI-Agent", "AI赋能"]
draft: false
summary: "深度拆解 Paperclip——一个把 AI Agent 组织成「零人类公司」的开源编排平台。57.8k Star、9.9k Fork，它不是又一个 Agent 工具，而是一套完整的公司操作系统：组织架构、预算管控、治理审批、目标对齐，一个都不少。"
authors: ["default"]
---

想象一个场景：你同时开了 20 个 Claude Code 终端窗口。

一个在写前端，一个在改后端，一个在跑测试，还有几个你已经忘了它们在干什么。你切到某个窗口，发现它因为一个权限问题卡了两个小时，而你毫不知情。更糟的是，电脑一重启，所有上下文全部丢失。

这不是假设——这是 Paperclip 创始人 Dotta 在运营自动化对冲基金时的真实日常。

他的解决方案不是再造一个更好的终端，而是造了一家**公司**。

## 57.8k Star 的公司操作系统

**57,800 Star。9,900 Fork。2,293 Commits。6 个正式版本。**

Paperclip 的 Slogan 直截了当：**"Open-source orchestration for zero-human companies."（零人类公司的开源编排系统。）**

![Paperclip 的零人类公司架构：你是董事会，AI Agent 是从 CEO 到一线员工的完整组织](https://assets.zhangjian94cn.top/images/blog/paperclip-zero-human-company/paperclip-concept.png)

注意，它说的不是"更好的 Agent 工具"，不是"AI 工作流平台"，也不是"多 Agent 框架"。它说的是**公司**——有 CEO、CTO、CMO，有组织架构、有预算、有审批流、有工单系统的公司。

而你，是这家公司的**董事会**。

## 不是工具，不是框架，是什么？

Paperclip 官网用了四个"Not"来定义自己：

- **Not a chatbot**——没有聊天界面，Agent 有工作，不是有对话窗口
- **Not an agent framework**——不教你怎么构建 Agent，教你怎么运营一家由 Agent 组成的公司
- **Not a workflow builder**——没有拖拽式流水线，Paperclip 建模的是公司，不是流程
- **Not a prompt manager**——Agent 自带 prompt 和模型，Paperclip 管的是它们工作的**组织**

一句话概括社区的评价：**"OpenClaw is an employee, Paperclip is the company."**（OpenClaw 是一个员工，Paperclip 是一家公司。）

## 九大核心模块

![Paperclip 的 9 大核心模块](https://assets.zhangjian94cn.top/images/blog/paperclip-zero-human-company/paperclip-modules.png)

### 🏢 组织架构（Org Chart）

你的 Agent 不是自由职业者——它们有老板、有职位、有岗位说明书。

CEO Agent 向你（董事会）汇报，CTO Agent 向 CEO 汇报，开发 Agent 向 CTO 汇报。汇报关系、委派关系、决策权限，全部按组织架构流动。

### 🎯 目标对齐（Goal Alignment）

"把 AI 记事本 App 做到月收入 100 万。"

你设定公司级目标，每个任务自动携带完整的目标溯源链——Agent 不仅知道要做什么，还知道**为什么**要做。这不是简单的任务描述，而是从公司使命到具体工单的完整上下文传递。

### 💓 心跳机制（Heartbeats）

Agent 按照预设的心跳周期醒来，检查工作，执行任务，然后休眠。

这个设计非常聪明——不是 24/7 全速燃烧 Token，而是**按需激活**。委派请求沿着组织架构上下流动，任务分配会唤醒对应的 Agent，跨部门请求会自动路由到最合适的 Agent。

### 💰 成本控制（Cost Control）

每个 Agent 有月度预算。花到 80% 弹出告警，花到 100% 自动暂停，新任务被阻断。

你可以按 Agent、按任务、按项目、按目标追踪成本。哪个 Agent 最贵、哪个任务最烧 Token、哪个项目超预算——一目了然。作为董事会，你随时可以手动覆盖预算限制。

### 🛡️ 治理层（Governance）

**"Autonomy is a privilege you grant, not a default."**（自主权是你授予的特权，不是默认值。）

这句话定义了 Paperclip 的治理哲学：

- Agent 不能未经批准就**招聘**新 Agent
- CEO Agent 不能执行未经你审核的**战略**
- 配置变更有版本控制，错误操作可以**回滚**
- 你可以随时暂停、恢复、覆盖、重新分配、终止任何 Agent

### 🎫 工单系统（Ticket System）

所有沟通通过工单进行。每条指令、每个回复、每个工具调用、每个决策点——全部记录在案。

- **结构化工单**：清晰的负责人、状态、讨论线程
- **完整追踪**：每个 API 调用、工具调用、决策链路可见
- **不可变审计日志**：只追加，不修改，不删除

### 🏭 多公司隔离（Multi-Company）

一次部署，运行无数家公司。完全数据隔离，一个控制面板管理你的整个"公司组合"。

适合场景：同时运营多条业务线、平行测试不同策略、复用组织架构模板。

### 📱 移动端就绪（Mobile Ready）

手机上监控和管理你的"自治企业"。配合 Tailscale 等工具，随时随地远程管理。

### 🔌 自带 Agent（BYOA）

任何 Agent，任何运行时，一张组织架构图。**"If it can receive a heartbeat, it's hired."**（只要能接收心跳信号，就可以入职。）

支持 Claude Code、OpenClaw、Codex、Cursor——或者任何能响应 HTTP webhook 的自定义 Agent。

## 技术深度：为什么说 Paperclip "把编排细节做对了"

Paperclip 官方列出了 6 个技术亮点，每一个都不是表面功夫：

| 特性 | 说明 |
|------|------|
| **原子执行** | 任务签出和预算扣减是原子操作——不会出现两个 Agent 做同一件事，也不会超支 |
| **持久 Agent 状态** | Agent 在心跳间恢复上次的任务上下文，而不是从零开始 |
| **运行时技能注入** | Agent 在运行时学习 Paperclip 的工作流和项目上下文，无需重新训练 |
| **带回滚的治理** | 审批门禁强制执行，配置变更有版本号，错误变更可安全回滚 |
| **目标感知执行** | 任务携带完整的目标祖先链，Agent 始终看到"Why"而不只是标题 |
| **可移植的公司模板** | 导出/导入组织架构、Agent 配置和技能，自动清理密钥、处理冲突 |

技术栈上，Paperclip 是纯 TypeScript 方案（97.7%）：Node.js 后端 + React 前端 + 内嵌 PostgreSQL。本地运行时单进程就能搞定一切，生产环境可以接外部 PostgreSQL。

## Clipmart：一键下载一家公司

这是 Paperclip 最前卫的概念——**Clipmart**，即将上线的"公司应用商店"。

![Clipmart：下载一个预构建的 AI 公司，部署到你的 Paperclip 实例](https://assets.zhangjian94cn.top/images/blog/paperclip-zero-human-company/paperclip-clipmart.png)

想象你打开 Clipmart，浏览预构建的公司模板：

- **内容工厂**——SEO、博客、社交媒体全自动
- **交易公司**——分析、执行、风控、合规
- **电商运营**——商品上架、客服、库存、广告
- **YouTube 工作室**——脚本、剪辑、缩略图、排期
- **开发团队**——PM、工程师、QA、DevOps 全栈
- **销售团队**——拓客、外联、跟进、成交

选一个，点击 Deploy，几秒钟内一整套组织架构、Agent 配置、技能模板就导入到你的 Paperclip 实例中。

**"Download a business"**——这个概念放在 2024 年会被当成科幻，但在 2026 年的 AI Agent 浪潮中，它正在变成现实。

## 冷静审视："Productivity Theater" 的风险

57.8k Star 的光环下，社区也有冷静的声音。

批评者指出了一个核心风险：**"Productivity Theater"（生产力剧场）**。

- 搭建一个有 CEO、CTO、CMO 的完整组织架构**很酷**，但花了两天时间配置组织架构后，实际产出了什么？
- Agent 有了汇报关系和审批流，但增加的管理层级**真的提高了效率**，还是只是增加了复杂度？
- 对于简单任务，一个 Claude Code 窗口可能比整套公司架构**更高效**。

Paperclip 的定位很明确：**"If you have one agent, you probably don't need Paperclip. If you have twenty — you definitely do."**

它不适合所有人。它适合已经在规模化使用 Agent、并且被管理复杂度压垮的团队。

## Paperclip vs Multica：两种哲学

刚好在前一篇文章中我深度拆解了 [Multica](https://zhangjian94cn.top/blog/multica-managed-agents-platform)，这两个项目经常被放在一起比较。它们代表了 AI Agent 管理的两条路线：

![Paperclip vs Multica：公司模式 vs 队友模式](https://assets.zhangjian94cn.top/images/blog/paperclip-zero-human-company/paperclip-vs-multica.png)

| | Paperclip | Multica |
|---|-----------|---------|
| **核心隐喻** | Agent = 员工 | Agent = 队友 |
| **你的角色** | 董事会 / CEO | 项目经理 |
| **管理模型** | 组织架构 + 预算 + 审批 | 看板 + 技能 + 运行时 |
| **运行模式** | 自治优先（心跳 + 24/7） | 人机协作优先 |
| **Star 数** | 57.8k | 19.5k |
| **技术栈** | TypeScript 97.7% | TypeScript 53% + Go 43% |
| **适合场景** | 多 Agent 自治运营 | 人机混合团队 |

**选 Paperclip** 如果你想建立一家 Agent 公司——你是投资人 + 董事会，Agent 从 CEO 到一线员工自主运营。

**选 Multica** 如果你想让 Agent 融入现有团队——你还是老板，Agent 是并肩工作的同事。

两者不是竞争关系，而是**光谱的两端**。

## 一键上手

```bash
# 最简安装（本地信任模式）
npx paperclipai onboard --yes

# 局域网模式（支持手机访问）
npx paperclipai onboard --yes --bind lan

# 手动安装
git clone https://github.com/paperclipai/paperclip.git
cd paperclip
pnpm install
pnpm dev
```

API 服务启动在 `http://localhost:3100`，内嵌 PostgreSQL 自动创建——无需额外配置数据库。

要求：Node.js 20+、pnpm 9.15+

## 结语：当"管理 Agent"变成"经营公司"

Paperclip 做了一件很有趣的事：它**重新定义了抽象层**。

大多数 AI 工具把抽象层放在"任务"级别——给 Agent 一个任务，看它完成。Paperclip 把抽象层推到了"组织"级别——不是管理一个 Agent 做一件事，而是管理一家公司做一门生意。

这是一个大胆的赌注。它赌的是，2026 年之后的世界，不再是"人 + 工具"的模式，而是"人 + 公司"的模式——这家公司的员工碰巧不是人类。

57.8k Star 说明了很多人对这个赌注的看法。

但最终的答案不在 Star 数里，而在真正用 Paperclip 跑起来的那些"零人类公司"的利润表里。

> 📌 项目地址：[github.com/paperclipai/paperclip](https://github.com/paperclipai/paperclip)
>
> 📌 官网：[paperclip.ing](https://paperclip.ing)
>
> 📌 安装：`npx paperclipai onboard --yes`
>
> 📌 姊妹篇：[Multica 深度解析](https://zhangjian94cn.top/blog/multica-managed-agents-platform)
