# 个人博客系统 (Personal Blog Site)

一个基于 [Next.js](https://nextjs.org) 15、Tailwind CSS 和 TypeScript 构建的现代化个人博客网站。支持 Markdown/MDX 渲染、LaTeX 公式、国际化以及基于 YAML 的内容管理。

## ✨ 特性

- **内容与代码分离**：所有内容集中在 `content/` 目录下，管理方便
- **LaTeX 公式支持**：完美支持行内和块级数学公式渲染
- **国际化 (i18n)**：内置中英文双语支持
- **MDX 支持**：博客文章支持 Markdown 和 React 组件混排
- **响应式设计**：基于 Tailwind CSS 的精美 UI
- **GitHub 风格代码高亮**

## 🚀 快速开始

1. **安装依赖**

```bash
npm install
```

2. **启动开发服务器**

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可预览。

## 📝 内容管理

详细内容管理指南请参阅 [CONTENT_GUIDE.md](CONTENT_GUIDE.md)。

- **站点配置**：编辑 `content/siteMetadata.yml`
- **个人简介**：编辑 `content/about.yml`
- **写博客**：在 `content/blog/` 目录下创建 `.mdx` 文件

## 🛠️ 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **内容处理**: Contentlayer2, JS-YAML
- **数学公式**: KaTeX, remark-math, rehype-katex

## 📦 部署

本项目可以直接部署到 Vercel：

1. Fork 本仓库
2. 在 Vercel 中导入项目
3. 部署即可（Vercel 会自动检测 Next.js 配置）

## 📄 License

MIT
