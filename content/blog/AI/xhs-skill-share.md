---
title: "用 AI Skill 自动生成小红书图文系列：原理拆解 + 实操教程 + 资源下载"
date: "2026-03-10"
tags: ["AI-Agent", "AI赋能"]
draft: false
summary: "基于 GitHub 8.2k Star 的 baoyu-skills 项目，拆解如何用 Markdown 驱动的 Skill 系统让 AI 自动生成小红书图文系列。附完整安装教程和 Skill 包下载。"
authors: [default]
---

GitHub 上一个叫 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) 的项目，8200 Star，904 Fork，今天迭代到了 v1.59.0。

它里面有一个 Skill 叫 `baoyu-xhs-images`，做的事情是：你给它一篇文章，它自动拆解内容、规划每页信息、选择视觉风格和排版布局，然后逐张生成一套可直接发布的小红书信息图系列。

我前两天测了一下，效果出乎意料。这篇文章拆解一下它是怎么做到的，最后提供 Skill 包下载，你可以直接用。

## 效果：11 种内置风格

先看最终产物。这是我实际跑出来的结果——每种风格对应不同的使用场景：

| 风格 | 适用场景 | 风格 | 适用场景 |
|------|----------|------|----------|
| **cute** | 少女风种草、好物推荐 | **fresh** | 健康饮食、自然生活 |
| **warm** | 探店故事、生活记录 | **bold** | 避坑指南、干货清单 |
| **minimal** | 极简金句、文艺分享 | **retro** | 复古怀旧、年代感 |
| **pop** | 潮流分享、年轻文化 | **notion** | 知识卡片、效率工具 |
| **chalkboard** | 教程笔记、手把手教学 | **study-notes** | 备考攻略、学习笔记 |
| **screen-print** | 海报质感、影评书评 | | |

这些不是 AI 随机画的——每种风格背后有一份 Markdown 格式的设计规范（后面会详细讲），定义了配色方案、字体风格、装饰元素、以及最佳搭配的布局类型。

## 工作原理：Skill = AI 的工作手册

在深入之前，先理解一个概念：**Skill 是什么。**

Skill 不是代码，不是 API，不是插件。它是一组 Markdown 文档——你用自然语言告诉 AI "怎么做"这件事。AI 读完这些文档，就掌握了对应的工作能力。

把 Skill 想象成你给新入职的设计师写的一份**交接文档**：这是我们的设计规范、这是出图的标准流程、这是每种风格的色板。设计师看完就知道怎么干活了。

区别在于，这个"设计师"7×24小时不休息，几分钟出一整套。

### XHS Skill 的文件结构

```
baoyu-xhs-images/
├── SKILL.md                    # 核心指令（600行）：工作流程定义
└── references/
    ├── presets/                # 11 种风格的设计规范
    │   ├── cute.md            #   配色、装饰、字体、布局搭配
    │   ├── notion.md
    │   ├── chalkboard.md
    │   └── ...
    ├── elements/              # 视觉元素规范
    │   ├── canvas.md          #   画布尺寸、安全区
    │   ├── typography.md      #   中文排版规范
    │   ├── decorations.md     #   装饰元素库
    │   └── image-effects.md   #   图片效果定义
    ├── config/                # 配置参考
    │   ├── first-time-setup.md#   首次使用引导
    │   ├── preferences-schema.md
    │   └── watermark-guide.md
    └── workflows/             # 工作流模板
        ├── analysis-framework.md  # 内容分析框架
        ├── outline-template.md    # 大纲规划模板
        └── prompt-assembly.md     # Prompt 组装方法
```

**一共不到 100KB 的 Markdown 文件，定义了一个完整的小红书图文设计系统。**

### 四步工作流

打开 `SKILL.md`，核心流程分四步：

**Step 0：偏好设置**

首次使用时，AI 会问你几个问题：要不要加水印（比如 @GeekZ）、默认风格用什么、图片存哪里。答案保存在 `EXTEND.md` 里，下次直接读取。

**Step 1：内容分析**

AI 读完你的文章后，会做一个结构化分析：

