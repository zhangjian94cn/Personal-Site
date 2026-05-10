---
title: "产品经理最常用的 AI Skills，已经帮你打包好了"
date: "2026-05-10"
tags: ["AI 工具", Claude, 产品管理, Skill]
draft: false
summary: "AI 时代代码产能爆发，但好产品依然稀缺。因为产品的瓶颈不是代码，是决策。有人把 Teresa Torres、Marty Cagan 的方法论编码成了 65 个 AI Skill，你说一句 /discover，就能跑完整套产品发现流程。"
authors: [default]
---

![PM Skills Marketplace：从产品方法论到可执行基础设施](https://pub-3897d31468484cc8b335151ee1798271.r2.dev/images/blog/pm-skills-marketplace/pm-skills-marketplace-cover.png)

代码生产正在经历寒武纪大爆发。

Claude Code、Cursor、Codex，随便挑一个，一晚上能撸出一个完整的 Web 应用。以前需要团队搞一个月的东西，现在一个人加上 AI，几天就能出个 MVP。

但奇怪的是，**好产品并没有变多。**

反而是半成品在变多。能跑起来，但没人用。功能都有，但解决的不是真问题。UI 做得挺漂亮，用户留存却一塌糊涂。

为什么？

因为代码的瓶颈解决了，**产品决策的瓶颈暴露出来了**。

做什么、不做什么、先做什么、怎么验证——这些问题不是代码能解答的。这是产品经理的活儿。

## 一个好产品经理到底贵在哪

好的产品经理到底和普通产品经理差在哪？不是写文档的速度，不是画原型的效率，也不是沟通能力强不强——这些都是表象。

真正的差距在**思考框架**。

面对一个新产品机会，厉害的 PM 脑子里会自动跑一套流程：先拆解假设，再评估风险，然后设计最小验证实验——这套东西不是天生的，是读了十几本书、踩了无数坑之后沉淀下来的。

Teresa Torres 的持续发现习惯、Marty Cagan 的赋能团队、Alberto Savoia 的 Pretotyping、JTBD、北极星指标、OKR……每个方法论都很好，但问题是：**大部分方法论都活在书里和培训 PPT 里，没活在日常工作流里。**

看完书觉得「说得真对」，回到工位该怎么干还是怎么干。

这个问题困扰了产品管理领域十几年。直到 AI 时代——尤其是 Skill 这个概念出现之后——一个有意思的解法出现了。

## 有人已经把这些经验打包好了

他叫 Paweł Huryn，波兰人，做了 15 年产品经理，当过 CPO，创过业。他的产品管理 newsletter「The Product Compass」在 Substack 上有 10 万+订阅者，是这个领域全球排名第一。

他干了一件特别聪明的事——把自己这些年读过的 12 本产品管理经典，全拆开，重新编码成了 **65 个 AI 可以直接执行的 Skill**。

不是 prompt 合集，不是脑图，不是课程 PPT。是 AI 能按步骤自己跑的、有方法论骨架的工作流。

![Skill 和 Command 的区别：Skill 是知识单元，Command 是可执行工作流](https://pub-3897d31468484cc8b335151ee1798271.r2.dev/images/blog/pm-skills-marketplace/pm-skills-how-skills-work.png)

这套东西叫 **PM Skills Marketplace**，按产品管理的 8 个核心场景分成了 8 个插件：

![PM Skills Marketplace 的 8 个插件全貌](https://pub-3897d31468484cc8b335151ee1798271.r2.dev/images/blog/pm-skills-marketplace/pm-skills-plugins-overview.png)

产品发现、产品战略、日常执行、市场研究、数据分析、GTM 上市、营销增长、工具箱——基本覆盖了产品经理的所有工作场景。

## 拆开一个看看：/discover 到底跑了什么

光看列表没感觉。拆开 `/discover` 这条命令，看看它到底做了什么。

你跟 AI 说一句：

```
/discover AI 会议总结工具
```

它不会直接给你一份方案。它会按照 Teresa Torres 的方法论，帮你跑完一整套产品发现流程：

**第一步，创意发散。** 不是让 AI 随便列 10 条想法。它会从三个角色出发——产品经理视角、设计师视角、工程师视角——分别发散，再合并筛选。这叫「产品三角」，Marty Cagan 在《INSPIRED》里反复强调的东西。

**第二步，识别假设。** 每个想法拆成四类风险：用户会不会用（Value）、用不用得动（Usability）、商业上行不行（Viability）、技术上做不做得出来（Feasibility）。

**第三步，排优先级。** 用 Impact × Risk 矩阵，把高影响高风险的假设排到最前面。

**第四步，设计实验。** 新产品走 Pretotype 路线（假门测试），老产品走 A/B 测试。

四步跑完，你拿到的不是泛泛的建议，而是一份有方法论骨架、有优先级排序、有可执行实验的产品发现报告。

这跟直接问 ChatGPT「帮我做产品发现」的区别是什么？

就好比你去健身房，一种是自己瞎练，另一种是请了个教练——他不替你举铁，但会告诉你该做什么、每组几个、什么姿势不会受伤。

这些 Skill 就是教练。

而且 Command 之间还能接力——跑完 `/discover` 之后，它会提示你「要不要继续跑 `/strategy`？」。跟着提示走，整个产品工作流可以一路串下来。

## 怎么装、怎么用

说了这么多，实际用起来难不难？

如果你用 Claude Cowork（网页版，非开发者推荐），四步搞定：

1. 左下角点 Customize
2. Browse plugins → Personal → 点 +
3. 选 Add marketplace from GitHub
4. 输入 `phuryn/pm-skills`

8 个插件自动装好。之后你在对话里直接输 `/discover`、`/strategy`、`/write-prd` 这些命令就能用了。

如果你用 Claude Code（命令行），也就两步：

```bash
# 添加市场
claude plugin marketplace add phuryn/pm-skills

# 安装你需要的插件，比如产品发现
claude plugin install pm-product-discovery@pm-skills
```

8 个插件想装哪个装哪个。

有意思的是，Skill 文件本身就是通用的 Markdown 格式，不只是 Claude 能用。Gemini CLI、Cursor、Codex 都可以直接读取这些文件——把 `skills/` 目录里的 `.md` 文件复制到对应工具的 skill 目录就行。

给几个实际使用场景，你可以直接复制过去试：

**产品发现：**
```
/discover AI 会议总结工具，面向远程团队
```

**写 PRD：**
```
/write-prd 智能通知系统，解决用户被推送轰炸的问题
```

**做产品战略：**
```
/strategy B2B 项目管理工具，面向广告代理商
```

**竞品分析：**
```
/competitive-analysis 项目管理 SaaS 市场
```

每条命令跑完之后，AI 还会建议你下一步可以跑什么——比如做完 `/discover` 会问要不要继续 `/strategy`，做完 `/strategy` 会建议你 `/write-prd`。整个产品工作流可以一路串下来。

## 我觉得这件事真正有意思的地方

说实话，工具好不好用是一回事。我觉得这个项目真正值得关注的，是它背后的一个趋势。

回到开头说的问题——AI 时代，代码不再是瓶颈，决策才是。

而决策能力过去是怎么获取的？读书、上课、带项目、踩坑、复盘——本质上就是**经验的个人化沉淀**。每个人都得自己走一遍。

PM Skills Marketplace 做的事，说白了就是**把这些经验从「个人知识」变成了「可复用的基础设施」**。

一个 `/discover` 命令，背后是 Teresa Torres 一整本书的思考框架。一个 `/strategy` 命令，背后是三本书的战略方法论。你不需要记住方法论的每一步，AI 按步骤引导你走完。

![从方法论到可执行基础设施](https://pub-3897d31468484cc8b335151ee1798271.r2.dev/images/blog/pm-skills-marketplace/pm-skills-methodology-infrastructure.png)

这有点像什么呢？以前运维靠手工敲命令，后来有了自动化脚本；以前功能靠人肉实现，后来有了 API。现在，产品管理的方法论也在经历同一件事——被编码、被工程化、被可复用地封装起来。

以前你想用 Teresa Torres 的方法论做产品发现，要么读书，要么花钱请教练。

现在，一个开源的 Skill 文件就行。

**这才是 AI 真正改变工作方式的地方——不是替你写代码，而是把顶尖专家的思考方式变成人人可用的基础设施。**

你平时做产品决策会用 AI 辅助吗？用了之后体感怎么样？欢迎评论区聊聊。
