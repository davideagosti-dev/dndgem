#!/usr/bin/env node
/**
 * Static invariants for .github/workflows/publish.yml (OIDC Trusted Publishing).
 * Does not call GitHub or npm. Does not print secrets.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { existingPublishableFolders, npmNameForFolder, REPO_ROOT } from './package-topology.mjs';
import {
  EXISTS,
  NOT_PUBLISHED,
  classifyNpmViewResult,
  decidePublishAction,
} from './npm-publish-guard.mjs';

const workflowPath = join(REPO_ROOT, '.github', 'workflows', 'publish.yml');
const text = readFileSync(workflowPath, 'utf8');
const guardPath = join(REPO_ROOT, 'scripts', 'npm-publish-guard.mjs');
const guardText = readFileSync(guardPath, 'utf8');

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

assert(
  /scripts\/npm-publish-guard\.mjs/.test(text),
  'real publish must invoke scripts/npm-publish-guard.mjs',
);
assert(
  /node scripts\/npm-publish-guard\.mjs --folder/.test(text),
  'real publish must pass --folder to the exact-version guard',
);
assert(
  /version already exists on npm/.test(guardText),
  'publish guard must skip with "version already exists on npm"',
);
assert(
  /errorCode === 'E404'/.test(guardText) || /errorCode === "E404"/.test(guardText),
  'publish guard must treat only E404 as NOT_PUBLISHED',
);

let authFailedClosed = false;
try {
  classifyNpmViewResult({
    exitCode: 1,
    stdout: '',
    stderr: 'npm error code E401',
    expectedVersion: '0.1.0-alpha.2',
  });
} catch (error) {
  authFailedClosed = error instanceof Error && error.message.includes('E401');
}
assert(authFailedClosed, 'publish guard must fail closed on E401 rather than skip');

const loopMatch = text.match(/for folder in ([^\n]+);/);
assert(loopMatch, 'real publish must loop public package folders');
const loopFolders = loopMatch[1].trim().split(/\s+/);
const publishable = existingPublishableFolders();
assert(
  publishable.length === 6,
  `expected six publishable packages, found ${publishable.join(', ')}`,
);
for (const folder of publishable) {
  assert(
    loopFolders.includes(folder),
    `publish loop must include ${folder} (${npmNameForFolder(folder)})`,
  );
}
assert(
  /pnpm --filter "@dndgem\/\$\{folder\}" publish/.test(text),
  'real publish must use pnpm --filter "@dndgem/${folder}" publish',
);
assert(
  /--tag "\$\{\{ inputs\.dist_tag \}\}"/.test(text) && /--access public/.test(text),
  'real publish must keep --tag dist_tag and --access public',
);

assert(
  /for \(const name of \['core', 'dom', 'react', 'vue', 'angular', 'svelte'\]\)/.test(text),
  'real publish must refuse 0.0.0 for all six public packages',
);
assert(
  /if \(version === '0\.0\.0'\)/.test(text),
  'real publish must still refuse unversioned 0.0.0 packages',
);

const skipDecision = decidePublishAction({
  name: '@dndgem/vue',
  version: '0.1.0-alpha.2',
  existence: EXISTS,
});
assert(skipDecision.action === 'skip', 'guard must skip when exact version EXISTS');
const publishDecision = decidePublishAction({
  name: '@dndgem/core',
  version: '0.1.0-alpha.2',
  existence: NOT_PUBLISHED,
});
assert(publishDecision.action === 'publish', 'guard must publish when exact version is missing');
const refuseDecision = decidePublishAction({
  name: '@dndgem/svelte',
  version: '0.0.0',
  existence: NOT_PUBLISHED,
});
assert(refuseDecision.action === 'refuse', 'guard must refuse 0.0.0');

console.log('publish workflow check PASSED');
console.log(' - id-token: write present');
console.log(' - no setup-node registry-url on OIDC path');
console.log(' - no secrets.NPM_TOKEN / NODE_AUTH_TOKEN mapping on primary path');
console.log(' - dist_tag alpha default + latest guard + master guard');
console.log(' - exact-version skip-existing guard via scripts/npm-publish-guard.mjs');
console.log(' - 0.0.0 refuse retained for all six public packages');
console.log(` - existing package publish loop: ${publishable.map(npmNameForFolder).join(', ')}`);
