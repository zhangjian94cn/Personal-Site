#!/usr/bin/env tsx
/**
 * Create a new blog post interactively
 * 
 * Usage:
 *   npm run new
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const CATEGORIES = ['AI', 'Systems', 'Web', 'Meta', 'Interview'];
const CONTENT_DIR = path.join(process.cwd(), 'content');
const BLOG_DIR = path.join(CONTENT_DIR, 'blog');
const DRAFTS_DIR = path.join(CONTENT_DIR, 'drafts');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function selectOption(rl: readline.Interface, question: string, options: string[]): Promise<string> {
  console.log(question);
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
  return new Promise((resolve) => {
    rl.question('选择 (输入数字): ', (answer) => {
      const idx = parseInt(answer) - 1;
      resolve(options[idx] || options[0]);
    });
  });
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n📝 创建新文章\n');
  console.log('─'.repeat(40));

  // Get title
  const title = await prompt(rl, '文章标题: ');
  if (!title) {
    console.log('❌ 标题不能为空');
    rl.close();
    process.exit(1);
  }

  // Get category
  const category = await selectOption(rl, '\n分类:', CATEGORIES);

  // Get tags
  const tagsInput = await prompt(rl, '\n标签 (逗号分隔，如 LLM, deep-learning): ');
  const tags = tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  // Draft mode
  const draftAnswer = await prompt(rl, '\n保存为草稿? (y/N): ');
  const isDraft = draftAnswer.toLowerCase() === 'y';

  // Generate slug
  const slug = slugify(title);
  const filename = `${slug}.md`;

  // Determine target directory
  const targetDir = isDraft ? DRAFTS_DIR : path.join(BLOG_DIR, category);
  const targetPath = path.join(targetDir, filename);

  // Check if file exists
  if (fs.existsSync(targetPath)) {
    console.log(`\n❌ 文件已存在: ${targetPath}`);
    rl.close();
    process.exit(1);
  }

  // Create directory if needed
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Generate content
  const date = new Date().toISOString().split('T')[0];
  const tagsStr = tags.length > 0 ? `[${tags.join(', ')}]` : '[]';
  
  const content = `---
title: "${title}"
date: "${date}"
tags: ${tagsStr}
draft: ${isDraft}
summary: ""
authors: ["default"]
---

## 引言

在这里开始写作...

## 正文

## 总结
`;

  // Write file
  fs.writeFileSync(targetPath, content, 'utf-8');

  const relativePath = path.relative(process.cwd(), targetPath);
  console.log('\n' + '─'.repeat(40));
  console.log(`✅ 已创建: ${relativePath}`);
  console.log(`\n💡 使用编辑器打开文件开始写作:`);
  console.log(`   code ${relativePath}`);

  rl.close();
}

main().catch(console.error);
