/**
 * Lightweight markdown relative-link integrity check for developer docs.
 * Validates repo-relative targets exist. Does not fetch http(s) URLs.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

const ENTRY_FILES = [
  'README.md',
  'CONTRIBUTING.md',
  'docs/guides/README.md',
  'docs/roadmap.md',
  'docs/architecture/alpha-api-contract.md',
  'docs/architecture/beta-claim-support-policy.md',
  'docs/architecture/release-strategy.md',
  'docs/architecture/framework-expansion-planning-audit.md',
  'docs/architecture/framework-adapter-contract.md',
  'docs/architecture/public-site.md',
  'docs/architecture/testing-strategy.md',
  'docs/releases/README.md',
  'docs/releases/0.1.0-alpha.0.md',
  'docs/releases/0.1.0-alpha.1.md',
  'docs/releases/0.1.0-alpha.2.md',
  'docs/releases/0.1.0-alpha.3.md',
  'docs/releases/0.1.0-alpha.4.md',
  'docs/releases/dnd-2.5-stage-a-readiness.md',
  'packages/core/README.md',
  'packages/dom/README.md',
  'packages/react/README.md',
];

const GUIDE_DIR = join(root, 'docs', 'guides');

/** @param {string} dir */
function listMarkdown(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listMarkdown(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

/** @param {string} filePath */
function extractRelativeLinks(filePath) {
  const text = readFileSync(filePath, 'utf8');
  /** @type {string[]} */
  const links = [];
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const raw = match[1].trim().replace(/^<|>$/g, '');
    if (
      raw.startsWith('http://') ||
      raw.startsWith('https://') ||
      raw.startsWith('mailto:') ||
      raw.startsWith('#')
    ) {
      continue;
    }
    const withoutAnchor = raw.split('#')[0] ?? '';
    if (withoutAnchor.length === 0) {
      continue;
    }
    links.push(withoutAnchor);
  }
  return links;
}

/** @param {string} fromFile @param {string} link */
function resolveTarget(fromFile, link) {
  if (link.startsWith('/')) {
    return resolve(root, link.slice(1));
  }
  return resolve(dirname(fromFile), link);
}

const files = new Set([...ENTRY_FILES.map((rel) => join(root, rel)), ...listMarkdown(GUIDE_DIR)]);

/** @type {string[]} */
const failures = [];

for (const file of files) {
  let st;
  try {
    st = statSync(file);
  } catch {
    failures.push(`missing entry file: ${file}`);
    continue;
  }
  if (!st.isFile()) {
    continue;
  }
  for (const link of extractRelativeLinks(file)) {
    const target = resolveTarget(file, link);
    const normalized = normalize(target);
    if (!normalized.startsWith(root + sep) && normalized !== root) {
      failures.push(`${file}: link escapes repo (${link})`);
      continue;
    }
    try {
      const targetStat = statSync(normalized);
      if (!targetStat.isFile() && !targetStat.isDirectory()) {
        failures.push(`${file}: not a file/dir (${link})`);
      }
    } catch {
      failures.push(`${file}: broken link → ${link}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Documentation link check FAILED');
  for (const line of failures) {
    console.error(` - ${line}`);
  }
  process.exit(1);
}

console.log(`Documentation link check PASSED (${files.size} markdown files)`);
