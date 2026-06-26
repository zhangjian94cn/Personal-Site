import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import yaml from 'js-yaml';

const ROOT = process.cwd();

function readFile(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('portfolio page exposes the Web/Product category and paper-tide tag mapping', () => {
  const pageSource = readFile('src/app/portfolio/page.tsx');

  assert.match(pageSource, /"Web\/Product"/);
  assert.match(pageSource, /"Vue": "Web\/Product"/);
  assert.match(pageSource, /"Vite": "Web\/Product"/);
  assert.match(pageSource, /"Hono": "Web\/Product"/);
  assert.match(pageSource, /"Pinia": "Web\/Product"/);
});

test('portfolio.yml includes the paper-tide project entry wired to the static project page', () => {
  const portfolioData = yaml.load(readFile('content/portfolio.yml')) as {
    projects?: Array<Record<string, unknown>>;
  };

  const project = portfolioData.projects?.find((item) => {
    const title = item.title as { zh?: string; en?: string } | undefined;
    return title?.en === 'Paper Tide';
  });

  assert.ok(project, 'expected a Paper Tide portfolio entry');
  assert.equal(project?.status, 'completed');
  assert.equal(project?.featured, false);
  assert.equal(project?.visible, true);
  assert.equal(project?.projectPagePath, '/project/paper-tide/index.html');
  assert.equal(project?.imgSrc, '/project/paper-tide/img/promo-hero-board.png');
});

test('paper-tide static project page exists with its core assets and repository link', () => {
  const projectDir = path.join(ROOT, 'content/projects/paper-tide');
  const indexPath = path.join(projectDir, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');

  assert.ok(fs.existsSync(path.join(projectDir, 'img/cover-desktop.png')));
  assert.ok(fs.existsSync(path.join(projectDir, 'img/archive-desktop.png')));
  assert.ok(fs.existsSync(path.join(projectDir, 'img/mobile-preview.png')));
  assert.ok(fs.existsSync(path.join(projectDir, 'img/promo-hero-board.png')));
  assert.ok(fs.existsSync(path.join(projectDir, 'img/desktop-product.png')));
  assert.ok(fs.existsSync(path.join(projectDir, 'img/mobile-home.png')));
  assert.ok(fs.existsSync(path.join(projectDir, 'img/mobile-submit.png')));
  assert.ok(fs.existsSync(path.join(projectDir, 'img/mobile-archive.png')));
  // The redundant baked boards were deduped off the page and deleted.
  assert.ok(!fs.existsSync(path.join(projectDir, 'img/desktop-showcase.png')));
  assert.ok(!fs.existsSync(path.join(projectDir, 'img/mobile-launch-board.png')));
  assert.match(html, /https:\/\/github\.com\/zhangjian94cn\/paper-tide/);
  assert.match(html, /静态作品页/);
  assert.match(html, /完整源码/);
});

test('paper-tide case page uses static-export-safe portfolio links and phone preview framing', () => {
  const html = readFile('content/projects/paper-tide/index.html');
  const portfolioHrefMatches = Array.from(html.matchAll(/href="([^"]*portfolio[^"]*)"/g), (match) => match[1]);

  assert.ok(portfolioHrefMatches.length >= 3, 'expected portfolio links in topbar, hero, and footer');
  assert.ok(
    portfolioHrefMatches.every((href) => href === '/portfolio.html'),
    `expected all portfolio links to use /portfolio.html, got ${portfolioHrefMatches.join(', ')}`
  );
  assert.match(html, /class="[^"]*\bphone-trio-svg\b/);
  assert.match(html, /aria-label="Paper Tide mobile home, submit desk and archive screens"/);
  assert.match(html, /src="\.\/img\/mobile-preview\.png"/);
});

test('paper-tide case page uses a promo-board composition instead of loose screenshot cards', () => {
  const html = readFile('content/projects/paper-tide/index.html');

  assert.match(html, /class="[^"]*promo-board/);
  assert.match(html, /class="[^"]*laptop-frame/);
  assert.match(html, /class="[^"]*laptop-device-svg/);
  assert.match(html, /class="[^"]*phone-cluster/);
  assert.match(html, /class="[^"]*phone-trio-svg/);
  assert.match(html, /class="[^"]*floating-badge/);
  assert.match(html, /x="112" y="113" width="280" height="606" preserveAspectRatio="xMidYMid slice"/);
  assert.match(html, /x="442" y="113" width="280" height="606" preserveAspectRatio="xMidYMid slice"/);
  assert.match(html, /x="772" y="113" width="280" height="606" preserveAspectRatio="xMidYMid slice"/);
  assert.match(html, /src="\.\/img\/promo-hero-board\.png"/);
  assert.match(html, /<svg class="laptop-device-svg" viewBox="35 140 530 320"/);
  assert.match(html, /<image href="\.\/img\/desktop-product\.png" x="101" y="169\.5" width="398" height="248"/);
  assert.match(html, /id="screen--paper-tide-desktop"/);
  assert.match(html, /clip-path="url\(#screenClip--paper-tide-desktop\)"/);
  assert.doesNotMatch(html, /src="\.\/img\/desktop-showcase\.svg"/);
  assert.doesNotMatch(html, /data="\.\/img\/desktop-showcase\.svg"/);
  assert.doesNotMatch(html, /src="\.\/img\/desktop-product\.png"/);
  assert.doesNotMatch(html, /laptop-frame::/);
  assert.doesNotMatch(html, /laptop-screen/);
  assert.match(html, /href="\.\/img\/mobile-home\.png"/);
  assert.match(html, /href="\.\/img\/mobile-submit\.png"/);
  assert.match(html, /href="\.\/img\/mobile-archive\.png"/);
  assert.doesNotMatch(html, /translateY\(/);
  assert.doesNotMatch(html, /src="\.\/img\/cover-desktop\.png"/);
  assert.doesNotMatch(html, /src="\.\/img\/archive-desktop\.png"/);
  assert.doesNotMatch(html, /overflow-x:\s*hidden/);
  assert.match(html, /overflow-wrap:\s*anywhere/);

  // Floating badges must use inline SVG icons, never raw unicode/emoji glyphs
  // (which render as tofu boxes in headless Chrome).
  assert.match(html, /class="badge-icon"/);
  assert.match(html, /<svg /);
  assert.doesNotMatch(html, /data-icon=/);

  // The redundant baked-board figures were removed; each showcase keeps only
  // one representation (the live device mockup).
  assert.doesNotMatch(html, /rendered-board/);
  assert.doesNotMatch(html, /src="\.\/img\/desktop-showcase\.png"/);
  assert.doesNotMatch(html, /src="\.\/img\/mobile-launch-board\.png"/);
});