```markdown
## Content Classification
- Primary Type: 干货教程
- Tone: 专业、实用、接地气

## Hook Analysis
- Opening Hook: "装是装上了，然后呢？"
- Core Value: 一条语音消息 → 笔记自动归档
- Unique Angle: 从最刚需场景切入

## Key Points Extraction
1. 痛点: 笔记散落在多个 App
2. 解决方案: OpenClaw + Obsidian 自动归档
3. Obsidian 优势: 本地化、AI 可直接读写
4. 趋势洞察: Agent 成为软件一等公民
```

这个分析决定了后续选什么风格、出几张图、每张图的重点。

**Step 2：大纲规划（Smart Confirm）**

基于分析结果，AI 规划一个"滑动流程"——小红书用户是一页一页滑的，所以每张图的信息量和叙事节奏必须精心设计：

```
P1 Cover (sparse布局):  钩子标题 + 大面积留白
    ↓
P2 Problem (comparison布局):  痛点可视化对比
    ↓
P3 Solution (flow布局):  解决方案流程图
    ↓
P4 Value (balanced布局):  核心价值点卡片
    ↓
P5 Ending (sparse布局):  CTA 行动号召
```

这里有个设计巧思：**布局不是统一的**。封面和结尾用 sparse（大留白），内容页按信息类型匹配——对比型内容用 comparison，流程型用 flow，列表型用 balanced。这让整套图既有节奏感，又不会视觉疲劳。

**Step 3：图片生成**

大纲确认后，AI 为每张图组装完整的 prompt。一条 prompt 大概长这样（简化版）：

```
Create a TALL PORTRAIT image (3:4 aspect ratio, 900x1200px).

Visual Style: notion
- Hand-drawn line art, intellectual aesthetic
- Palette: #2D2D2D (primary), #F5F0EB (background), #4A90D9 (accent)
- Font style: Clean rounded sans-serif, monospaced accents
- Decorations: Geometric shapes, line doodles, checkbox elements

Layout: flow
- Title at top, flow diagram in center, result at bottom

Content:
- Title: "一条消息，自动归档"
- Flow: 手机发消息 → AI整理 → 存入Obsidian
- Result badge: "记录成本降到接近零"

Watermark: "GeekZ" (bottom-right, subtle)
```

**关键机制：Reference Chain。** 第一张图（封面）生成后，作为下一张的视觉参考传入。后续每一张都参考前一张——确保整套图的配色、线条风格、装饰元素完全一致。

这解决了 AI 生图最大的痛点：每张图长得不一样。

## 实操：从零跑通全流程

### 前置条件

