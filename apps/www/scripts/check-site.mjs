import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');

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
for (const [label, html] of [
  ['index.html', landing],
  ['docs/index.html', docs],
  ['docs/quick-start/index.html', quick],
]) {
  if (!html.includes('npm install @dndgem/react@alpha')) {
    failures.push(`${label}: missing @alpha install command`);
  }
}

const support = readFileSync(join(site, 'support/index.html'), 'utf8');
if (!support.includes('support@dndgem.dev') || !support.includes('security@dndgem.dev')) {
  failures.push('support/index.html: missing support/security contacts');
}
if (!landing.includes('by DA62') || !support.includes('by DA62')) {
  failures.push('site: missing DnDGem by DA62 attribution');
}

if (failures.length > 0) {
  console.error('www site check failed:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log('www site check passed');
