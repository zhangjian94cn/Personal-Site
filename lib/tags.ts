/**
 * Centralized tag management system
 * 
 * This file defines all allowed tags and their aliases.
 * Tags are validated during build time to ensure consistency.
 */

export const TAG_CATEGORIES = {
  // AI & Machine Learning
  AI: ['AI', 'LLM', 'ChatGLM', 'GPT', 'deep-learning', 'machine-learning', 'reinforcement-learning', 'computer-vision', 'DQN'],
  
  // Systems & Performance
  SYSTEMS: ['HPC', 'CUDA', 'GPU', 'AVX', 'SIMD', 'TBB', 'parallel-computing', 'optimization', 'profiling'],
  
  // Development Tools
  DEV: ['dev-tools', 'Docker', 'SSH', 'compilation', 'make', 'C++', 'Intel', 'VTune', 'oneDAL'],
  
  // Frameworks & Libraries
  FRAMEWORKS: ['Ray', 'LangChain', 'AutoGen'],
  
  // Techniques & Methods
  TECHNIQUES: ['Text2SQL', 'fine-tuning', 'LoRA', 'RAG', 'segmentation', 'SLAM', 'distributed-training'],
  
  // Web & Other
  WEB: ['web', 'encryption', 'Jekyll'],
  
  // Meta
  META: ['about', 'resume', 'announcement', 'blog', 'tutorial'],
  
  // Specific Technologies
  TECH: ['vector-db', 'multi-agent', 'architecture'],
} as const;

// Flatten all valid tags
export const VALID_TAGS = Object.values(TAG_CATEGORIES).flat();

// Tag aliases for convenience (e.g., Chinese -> English, shorthand -> full)
export const TAG_ALIASES: Record<string, string> = {
  // Chinese to English
  '深度学习': 'deep-learning',
  '机器学习': 'machine-learning',
  '强化学习': 'reinforcement-learning',
  '计算机视觉': 'computer-vision',
  '图像分割': 'segmentation',
  '性能优化': 'optimization',
  '并行计算': 'parallel-computing',
  '分布式训练': 'distributed-training',
  '微调': 'fine-tuning',
  '多智能体': 'multi-agent',
  '架构设计': 'architecture',
  '编译': 'compilation',
  '公告': 'announcement',
  '博客': 'blog',
  
  // Shorthand to full
  'DL': 'deep-learning',
  'ML': 'machine-learning',
  'RL': 'reinforcement-learning',
  'CV': 'computer-vision',
  'Perf': 'optimization',
  
  // Common variations
  'VectorDB': 'vector-db',
  'Vector DB': 'vector-db',
  'Multi-Agent': 'multi-agent',
  'Distributed Training': 'distributed-training',
};

/**
 * Normalize a tag using aliases
 */
export function normalizeTag(tag: string): string {
  return TAG_ALIASES[tag] || tag;
}

/**
 * Validate tags and return errors
 */
export function validateTags(tags: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const normalizedTags = tags.map(normalizeTag);
  
  normalizedTags.forEach((tag, index) => {
    if (!VALID_TAGS.includes(tag as any)) {
      const originalTag = tags[index];
      const suggestions = VALID_TAGS.filter(validTag => 
        validTag.toLowerCase().includes(tag.toLowerCase()) || 
        tag.toLowerCase().includes(validTag.toLowerCase())
      );
      
      const suggestionText = suggestions.length > 0 
        ? ` Did you mean: ${suggestions.join(', ')}?`
        : '';
      
      errors.push(`Invalid tag "${originalTag}"${suggestionText}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get all tags grouped by category
 */
export function getTagsByCategory() {
  return TAG_CATEGORIES;
}

/**
 * Get tag usage statistics (to be called with actual blog data)
 */
export function getTagStats(allTags: string[]): Record<string, number> {
  const stats: Record<string, number> = {};
  allTags.forEach(tag => {
    const normalized = normalizeTag(tag);
    stats[normalized] = (stats[normalized] || 0) + 1;
  });
  return stats;
}
