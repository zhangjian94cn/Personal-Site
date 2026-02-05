#!/usr/bin/env tsx
/**
 * Display content statistics
 * 
 * Usage:
 *   npm run stats
 */

import * as fs from 'fs';
import * as path from 'path';

const CATEGORIES = ['AI', 'Systems', 'Web', 'Meta', 'Interview'];
const CONTENT_DIR = path.join(process.cwd(), 'content');
const BLOG_DIR = path.join(CONTENT_DIR, 'blog');
const DRAFTS_DIR = path.join(CONTENT_DIR, 'drafts');

interface PostInfo {
  title: string;
  date: string;
  category: string;
  tags: string[];
  path: string;
}

function parsePostMeta(filePath: string, category: string): PostInfo | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = match[1];
    const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
    const dateMatch = frontmatter.match(/date:\s*["']?([^"'\n]+)["']?/);
    const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]*)\]/);

    return {
      title: titleMatch?.[1] || path.basename(filePath),
      date: dateMatch?.[1] || 'N/A',
      category,
      tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/["']/g, '')) : [],
      path: filePath,
    };
  } catch {
    return null;
  }
}

function main() {
  console.log('\n📊 站点统计\n');
  console.log('━'.repeat(50));

  // Count posts by category
  const categoryStats: Record<string, number> = {};
  const allPosts: PostInfo[] = [];

  CATEGORIES.forEach(cat => {
    const catDir = path.join(BLOG_DIR, cat);
    if (fs.existsSync(catDir)) {
      const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
      categoryStats[cat] = files.length;
      files.forEach(f => {
        const post = parsePostMeta(path.join(catDir, f), cat);
        if (post) allPosts.push(post);
      });
    } else {
      categoryStats[cat] = 0;
    }
  });

  // Count drafts
  let draftCount = 0;
  if (fs.existsSync(DRAFTS_DIR)) {
    draftCount = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx')).length;
  }

  // Total
  const totalPosts = Object.values(categoryStats).reduce((a, b) => a + b, 0);

  console.log(`\n📚 已发布文章: ${totalPosts} 篇`);
  console.log('─'.repeat(50));
  
  Object.entries(categoryStats)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const bar = '█'.repeat(Math.min(count, 20));
      console.log(`  ${cat.padEnd(12)} ${count.toString().padStart(3)} ${bar}`);
    });

  console.log(`\n📝 草稿: ${draftCount} 篇`);

  // Recently updated
  if (allPosts.length > 0) {
    const sorted = allPosts.sort((a, b) => b.date.localeCompare(a.date));
    const recent = sorted.slice(0, 5);
    
    console.log('\n📅 最近更新:');
    console.log('─'.repeat(50));
    recent.forEach(p => {
      console.log(`  ${p.date}  [${p.category}] ${p.title.substring(0, 35)}`);
    });
  }

  // Tag frequency
  const tagCounts: Record<string, number> = {};
  allPosts.forEach(p => {
    p.tags.forEach(t => {
      if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (topTags.length > 0) {
    console.log('\n🏷️  热门标签:');
    console.log('─'.repeat(50));
    console.log('  ' + topTags.map(([tag, count]) => `${tag}(${count})`).join('  '));
  }

  console.log('\n');
}

main();
