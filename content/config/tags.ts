/**
 * Centralized tag management system
 * 
 * This file defines all allowed tags and their aliases.
 * Tags are validated during build time to ensure consistency.
 */

export const TAG_CATEGORIES = {
  // AI方向
  AI: ['OpenClaw', 'AI-Agent', 'LLM', 'Deep-Learning'],

  // 应用场景
  SCENARIOS: ['AI赋能', 'Obsidian', '企业微信'],

  // Systems方向
  SYSTEMS: ['HPC', 'DevOps', 'Self-Hosted', '网络', '数据分析'],

  // 内容类型
  CONTENT: ['教程'],
} as const;

// Flatten all valid tags
export const VALID_TAGS = Object.values(TAG_CATEGORIES).flat();

// Tag aliases for convenience (e.g., Chinese -> English, shorthand -> full)
export const TAG_ALIASES: Record<string, string> = {
  // AI方向别名
  'openclaw': 'OpenClaw',
  'AI Agent': 'AI-Agent',
  'ai-agent': 'AI-Agent',
  'Agent': 'AI-Agent',
  'AI助手': 'AI-Agent',
  'Skill': 'AI-Agent',
  'Skills': 'AI-Agent',
  'baoyu-skills': 'AI-Agent',
  'Claude Code': 'AI-Agent',
  '大模型': 'LLM',
  'AI工具': 'LLM',
  'deep-learning': 'Deep-Learning',
  '深度学习': 'Deep-Learning',
  '机器学习': 'Deep-Learning',
  '强化学习': 'Deep-Learning',

  // 应用场景别名
  'AI 生活方式': 'AI赋能',
  '超级个体': 'AI赋能',
  '免费资源': 'AI赋能',
  '信息图': 'AI赋能',
  '小红书': 'AI赋能',
  '本地化': 'Obsidian',
  'wecom': '企业微信',

  // Systems方向别名
  'C++': 'HPC',
  'Ray': 'HPC',
  'docker': 'DevOps',
  'dev-tools': 'DevOps',
  'debugging': 'DevOps',
  'api-proxy': 'DevOps',
  'nextjs': 'DevOps',
  'self-hosted': 'Self-Hosted',
  '家庭服务器': 'Self-Hosted',
  '私有部署': 'Self-Hosted',
  'WireGuard': '网络',
  'VPN': '网络',
  '网络架构': '网络',
  'posthog': '数据分析',
  'analytics': '数据分析'
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
