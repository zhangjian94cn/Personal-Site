# 内容管理指南 | Content Management Guide

本文档介绍如何管理和更新网站内容。所有可编辑内容都集中在 `content/` 目录下。

## 📁 目录结构

```
content/
├── siteMetadata.yml    # 站点配置（标题、社交链接、导航等）
├── about.yml           # 关于页面内容
├── authors/            # 作者信息
│   └── default.mdx
├── blog/               # 博客文章
│   └── *.mdx
└── locales/            # 国际化文本
    ├── zh.yml
    └── en.yml
```

---

## 🔧 站点配置 (`siteMetadata.yml`)

编辑此文件来更新网站基本信息：

```yaml
# 基本信息
title: 章坚的博客
author: Zhang Jian
description: AI 技术探索与生活分享
siteUrl: https://your-domain.com

# 作者信息
profile:
  name: Zhang Jian
  avatar: /images/avatar.png
  occupation: Algorithm Engineer
  email: your@email.com

# 社交链接
social:
  github: https://github.com/username
  googleScholar: https://scholar.google.com/...
```

---

## 👤 关于页面 (`about.yml`)

编辑此文件来更新个人简介、工作经历、发表论文和项目：

```yaml
bio:
  zh: |
    **Hi，我是章坚。** 目前任职于...
  en: |
    **Hi, I'm Zhang Jian.** Currently...

experiences:
  - company:
      zh: 公司中文名
      en: Company Name
    role:
      zh: 职位中文
      en: Position
    period: "2024.03 - Now"
```

---

## ✍️ 博客文章 (`blog/*.mdx`)

在 `content/blog/` 目录下创建 `.mdx` 文件：

```mdx
---
title: "文章标题"
date: "2024-01-15"
tags: ["AI", "LLM"]
draft: false
summary: "文章摘要"
---

正文支持 Markdown 和 LaTeX 公式：$E = mc^2$
```

---

## 🔢 LaTeX 公式

```markdown
行内：$E = mc^2$
块级：$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$
```

---

## 🚀 本地预览

```bash
npm run dev -- --webpack
```

访问 http://localhost:3000 预览更改。
