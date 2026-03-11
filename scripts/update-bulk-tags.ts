import * as fs from 'fs';
import * as path from 'path';

const contentDirectory = '/Users/zjah/Documents/code/Personal-Site/content/blog';

const tagMapping: Record<string, string[]> = {
    // AI
    'api-proxy-debugging.md': ['OpenClaw', 'DevOps'],
    'chatglm-serving.md': ['LLM'],
    'config-tuning.md': ['OpenClaw', 'Self-Hosted'],
    'dl-basis.md': ['Deep-Learning'],
    'doubao-openclaw.md': ['OpenClaw', 'LLM', 'AI赋能'],
    'gbt-build-fom-scratch-1.md': ['LLM', 'Deep-Learning'],
    'high-accuracy-segmentation.md': ['Deep-Learning'],
    'obsidian-openclaw.md': ['OpenClaw', 'AI-Agent', 'Obsidian'],
    'openclaw-tutorial-share.md': ['OpenClaw', '教程', 'AI赋能'],
    'rag-best-practices.md': ['LLM', 'Deep-Learning'],
    'rl-basics.md': ['Deep-Learning'],
    'superpoint.md': ['Deep-Learning'],
    'wecom-integration.md': ['OpenClaw', '企业微信', 'Self-Hosted'],
    'what-is-openclaw.md': ['OpenClaw', 'AI-Agent', 'Self-Hosted'],
    'windows-docker-deployment.md': ['OpenClaw', 'DevOps'],
    'xhs-skill-share.md': ['AI-Agent', 'AI赋能'],

    // Systems
    'avx-intro.md': ['HPC'],
    'cuda-optimization-tips.md': ['HPC'],
    'deploy-posthog-on-macmini.md': ['数据分析', 'Self-Hosted'],
    'llm-on-ray.md': ['LLM', 'HPC'],
    'makefile-advance.md': ['HPC'],
    'makefile-intro.md': ['HPC'],
    'nextjs-posthog-sdk-integration.md': ['数据分析', 'DevOps'],
    'onedal-intro.md': ['Deep-Learning'],
    'openclaw-wecom-architecture.md': ['企业微信', 'Self-Hosted', '网络'],
    'ssh-connect-container.md': ['DevOps'],
    'tbb-intro.md': ['HPC'],
    'tbb-sample-count-string.md': ['HPC'],
    'vtune-intro.md': ['HPC'],
    'why-self-hosted-posthog.md': ['数据分析', 'Self-Hosted'],
    'wireguard-vpn-migration_processed.md': ['网络', 'Self-Hosted'],

    // Meta & Web (No tags to update, but listed for completeness or untouched)
    'welcome.md': [],
    'jekyll-staticrypt-protected-post.md': []
};

function processDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.md')) {
            if (tagMapping[file]) {
                let content = fs.readFileSync(fullPath, 'utf8');

                // Find tags line, which can look like tags: [xxx, yyy] or tags: ["xxx", "yyy"]
                const tagLineRegex = /^tags:\s*\[.*?\]$/m;
                const mappedTags = tagMapping[file];

                const replaceString = `tags: [${mappedTags.map(t => `"${t}"`).join(', ')}]`;

                if (tagLineRegex.test(content)) {
                    content = content.replace(tagLineRegex, replaceString);
                    fs.writeFileSync(fullPath, content);
                    console.log(`Updated frontmatter tags in: ${file}`);
                } else {
                    console.warn(`Warning: Could not find 'tags: [...]' line in ${file}`);
                }
            } else {
                console.warn(`Warning: No mapping found for ${file}`);
            }
        }
    }
}

console.log('Starting tag update...');
processDirectory(contentDirectory);
console.log('Tag update complete.');
