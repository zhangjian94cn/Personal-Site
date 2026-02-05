# Personal Blog Site

[中文文档](README.zh-CN.md) | English

A modern personal blog website built with [Next.js](https://nextjs.org) 15, Tailwind CSS, and TypeScript. Supports Markdown/MDX rendering, LaTeX formulas, i18n, and YAML-based content management.

## ✨ Features

- **Content-Code Separation**: All content in `content/` directory
- **LaTeX Support**: Inline and block math formula rendering
- **i18n**: Built-in Chinese/English bilingual support
- **MDX Support**: Mix Markdown with React components
- **Responsive Design**: Beautiful UI with Tailwind CSS
- **Interactive Hero**: Golden Spiral animation with parallax effects
- **GitHub-style Code Highlighting**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to preview.

## 📝 Content Management

See [CONTENT_GUIDE.md](CONTENT_GUIDE.md) for detailed content management guide.

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run new`       | Create a new blog post interactively |
| `npm run stats`     | Display content statistics           |
| `npm run publish`   | Publish a draft                      |
| `npm run list-tags` | List all available tags              |

## 🚀 Deployment

### One-Click Deploy to GitHub Pages

```bash
npm run deploy
```

This will:

1. Build the project
2. Push static files to `zhangjian94cn.github.io`

### Manual Deploy

```bash
npm run build
cd out && git add -A && git commit -m "Deploy" && git push -f origin main
```

### Deploy to Vercel

1. Fork this repository
2. Import project in Vercel
3. Deploy (Vercel auto-detects Next.js config)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Content**: Contentlayer2, JS-YAML
- **Math**: KaTeX, remark-math, rehype-katex
- **Animation**: Framer Motion

## 📄 License

MIT