1. **Claude Code**（或 Cursor + Claude 模型）
2. **Node.js 环境**（图片生成脚本需要）
3. **至少一个图片生成 API Key**：
   - [Google Gemini](https://ai.google.dev/) — 推荐，效果最好，支持 reference image
   - [OpenAI](https://platform.openai.com/) — 备选
   - [DashScope 通义万象](https://dashscope.console.aliyun.com/) — 国内推荐，无需翻墙

### Step 1：下载 Skill 包

**[📦 点击下载 baoyu-xhs-skills.zip](/downloads/baoyu-xhs-skills.zip)**

包含两个 Skill：
- `baoyu-xhs-images` — 小红书图文生成（核心）
- `baoyu-image-gen` — 图片生成后端（Google / OpenAI / DashScope 统一接口）

### Step 2：安装到项目

```bash
# 解压后，复制到 Claude Code 项目的 skills 目录
unzip baoyu-xhs-skills.zip
cp -r skills/baoyu-xhs-images your-project/.claude/skills/
cp -r skills/baoyu-image-gen your-project/.claude/skills/
```

> 也可以用完整仓库安装：`git clone https://github.com/JimLiu/baoyu-skills`，然后在 Claude Code 里执行 `/plugin` 注册。

### Step 3：配置 API Key

```bash
mkdir -p .baoyu-skills

cat > .baoyu-skills/.env << 'EOF'
# Google Gemini（推荐，支持 reference image）
GOOGLE_API_KEY=your_key_here
GOOGLE_IMAGE_MODEL=gemini-3-pro-image-preview

# 或 OpenAI
# OPENAI_API_KEY=your_key_here
# OPENAI_IMAGE_MODEL=gpt-image-1.5

# 或 DashScope 通义万象（国内推荐）
# DASHSCOPE_API_KEY=your_key_here
# DASHSCOPE_IMAGE_MODEL=z-image-turbo
EOF
```

Provider 选择逻辑：如果你只配了一个 Key，自动用那个；配了多个，默认用 Google。

### Step 4：生成第一套图文

在 Claude Code 中：

```
帮我把下面这段内容做成小红书图文系列：

[粘贴你的文章内容]
```

AI 会依次执行：偏好设置（首次）→ 内容分析 → 展示大纲让你确认 → 逐张生成图片。

你也可以指定风格和保存位置：

```
用 chalkboard 风格做，图片保存到 ./my-xhs-output/
```

### Step 5：自定义偏好

创建 `.baoyu-skills/baoyu-xhs-images/EXTEND.md`：

```markdown
## 水印设置
- 启用水印: 是
- 水印内容: @你的小红书ID

## 默认配置
- 默认风格: auto（自动匹配内容类型）
- 默认图片质量: 2k
- 默认语言: zh

## 保存设置
- 默认输出目录: ./xhs-output/
```

## 进阶玩法

### 自定义风格 Preset

打开 `references/presets/cute.md`，你会看到类似这样的结构：

```markdown
# cute 风格

## 色彩
- 主色调: #FFB6C1 (淡粉), #FFD700 (鹅黄)
- 背景色: #FFF5F5
- 强调色: #FF69B4

## 典型元素
- 爱心 ❤️ / 星星 ⭐ / 蝴蝶结 🎀
- 圆角矩形、气泡、彩虹

## 字体
- 可爱手写体、圆润无衬线

## 最佳搭配布局
- balanced, comparison, sparse
```

复制一份，修改配色和元素描述，就是你自己的品牌风格。

### 批量对比不同风格

```
分别用 cute、notion、chalkboard 三种风格生成同一篇文章的图文，让我对比一下
```

### Reference Chain 控制

如果你有一张特别满意的图想作为基准：

```
用这张图作为 reference，生成剩下的内容页：./my-cover.png
```

## 不止小红书

baoyu-skills 这个仓库远不止小红书一个 Skill。看一下完整的能力矩阵：

| 类别 | Skill | 功能 |
|------|-------|------|
| 内容生成 | `baoyu-xhs-images` | 小红书图文（11风格 × 8布局） |
| 内容生成 | `baoyu-infographic` | 通用信息图（20布局 × 17风格） |
| 内容生成 | `baoyu-cover-image` | 文章封面（5维组合，54种变化） |
| 内容生成 | `baoyu-slide-deck` | PPT 演示文稿 |
| 内容生成 | `baoyu-comic` | 技术教程漫画 |
| AI 后端 | `baoyu-image-gen` | 统一图片生成（Google/OpenAI/DashScope） |
| 工具 | `baoyu-translate` | 三挡精度翻译 |
| 发布 | `baoyu-post-to-wechat` | 发布到公众号 |
| 发布 | `baoyu-post-to-x` | 发布到 Twitter/X |

整个项目是 MIT 协议开源的，你可以自由修改和商用。

## 总结

这套方案的核心价值不在于"帮你画几张图"——而是用 Markdown 文档驱动 AI 完成了一整条**从文本到可发布图文**的生产链路。

更有意思的是它的设计哲学：所有"能力"都是 Markdown 文件定义的，不是黑盒代码。你可以读懂每一行，可以修改每一个细节，可以加上自己的设计系统。

这才是 Agent 时代最值得关注的范式：**不写代码，写文档；不开发功能，定义 Skill。**

***

**资源下载：**

- 📦 [baoyu-xhs-skills.zip](/downloads/baoyu-xhs-skills.zip) — 独立 Skill 包（含 11 种风格 + 图片生成后端）
- 🔗 [baoyu-skills GitHub](https://github.com/JimLiu/baoyu-skills) — 完整仓库（包含所有 Skill）

微信公众号「**GeekZ的知行录**」回复「**小红书**」也可以获取资源包。

后续我会写一篇端到端部署教程——从写完文章到自动生成图文、再到一键发布到小红书，整个链路全部自动化。敬请关注。
