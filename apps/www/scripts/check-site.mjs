import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');

/** Bump these when preparing the next public Alpha website sync. */
const CURRENT_ALPHA = '0.1.0-alpha.4';
const STALE_CURRENT_ALPHA = '0.1.0-alpha.3';
const GITHUB_REPO = 'https://github.com/davideagosti-dev/dndgem';

const required = [
  'index.html',
  'docs/index.html',
  'docs/quick-start/index.html',
  'support/index.html',
  'styles.css',
  'favicon.svg',
  '_headers',
  '_redirects',
];

/** @type {string[]} */
const failures = [];

for (const rel of required) {
  const full = join(site, rel);
  if (!existsSync(full)) {
    failures.push(`missing ${rel}`);
  }
}

const pages = [
  ['index.html', 'https://dndgem.dev/', 'DnDGem'],
  ['docs/index.html', 'https://dndgem.dev/docs/', 'Documentation'],
  ['docs/quick-start/index.html', 'https://dndgem.dev/docs/quick-start/', 'Quick Start'],
  ['support/index.html', 'https://dndgem.dev/support/', 'Support'],
];

for (const [rel, canonical, marker] of pages) {
  const html = readFileSync(join(site, rel), 'utf8');
  if (!html.includes(`rel="canonical" href="${canonical}"`)) {
    failures.push(`${rel}: missing canonical ${canonical}`);
  }
  if (!html.includes('og:url') || !html.includes(canonical)) {
    failures.push(`${rel}: missing og:url for ${canonical}`);
  }
  if (!html.includes(marker)) {
    failures.push(`${rel}: missing expected content marker ${marker}`);
  }
}

const landing = readFileSync(join(site, 'index.html'), 'utf8');
const quick = readFileSync(join(site, 'docs/quick-start/index.html'), 'utf8');
const docs = readFileSync(join(site, 'docs/index.html'), 'utf8');
const support = readFileSync(join(site, 'support/index.html'), 'utf8');

for (const [label, html] of [
  ['index.html', landing],
  ['docs/index.html', docs],
  ['docs/quick-start/index.html', quick],
]) {
  if (!html.includes('npm install @dndgem/react@alpha')) {
    failures.push(`${label}: missing @alpha install command`);
  }
}

if (!support.includes('support@dndgem.dev') || !support.includes('security@dndgem.dev')) {
  failures.push('support/index.html: missing support/security contacts');
}
if (!landing.includes('by DA62') || !support.includes('by DA62')) {
  failures.push('site: missing DnDGem by DA62 attribution');
}

// --- Current release drift guards (targeted; historical mentions elsewhere remain allowed) ---

const statusPill = `Public Alpha · ${CURRENT_ALPHA} · channel @alpha`;
if (!landing.includes(statusPill)) {
  failures.push(`index.html: homepage status pill must show ${CURRENT_ALPHA} / @alpha`);
}
if (landing.includes(`Public Alpha · ${STALE_CURRENT_ALPHA}`)) {
  failures.push(
    `index.html: homepage status pill still presents stale ${STALE_CURRENT_ALPHA} as current`,
  );
}
if (!landing.includes(`Alpha ${CURRENT_ALPHA}`)) {
  failures.push(`index.html: package matrix must show current Alpha ${CURRENT_ALPHA}`);
}
if (landing.includes(`Alpha ${STALE_CURRENT_ALPHA}`)) {
  failures.push(
    `index.html: package matrix still presents stale ${STALE_CURRENT_ALPHA} as current`,
  );
}

const docsCurrent = `@alpha</strong> → <code>${CURRENT_ALPHA}</code>`;
if (!docs.includes(docsCurrent)) {
  failures.push(`docs/index.html: current-release lede must show @alpha → ${CURRENT_ALPHA}`);
}
if (docs.includes(`@alpha</strong> → <code>${STALE_CURRENT_ALPHA}</code>`)) {
  failures.push(
    `docs/index.html: current-release lede still presents stale ${STALE_CURRENT_ALPHA}`,
  );
}
if (!docs.includes(`<td>${CURRENT_ALPHA}</td>`)) {
  failures.push(`docs/index.html: package matrix must include ${CURRENT_ALPHA}`);
}
if (docs.includes(`<td>${STALE_CURRENT_ALPHA}</td>`)) {
  failures.push(
    `docs/index.html: package matrix still presents stale ${STALE_CURRENT_ALPHA} as current`,
  );
}

const quickVersion = `(<code>${CURRENT_ALPHA}</code>)`;
if (!quick.includes(quickVersion)) {
  failures.push(`docs/quick-start/index.html: current-version note must show ${CURRENT_ALPHA}`);
}
if (quick.includes(`(<code>${STALE_CURRENT_ALPHA}</code>)`)) {
  failures.push(
    `docs/quick-start/index.html: current-version note still presents stale ${STALE_CURRENT_ALPHA}`,
  );
}

if (docs.includes('AI (Phase 4) not started') || landing.includes('AI (Phase 4) not started')) {
  failures.push('site: must not claim Phase 4 / AI is not started');
}

if (
  support.toLowerCase().includes('repository is private') ||
  docs.toLowerCase().includes('private repository')
) {
  failures.push('site: must not claim the DnDGem repository is private');
}

if (!support.includes(GITHUB_REPO) || !landing.includes(GITHUB_REPO)) {
  failures.push(`site: homepage footer and support must link ${GITHUB_REPO}`);
}

if (failures.length > 0) {
  console.error('www site check failed:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`www site check passed (current Alpha ${CURRENT_ALPHA})`);
