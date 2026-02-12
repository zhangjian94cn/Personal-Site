#!/usr/bin/env node
/**
 * Cross-platform deploy script for GitHub Pages
 * Works on Windows, macOS, and Linux
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

async function main() {
  const projectRoot = process.cwd();
  const outPath = path.join(projectRoot, OUT_DIR);

  log('🔨 Starting build process...', 'green');
  
  // Step 1: Build contentlayer first
  log('\n📄 Building Contentlayer...', 'yellow');
  run('npx contentlayer2 build');
  
  // Step 2: Build Next.js
  log('\n📦 Building Next.js static export...', 'yellow');
  run('npm run build');
  
  // Check if out directory exists
  if (!fs.existsSync(outPath)) {
    log('❌ Build failed: out directory not found', 'red');
    process.exit(1);
  }
  
  log('\n🚀 Preparing deployment...', 'yellow');
  
  // Step 3: Initialize git in out directory
  process.chdir(outPath);
  
  const gitDir = path.join(outPath, '.git');
  if (!fs.existsSync(gitDir)) {
    log('Initializing git repository...', 'cyan');
    run('git init');
    run(`git remote add origin ${DEPLOY_REPO}`);
  }
  
  // Step 4: Add and commit
  run('git add -A');
  
  const date = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const commitResult = run(`git commit -m "Deploy: ${date}"`, { ignoreError: true });
  
  if (!commitResult) {
    log('No changes to commit', 'yellow');
  }
  
  // Step 5: Push to remote
  log('\n📤 Pushing to GitHub Pages...', 'yellow');
  run(`git branch -M ${DEPLOY_BRANCH}`);
  run(`git push -f origin ${DEPLOY_BRANCH}`);
  
  log('\n✅ Deployment complete!', 'green');
  log('🌐 Visit: https://zhangjian94cn.github.io/', 'green');
}

main().catch((error) => {
  log(`\n❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});
