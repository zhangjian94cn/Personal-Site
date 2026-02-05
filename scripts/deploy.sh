#!/bin/bash
# 一键部署脚本 - 构建并推送到 GitHub Pages

set -e  # 遇到错误立即退出

echo "🔨 开始构建..."
npm run build

echo "📦 准备部署..."
cd out

# 初始化 Git（如果需要）
if [ ! -d ".git" ]; then
  git init
  git remote add origin git@github.com:zhangjian94cn/zhangjian94cn.github.io.git
fi

echo "🚀 推送到 GitHub Pages..."
git add -A
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git branch -M main
git push -f origin main

echo "✅ 部署完成！"
echo "🌐 请访问: https://zhangjian94cn.top/"
