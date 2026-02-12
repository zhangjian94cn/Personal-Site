#!/usr/bin/env tsx
/**
 * Validate blog post tags against the centralized tag definition
 * 
 * Usage:
 *   npm run validate-tags          # Validate all tags
 *   npm run validate-tags --fix    # Auto-fix tags using aliases
 */

import { allBlogs as allBlogsRaw } from '../.contentlayer/generated/index.mjs';
import { validateTags, normalizeTag, VALID_TAGS, getTagStats } from '../content/config/tags';

// Type assertion for dynamic import
interface BlogPost {
  title: string;
  tags?: string[];
  _raw: {
    sourceFileName: string;
    sourceFilePath: string;
  };
}
const allBlogs = allBlogsRaw as BlogPost[];
import * as fs from 'fs';
import * as path from 'path';

const shouldFix = process.argv.includes('--fix');

console.log('🔍 Validating blog tags...\n');

let hasErrors = false;
const allTags: string[] = [];

allBlogs.forEach(post => {
  const tags = post.tags || [];
  allTags.push(...tags);
  
  const { valid, errors } = validateTags(tags);
  
  if (!valid) {
    hasErrors = true;
    console.error(`❌ ${post.title} (${post._raw.sourceFileName})`);
    errors.forEach(error => console.error(`   ${error}`));
    
    if (shouldFix) {
      // Auto-fix by normalizing tags
      const normalizedTags = tags.map(normalizeTag);
      const { valid: fixedValid } = validateTags(normalizedTags);
      
      if (fixedValid) {
        // Update the file
        const filePath = path.join(process.cwd(), post._raw.sourceFilePath);
        let content = fs.readFileSync(filePath, 'utf-8');
        
        // Replace tags array
        const oldTagsLine = `tags: [${tags.map(t => `"${t}"`).join(', ')}]`;
        const newTagsLine = `tags: [${normalizedTags.join(', ')}]`;
        
        content = content.replace(oldTagsLine, newTagsLine);
        fs.writeFileSync(filePath, content);
        
        console.log(`   ✅ Auto-fixed to: [${normalizedTags.join(', ')}]`);
      }
    }
    console.log('');
  }
});

// Print statistics
console.log('\n📊 Tag Statistics:');
console.log('─'.repeat(50));

const stats = getTagStats(allTags);
const sortedTags = Object.entries(stats).sort((a, b) => b[1] - a[1]);

sortedTags.forEach(([tag, count]) => {
  const isValid = VALID_TAGS.includes(tag as any);
  const icon = isValid ? '✓' : '⚠';
  console.log(`${icon} ${tag.padEnd(30)} ${count} post${count > 1 ? 's' : ''}`);
});

console.log('\n' + '─'.repeat(50));
console.log(`Total unique tags: ${sortedTags.length}`);
console.log(`Valid tags: ${sortedTags.filter(([tag]) => VALID_TAGS.includes(tag as any)).length}`);
console.log(`Invalid tags: ${sortedTags.filter(([tag]) => !VALID_TAGS.includes(tag as any)).length}`);

if (hasErrors && !shouldFix) {
  console.log('\n💡 Tip: Run with --fix flag to auto-correct tags using aliases');
  process.exit(1);
} else if (hasErrors && shouldFix) {
  console.log('\n✨ Tags have been auto-fixed. Please rebuild Contentlayer.');
  process.exit(0);
} else {
  console.log('\n✅ All tags are valid!');
  process.exit(0);
}
