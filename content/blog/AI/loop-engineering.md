---
title: "别再盯着 AI 干活了"
date: "2026-06-14"
tags: [AI-Agent, LLM, AI赋能]
draft: false
summary: "从最近硅谷热议的 Loop Engineering 说起：AI agent 真正的提效，不是你盯着它每一步跑，而是把任务设计成目标、验证、反馈、记忆和停止条件组成的工作循环。"
authors: [default]
---

![从 prompt 到 loop：别再盯着 AI 干活了](https://assets.zhangjian94cn.top/images/blog/loop-engineering/loop-engineering-cover.png)

现在用 AI 干活，最累的场景可能不是自己写代码。是你坐在屏幕前，盯着 AI 干活。

它在终端里跑命令，你盯着。它说测试通过了，你不放心，又手动跑一遍。它跑偏了，你赶紧拉回来。折腾一圈下来，表面上是 AI 在干活，实际上你一直在旁边当监工。

这也是为什么最近硅谷那边开始频繁讨论一个词：Loop Engineering。

Anthropic Claude Code 负责人 Boris Cherny 有句话很出圈："我不再直接 prompt Claude。我在写 loops，让 loops 去 prompt Claude。**我的工作变成了写 loops。**"

我当时看到这句话，脑子里蹦出来的不是"又来了一个 buzzword"。而是我每天盯着 AI 干活那个很具体的疲惫感——

**我仍然是那个 feedback loop。**

## 你累，是因为真正的控制回路还是你自己

用 Addy Osmani 在《Loop Engineering》里的描述：过去两年我们的使用方式，是你打一句、读回复、打下一句——**agent 是个工具，你全程捏着它**。他说这个阶段快结束了。

为什么？

因为这种模式下，所有关键判断都在你脑子里。什么叫完成，在你脑子里。什么叫失败，在你脑子里。什么时候该停，在你脑子里。

AI 看起来是在自动干活，但你永远是那个控制回路里缺不了的螺丝。它每走一步，你得判断一步。它说做完了，你还得亲自验证一遍。

Loop Engineering 的想法很直接：**把你从"那个手动 prompt agent 的人"替换掉。** 你不再每次打指令，你设计一个系统替你打——它找到活、分派出去、检查结果、记录下来、决定下一步。

## 一个 Loop 长什么样：六件套

那这个系统到底是什么？就是一堆 prompt 循环跑吗？

不是。Addy 把这套东西拆成了六个构件，我现在给 agent 派活也按这个框架来：

**① Automations（自动化触发器）**

loop 的心跳。不是每次你手工敲一条指令启动，而是定时触发——每天早上 9 点扫一遍 CI 失败、自动分派修复任务，修完回收结果。Claude Code 里用 `/loop` 设置定时任务，`/goal` 更激进——一直跑到你的验证条件为真才停，而且**每轮判断由一个独立小模型完成**，不是执行者自评。

**② Worktrees（工作区隔离）**

每个 agent 在独立的 git 分支和目录里工作，互不踩脚。两个 agent 同时改代码，一个修 bug 一个重构，各自在隔离 checkout 里跑，不会出现"我改的文件被他覆盖了"。Claude Code 用 `git worktree --worktree` 实现，Codex 每个 thread 自带隔离。

**③ Skills（项目知识固化）**

把项目约定、构建步骤、"上次踩过的坑"写成 `SKILL.md` 文件。agent 每次启动自动加载，不用每轮重新解释"我们怎么跑测试"、"为什么不要动支付模块"。Addy 原话说：**没有 skill，loop 每轮从零推导你的项目；有了 skill，它会累积。**

**④ Plugins & Connectors（外部连接器）**

让 agent 不只是"告诉你修好了"，而是自己开 PR、关联 Linear ticket、等 CI 绿了自动 ping 频道通知你。MCP 协议让 Claude Code 和 Codex 共用同一套连接器——读 issue tracker、查数据库、调 staging API、发 Slack 消息。

**⑤ Sub-agents（独立执行 / 验收者）**

写代码的人不能给自己的作业打分。一个 agent 探索，一个实现，一个按照 spec 验收。Addy 说得很直白：**"A verifier you actually trust is the only reason you can walk away."** 你能放心走开，靠的就是一个你信得过的验收者。这一条很关键，后面单独展开。

**⑥ State / Memory（外部记忆）**

一个 markdown 文件、Linear board 或 GitHub issue，活在对话之外，记录"做过了什么"和"下一步是什么"。Agent 会忘——每一次新的对话，上下文清零。但文件不会。Addy 原话：**"The agent forgets. The repo doesn't."**

这六个东西拼在一起，就是一套完整的六件套：

| 构件 | 在 Loop 中的角色 | Claude Code | Codex |
|------|-----------------|-------------|-------|
| Automations | 定时发现 + 分派任务 | `/loop`, `/goal`, cron, hooks | Automations tab, `/goal` |
| Worktrees | 并行 agent 文件隔离 | `git worktree`, `--worktree` | 内置 per-thread |
| Skills | 项目知识固化复用 | `SKILL.md`，`$name` 调用 | `SKILL.md`，隐式匹配 |
| Plugins/Connectors | 对接外部工具系统 | MCP servers + plugins | MCP + plugins |
| Sub-agents | maker/checker 分离 | `.claude/agents/`，agent teams | `.codex/agents/` TOML |
| Memory | 跨对话状态记录 | `AGENTS.md`, progress files | Markdown / Linear connector |

![六件套驱动闭环：Automations 为心跳，Skills 为记忆，Sub-agents 分离 maker 与 checker](https://assets.zhangjian94cn.top/images/blog/loop-engineering/minimal-agent-loop.png)

## 把六件套落到一个任务里

光有概念不够，拿一个具体的任务看看。

让 AI 写一个用户注册接口。差的方式是："帮我写一个注册接口，要能处理邮箱重复。"AI 写完跑了个测试，告诉你过了。但你打开一看——它的测试只测了"正常注册成功"，根本没测"邮箱重复时返回 409"。它为了通过，只写了最简单的 happy path。**让同一个模型给自己的作业打分，它永远下手太轻。**

好的方式不是写更长的 prompt，而是把任务本身写成一个可以循环的形状：

```text
目标：实现 POST /api/auth/register，含邮箱校验、密码强度、邮箱重复检测。
范围：只能改 src/auth/register.ts、register.test.ts，不碰登录和 token 逻辑。
验证：跑 pnpm test src/auth/register.test.ts。测试必须覆盖以下场景：
      - 正常注册成功（201）
      - 邮箱格式非法（400 + INVALID_EMAIL）
      - 邮箱已被注册（409 + EMAIL_EXISTS）
      - 密码不足 8 位（400 + WEAK_PASSWORD）
反馈：如果任一场景未通过，先列出场景名、实际返回值 vs 期望值、修复假设。
记忆：把"已验证通过的场景"写进 TASKS.md，下一轮先读。
预算：最多 4 轮；同一场景第 4 轮后仍失败，停止并列出已尝试方案。
```

提前把测试场景列死在任务描述里，AI 就不能只写一个最简单的正常流程蒙混过关——它必须把边界情况和异常分支都覆盖到。

这里要说清楚一件事：六件套不是六样都塞进这段任务描述里的。Automations、Worktrees、Plugins 是**跑 loop 的基础设施**——定时触发、隔离工作区、对接外部系统，它们在任务之外搭好。真正能写进这一段任务描述里的，是另外几件：Skills（项目约定，比如"不碰登录和 token"）、验证、反馈、记忆、预算。上面这段文字，就是这几件落到一行代码任务里的样子。

## 最关键的一刀：做的和验的必须分开

六件套里，Sub-agents 这一条我想单独拎出来讲，因为大多数跑不起来的 loop，都是栽在这里。

回到刚才那个注册接口。为什么 AI 会只写 happy path？因为是它自己决定"怎么算做完"的。而让执行者定义验收标准，就跟让学生给自己的试卷打分一样——它总能给出一个让自己满意的分数。

所以那段任务描述里，验证条件是提前写死在外面的——四个测试场景，每个都有明确的期望返回值。这一步不是细节，是整个 loop 能不能信得过的关键。

Anthropic 在讲 agent workflow 时把这个叫 evaluator-optimizer 模式——一个负责生成，另一个负责判断。放到日常工作里不需要搞得很复杂：用测试当验收者，用 CI 当验收者，用一个独立上下文的 subagent 当验收者。关键只有一条：**做的和验的，必须是不同的 agent。不要让执行者自己宣布胜利。**

## 拆开一个真实的 loop：DST 自动抓到一个时序 Bug

说了这么多构件，拿一个真实案例拆开看看，一个 loop 到底是怎么跑完一圈的。

Datadog 的工程师用 AI agent 写了一个兼容 Redis 协议的 Rust 实现，叫 redis-rust。他们配了一套叫 DST（确定性模拟测试）的验证套件——它会注入各种故障，再检查数据有没有丢、状态有没有乱。有一次，这套件抓到了一个非常隐蔽的 bug。

**先是触发。** DST 注入磁盘故障——写入进行到一半，IO 中断。agent 观察输出，发现数据丢了。

**接着诊断。** agent 读 DST 的失败报告：内存里的截断操作发生在了磁盘同步之前。换句话说，代码先在内存里"以为"写好了，磁盘上还没落盘——这时候 crash，数据就没了。

**然后修复并验证。** agent 改成 Copy-on-Write：磁盘确认写入成功之前，不动内存里的原数据。改完重跑 DST——同样的故障注入，数据没丢。

**最后记录并停止。** agent 把根因、修复策略、验证结果写进变更日志，然后停。

这件事真正有意思的地方，是 Datadog 工程师自己那句话："DST 指出来之后显而易见，但代码 review 几乎不可能发现。"因为这个 bug 的触发条件需要精确的时序——IO 中断和内存操作之间那几十毫秒的窗口。人眼逐行看 diff，看不到时序 bug。但 DST 不需要盯着看，它 5 秒跑完，给一个 pass 或 fail。agent 拿到 fail，就知道要修。

这才是 loop 真正的价值：**用一个便宜、自动化、可重复的检查，替代人坐在屏幕前逐行判断。**

## 别光跑，还得会停

Firecrawl 的工程师在分享 loop 设计经验时，强调了三个非协商的硬守卫：

1. **硬迭代上限**。不是"差不多就停"，是一个确切的数字，比如 5 轮。
2. **空转检测**。如果连续两轮改动没有产生任何有意义的变化，直接停。
3. **花费上限**。token 或金额封顶。Uber 今年已经把工程师的 AI 工具月费卡在 $1,500/人——不是没钱，是一个季度就烧完了全年预算。

没有这三条，你跑的不是 loop，是一张无限额发票。

## 说到底，loop 跑不跑，看验证成本

绕了一圈，Loop Engineering 指向的问题其实很简单：**Loop 能不能跑，不取决于任务有多难、模型有多强，取决于你的验证成本有多低。**

如果验证是免费的——CI 绿灯、lint 零报错、测试全绿——你就可以放心让 loop 跑，哪怕任务很难。Blake Crosley 在《Loops Win Where Verification Is Cheap》中举了几个典型例子：修 flaky test（验证就是"测试套件变绿"）、给 PR 做 rebase（验证就是"CI 重新通过"）、依赖版本升级（验证就是"所有测试 + changelog 兼容性检查通过"）——这些都可以无人值守，因为验证成本几乎为零。

但如果验证是昂贵的——需要人逐行读 diff、需要产品判断、需要架构决策——loop 再聪明，你也不敢走开。Blake 给了一条很实用的判断标准：**如果你的任务验证成本跟"从手机上看一眼报告就能决定过不过"是一个级别，那它适合无人 loop。如果需要开电脑、打开 IDE、逐行看，那你就还得坐在屏幕前。**

所以真正要练的不是写 prompt。是把任务改造成**可验证的形状**。一个任务，你能不能拆到"验证是机器可判定的"这个粒度？能拆到，loop 就好使。拆不到，你就得继续盯着。

![验证成本越低，越适合无人值守——从人工盯屏到自动验证的迁移地图](https://assets.zhangjian94cn.top/images/blog/loop-engineering/verification-cost-ladder.png)

## 最后

Loop Engineering 这个词会不会变成 buzzword，我不确定。但它指向的那个疲惫感是真的。

Addy 在文末给了一句话，我觉得不需要再加工：**"Build the loop like someone who intends to stay the engineer, not just the person who presses go."**

设计 loop 时要像一个打算继续当工程师的人——你要理解每一步在做什么、为什么要这样检查、为什么这里要停下来。Loop 不是你偷懒的方式，是你把判断力从人脑挪到系统里的方式。

你不盯着它，不是因为信任它。

是因为边界已经设定好了。它跑不出去。

参考说明：本文核心框架和六件套构件体系参考自 Addy Osmani《Loop Engineering》（2026-06-07）；Datadog redis-rust 的 DST bug 案例引自其官方技术博客《Harness-first agents》；三个硬守卫和 Uber 预算数据参考自 Firecrawl blog；验证成本阶梯的观点来自 Blake Crosley《Loops Win Where Verification Is Cheap》。Boris Cherny 和 Peter Steinberger 的发言源自 Addy Osmani 文章的引用和讨论。

你现在用 AI agent 干活，会不会也盯着它盯得很累？有没有试过把验证拆出来让它自己跑？欢迎评论区聊聊。
