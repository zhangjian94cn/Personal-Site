#!/usr/bin/env tsx
/**
 * List all available tags with their categories
 * 
 * Usage:
 *   npm run list-tags
 */

import { TAG_CATEGORIES, TAG_ALIASES } from '../lib/tags';

console.log('📚 Available Blog Tags\n');
console.log('═'.repeat(60));

Object.entries(TAG_CATEGORIES).forEach(([category, tags]) => {
  console.log(`\n${category}:`);
  console.log('─'.repeat(60));
  tags.forEach(tag => {
    // Find aliases for this tag
    const aliases = Object.entries(TAG_ALIASES)
      .filter(([_, target]) => target === tag)
      .map(([alias]) => alias);
    
    const aliasText = aliases.length > 0 
      ? `  (aliases: ${aliases.join(', ')})`
      : '';
    
    console.log(`  • ${tag}${aliasText}`);
  });
});

console.log('\n' + '═'.repeat(60));
console.log('\n💡 Tip: You can use aliases (e.g., 深度学习, DL) when writing posts.');
console.log('   They will be automatically normalized to standard tags.');
