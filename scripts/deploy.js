#!/usr/bin/env node
/**
 * Cross-platform deploy script for GitHub Pages
 * Works on Windows, macOS, and Linux
 *
 * Optimizations:
 * - Always uses a fresh .git to prevent history bloat (force push anyway)
 * - Cleans out/ before build to prevent stale files
 * - Reports build size and push timing
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DEPLOY_REPO = 'git@github.com:zhangjian94cn/zhangjian94cn.github.io.git';
const DEPLOY_BRANCH = 'main';
const OUT_DIR = 'out';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function run(command, options = {}) {
  log(`> ${command}`, 'cyan');
  try {
    execSync(command, { 
      stdio: 'inherit', 
      shell: true,
      ...options 
    });
    return true;
  } catch (error) {
    if (!options.ignoreError) {
      log(`Command failed: ${command}`, 'red');
      process.exit(1);
    }
    return false;
  }
}

function getDirectorySize(dirPath) {
  try {
    const output = execSync(`du -sh "${dirPath}" 2>/dev/null`, { encoding: 'utf8' }).trim();
    return output.split('\t')[0];
  } catch {
    return 'unknown';
  }
}

async function main() {
  const startTime = Date.now();
  const projectRoot = process.cwd();
  const outPath = path.join(projectRoot, OUT_DIR);

  log('🔨 Starting build process...', 'green');
  
  // Step 1: Clean out/ to prevent stale files (preserve nothing)
  if (fs.existsSync(outPath)) {
    log('\n🧹 Cleaning previous build output...', 'yellow');
    fs.rmSync(outPath, { recursive: true, force: true });
  }

  // Step 2: Build contentlayer first
  log('\n📄 Building Contentlayer...', 'yellow');
  run('npx contentlayer2 build');
  
  // Step 3: Build Next.js
  log('\n📦 Building Next.js static export...', 'yellow');
  run('npm run build');
  
  // Check if out directory exists
  if (!fs.existsSync(outPath)) {
    log('❌ Build failed: out directory not found', 'red');
    process.exit(1);
  }
  
  // Report build size
  const buildSize = getDirectorySize(outPath);
  log(`\n📊 Build output size: ${buildSize}`, 'green');
  
  log('\n🚀 Preparing deployment...', 'yellow');
  
  // Step 4: Always initialize a fresh git repo (we force push anyway,
  // so there's no benefit to keeping history — it only bloats .git/)
  process.chdir(outPath);
  
  const gitDir = path.join(outPath, '.git');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }
  run('git init');
  run(`git remote add origin ${DEPLOY_REPO}`);
  
  // Step 5: Add and commit
  run('git add -A');
  
  const date = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const commitResult = run(`git commit -m "Deploy: ${date}"`, { ignoreError: true });
  
  if (!commitResult) {
    log('No changes to commit', 'yellow');
  }
  
  // Step 6: Push to remote
  log('\n📤 Pushing to GitHub Pages...', 'yellow');
  const pushStart = Date.now();
  run(`git branch -M ${DEPLOY_BRANCH}`);
  run(`git push -f origin ${DEPLOY_BRANCH}`);
  const pushTime = ((Date.now() - pushStart) / 1000).toFixed(1);
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`\n✅ Deployment complete!`, 'green');
  log(`📊 Push: ${pushTime}s | Total: ${totalTime}s | Size: ${buildSize}`, 'green');
  log('🌐 Visit: https://zhangjian94cn.top/', 'green');
}

main().catch((error) => {
  log(`\n❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});
