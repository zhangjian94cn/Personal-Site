#!/usr/bin/env tsx
/**
 * Content Validation Script
 *
 * Checks consistency between blog post frontmatter (portfolio: true)
 * and portfolio.yml configuration.
 *
 * - blogSlug in portfolio.yml must point to an existing blog post
 * - Blog posts with portfolio: true should be referenced in portfolio.yml
 *   (auto-adds a stub entry if missing)
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const PORTFOLIO_PATH = path.join(ROOT, 'content', 'portfolio.yml');

interface PortfolioProject {
    title: { zh: string; en: string };
    description: { zh: string; en: string };
    tags: string[];
    status: string;
    blogSlug?: string;
    externalLink?: string;
    projectPagePath?: string;
    featured?: boolean;
    visible?: boolean;
    imgSrc?: string;
}

interface PortfolioData {
    projects: PortfolioProject[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively find all .md files under a directory */
function findMarkdownFiles(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findMarkdownFiles(fullPath));
        } else if (entry.name.endsWith('.md')) {
            results.push(fullPath);
        }
    }
    return results;
}

/** Extract slug from a blog file path (filename without .md) */
function fileToSlug(filePath: string): string {
    return path.basename(filePath, '.md');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
    let hasErrors = false;
    let hasWarnings = false;
    let portfolioModified = false;

    // 1. Load portfolio.yml
    const portfolioRaw = fs.readFileSync(PORTFOLIO_PATH, 'utf-8');
    const portfolioData = yaml.load(portfolioRaw) as PortfolioData;

    // 2. Scan blog posts
    const blogFiles = findMarkdownFiles(BLOG_DIR);
    const blogSlugs = new Set(blogFiles.map(fileToSlug));

    // Build a map: slug → frontmatter for posts with portfolio: true
    const portfolioPosts = new Map<string, { title: string; summary: string; tags: string[]; filePath: string }>();
    for (const filePath of blogFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(content);
        if (data.portfolio === true && data.draft !== true) {
            portfolioPosts.set(fileToSlug(filePath), {
                title: data.title || fileToSlug(filePath),
                summary: data.summary || '',
                tags: data.tags || [],
                filePath,
            });
        }
    }

    // 2.5 Frontmatter quality checks
    for (const filePath of blogFiles) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const slug = fileToSlug(filePath);
        const relPath = path.relative(ROOT, filePath);

        // Check 1: CRLF line endings (break many YAML parsers)
        if (raw.includes('\r\n')) {
            console.error(`❌ ${relPath}: 包含 Windows 换行符 (CRLF)，会导致 YAML 解析失败`);
            console.error(`   → 运行: sed -i '' 's/\\r$//' ${relPath}\n`);
            hasErrors = true;
        }

        // Check 2: Duplicate frontmatter blocks (e.g. two --- ... --- sections)
        const fmMatches = raw.match(/^---$/gm);
        if (fmMatches && fmMatches.length > 2) {
            console.error(`❌ ${relPath}: 检测到多个 frontmatter 块 (${fmMatches.length / 2} 组 ---)，Contentlayer 只会读取第一个`);
            console.error(`   → 请合并为一个 frontmatter 块\n`);
            hasErrors = true;
        }

        // Check 3: Empty title or summary on non-draft posts
        const { data } = matter(raw);
        if (data.draft !== true) {
            if (!data.title || data.title.trim() === '') {
                console.error(`❌ ${relPath}: 非草稿文章的 title 为空`);
                hasErrors = true;
            }
            if (!data.summary || data.summary.trim() === '') {
                console.warn(`⚠️  ${relPath}: summary 为空，Featured Post 显示时会是空白`);
                hasWarnings = true;
            }
        }
    }

    // 3. Check: all blogSlug references in portfolio.yml point to existing blog posts
    const referencedSlugs = new Set<string>();
    for (const project of portfolioData.projects) {
        if (project.blogSlug) {
            referencedSlugs.add(project.blogSlug);
            if (!blogSlugs.has(project.blogSlug)) {
                console.error(`❌ portfolio.yml: blogSlug "${project.blogSlug}" 引用的文章不存在于 content/blog/ 中`);
                console.error(`   → 请检查文件是否已移至 drafts，并在 portfolio.yml 中删除或注释该项目\n`);
                hasErrors = true;
            }
        }
    }

    // 4. Check: blog posts with portfolio: true are referenced in portfolio.yml
    //    Auto-add stub entries for missing ones
    for (const [slug, postData] of portfolioPosts) {
        if (!referencedSlugs.has(slug)) {
            console.log(`📝 自动添加: 博客 "${postData.title}" (${slug}) 标记了 portfolio: true，正在添加到 portfolio.yml`);

            const newProject: PortfolioProject = {
                title: {
                    zh: postData.title,
                    en: postData.title,
                },
                description: {
                    zh: postData.summary || '// TODO: 请补充中文描述',
                    en: postData.summary || '// TODO: Please add English description',
                },
                tags: postData.tags,
                status: 'completed',
                blogSlug: slug,
            };

            portfolioData.projects.push(newProject);
            portfolioModified = true;
        }
    }

    // 5. Write back portfolio.yml if modified
    if (portfolioModified) {
        // Preserve the original comment header
        const commentHeader = portfolioRaw.split('\n')
            .filter(line => line.startsWith('#'))
            .join('\n');

        const newYaml = yaml.dump(portfolioData, {
            lineWidth: -1,  // don't wrap lines
            quotingType: '"',
            forceQuotes: false,
            noRefs: true,
        });

        fs.writeFileSync(PORTFOLIO_PATH, commentHeader + '\n\n' + newYaml, 'utf-8');
        console.log(`✅ portfolio.yml 已更新\n`);
    }

    // 6. Summary
    console.log('─'.repeat(50));
    console.log(`📊 校验摘要:`);
    console.log(`   博客文章总数: ${blogFiles.length}`);
    console.log(`   标记 portfolio: true 的文章: ${portfolioPosts.size}`);
    console.log(`   portfolio.yml 项目总数: ${portfolioData.projects.length}`);
    console.log(`   其中 blogSlug 引用: ${referencedSlugs.size}`);

    if (hasErrors) {
        console.error('\n❌ 校验失败，请修复上述问题后重新构建');
        process.exit(1);
    } else if (hasWarnings) {
        console.warn('\n⚠️  校验通过，但有告警');
    } else {
        console.log('\n✅ 校验通过');
    }
}

main();
