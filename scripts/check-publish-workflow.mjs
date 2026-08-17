#!/usr/bin/env node
/**
 * Static invariants for .github/workflows/publish.yml (OIDC Trusted Publishing).
 * Does not call GitHub or npm. Does not print secrets.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { existingPublishableFolders, npmNameForFolder, REPO_ROOT } from './package-topology.mjs';

const workflowPath = join(REPO_ROOT, '.github', 'workflows', 'publish.yml');
const text = readFileSync(workflowPath, 'utf8');

function fail(message) {
  console.error(`publish workflow check FAILED: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

assert(/id-token:\s*write/.test(text), 'npm job must grant id-token: write');
assert(
  /default:\s*alpha/.test(text) && /dist_tag:/.test(text),
  'dist_tag input must default to alpha',
);
assert(
  /allow_latest:/.test(text) && /default:\s*false/.test(text),
  'allow_latest must default to false',
);
assert(/Refusing to publish with dist-tag latest/.test(text), 'latest dist-tag must be guarded');
assert(/Real publication must run on master/.test(text), 'non-dry-run publish must require master');

const setupNodeWith = text.match(/- name: Setup Node\.js\n(?:.*\n)*?\s+with:\n((?:[ \t]+.+\n)+)/);
assert(setupNodeWith, 'Setup Node.js with: block must exist');
assert(
  !/^\s*registry-url\s*:/m.test(setupNodeWith[1]),
  'Setup Node.js must not set registry-url (breaks OIDC via _authToken npmrc)',
);

assert(
  !/NODE_AUTH_TOKEN:\s*\$\{\{\s*secrets\./.test(text),
  'primary publish path must not map secrets.* into NODE_AUTH_TOKEN',
);
assert(
  !/NPM_TOKEN:\s*\$\{\{\s*secrets\.NPM_TOKEN/.test(text),
  'primary publish path must not use secrets.NPM_TOKEN',
);
assert(
  /Prepare OIDC publish environment/.test(text),
  'real publish must prepare an OIDC-clean environment',
);
assert(
  /Publish to npm \(OIDC Trusted Publishing\)/.test(text),
  'OIDC publish step must remain named for Trusted Publishing',
);

for (const folder of existingPublishableFolders()) {
  const name = npmNameForFolder(folder);
  const escaped = name.replace('/', '\\/');
  assert(
    new RegExp(`--filter\\s+${escaped}\\s+publish`).test(text),
    `publish.yml must include --filter ${name} publish for existing package packages/${folder}`,
  );
}

assert(
  /Skipping @dndgem\/vue real publish \(version 0\.0\.0/.test(text),
  'real publish must skip @dndgem/vue while the workspace placeholder version is 0.0.0',
);
assert(
  /Skipping @dndgem\/angular real publish \(version 0\.0\.0/.test(text),
  'real publish must skip @dndgem/angular while the workspace placeholder version is 0.0.0',
);
assert(
  /Skipping @dndgem\/svelte real publish \(version 0\.0\.0/.test(text),
  'real publish must skip @dndgem/svelte while the workspace placeholder version is 0.0.0',
);

console.log('publish workflow check PASSED');
console.log(' - id-token: write present');
console.log(' - no setup-node registry-url on OIDC path');
console.log(' - no secrets.NPM_TOKEN / NODE_AUTH_TOKEN mapping on primary path');
console.log(' - dist_tag alpha default + latest guard + master guard');
console.log(
  ` - existing package publish filters: ${existingPublishableFolders().map(npmNameForFolder).join(', ')}`,
);
