#!/usr/bin/env tsx
/**
 * Publish a draft or unpublish a post
 * 
 * Usage:
 *   npm run publish <filename>      # Publish draft to blog
 *   npm run unpublish <filename>    # Move post back to drafts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const CATEGORIES = ['AI', 'Systems', 'Web', 'Meta', 'Interview'];
const CONTENT_DIR = path.join(process.cwd(), 'content');
const BLOG_DIR = path.join(CONTENT_DIR, 'blog');
const DRAFTS_DIR = path.join(CONTENT_DIR, 'drafts');

const isUnpublish = process.argv.includes('--unpublish');
const filename = process.argv.filter(a => !a.startsWith('-') && !a.includes('publish.ts')).pop();

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

async function publish() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // List drafts
  if (!fs.existsSync(DRAFTS_DIR)) {
    console.log('❌ 草稿目录不存在');
    rl.close();
    process.exit(1);
  }

  const drafts = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  
  if (drafts.length === 0) {
    console.log('📭 没有草稿');
    rl.close();
    return;
  }

  console.log('\n📄 可发布的草稿:\n');
  
  let targetFile = filename;
  if (!targetFile) {
    drafts.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    const answer = await prompt(rl, '\n选择要发布的草稿 (输入数字): ');
    const idx = parseInt(answer) - 1;
    targetFile = drafts[idx];
  }

  if (!targetFile || !drafts.includes(targetFile)) {
    console.log('❌ 无效选择');
    rl.close();
    process.exit(1);
  }

  // Select category
  const category = await selectOption(rl, '\n发布到哪个分类?', CATEGORIES);

  // Move file
  const srcPath = path.join(DRAFTS_DIR, targetFile);
  const destDir = path.join(BLOG_DIR, category);
  const destPath = path.join(destDir, targetFile);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Update draft: false in frontmatter
  let content = fs.readFileSync(srcPath, 'utf-8');
  content = content.replace(/^draft:\s*true/m, 'draft: false');
  
  fs.writeFileSync(destPath, content);
  fs.unlinkSync(srcPath);

  console.log(`\n✅ 已发布: ${path.relative(process.cwd(), destPath)}`);
  rl.close();
}

async function unpublish() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Find all posts
  const allPosts: { category: string; file: string }[] = [];
  CATEGORIES.forEach(cat => {
    const catDir = path.join(BLOG_DIR, cat);
    if (fs.existsSync(catDir)) {
      fs.readdirSync(catDir)
        .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
        .forEach(f => allPosts.push({ category: cat, file: f }));
    }
  });

  if (allPosts.length === 0) {
    console.log('📭 没有已发布的文章');
    rl.close();
    return;
  }

  console.log('\n📄 已发布的文章:\n');
  allPosts.forEach((p, i) => console.log(`  ${i + 1}. [${p.category}] ${p.file}`));

  const answer = await prompt(rl, '\n选择要取消发布的文章 (输入数字): ');
  const idx = parseInt(answer) - 1;
  const target = allPosts[idx];

  if (!target) {
    console.log('❌ 无效选择');
    rl.close();
    process.exit(1);
  }

  // Move to drafts
  const srcPath = path.join(BLOG_DIR, target.category, target.file);
  const destPath = path.join(DRAFTS_DIR, target.file);

  if (!fs.existsSync(DRAFTS_DIR)) {
    fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  }

  // Update draft: true in frontmatter
  let content = fs.readFileSync(srcPath, 'utf-8');
  content = content.replace(/^draft:\s*false/m, 'draft: true');
  
  fs.writeFileSync(destPath, content);
  fs.unlinkSync(srcPath);

  console.log(`\n✅ 已移回草稿: ${path.relative(process.cwd(), destPath)}`);
  rl.close();
}

if (isUnpublish) {
  unpublish().catch(console.error);
} else {
  publish().catch(console.error);
}
