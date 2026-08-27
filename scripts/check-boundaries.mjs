#!/usr/bin/env node
/**
 * Lightweight package-boundary verifier for DnDGem.
 * Enforces dependency direction and forbidden runtime deps without heavy tooling.
 *
 * Topology: scripts/package-topology.mjs (DND-FX.1).
 * Planned adapter folders may be absent; do not create placeholders.
 */
import { readFileSync } from 'node:fs';
import {
  CORE_FOLDER,
  DOM_FOLDER,
  FORBIDDEN_PACKAGE_FOLDERS,
  FRAMEWORK_ADAPTER_FOLDERS,
  FRAMEWORK_PEER_BY_FOLDER,
  INTELLIGENCE_FOLDER,
  OPTIONAL_PRIVATE_FOLDERS,
  existingAdapterFolders,
  existingPackageFolders,
  npmNameForFolder,
  packageDirExists,
  packageJsonPath,
} from './package-topology.mjs';

const errors = [];

function readPkg(folder) {
  if (!packageDirExists(folder)) {
    return null;
  }
  return JSON.parse(readFileSync(packageJsonPath(folder), 'utf8'));
}

function allDeps(pkg) {
  return {
    ...pkg.dependencies,
    ...pkg.optionalDependencies,
    ...pkg.peerDependencies,
    ...pkg.devDependencies,
  };
}

function assertNoDeps(packageName, pkg, forbidden, reason) {
  const deps = allDeps(pkg);
  for (const dep of Object.keys(deps)) {
    if (forbidden.has(dep)) {
      errors.push(
        `packages/${packageName} must not depend on "${dep}"${reason ? ` (${reason})` : ''}`,
      );
    }
  }
}

function assertPublishableMetadata(packageName, pkg) {
  if (pkg.license !== 'MIT') {
    errors.push(`packages/${packageName} must declare MIT license`);
  }
  if (pkg.publishConfig?.access !== 'public') {
    errors.push(`packages/${packageName} must set publishConfig.access to public`);
  }
  if (pkg.engines?.node === undefined) {
    errors.push(`packages/${packageName} must declare engines.node`);
  }
  if (typeof pkg.repository?.url !== 'string' || !pkg.repository.url.includes('dndgem')) {
    errors.push(`packages/${packageName} must declare a repository URL`);
  }
  if (pkg.exports?.['.']?.import !== './dist/index.js') {
    errors.push(`packages/${packageName} must export ESM dist/index.js`);
  }
  if (pkg.exports?.['.']?.types !== './dist/index.d.ts') {
    errors.push(`packages/${packageName} must export dist/index.d.ts`);
  }
  if (pkg.type !== 'module') {
    errors.push(`packages/${packageName} should be ESM ("type": "module")`);
  }
  if (!pkg.exports?.['.']) {
    errors.push(`packages/${packageName} must declare a public "." export`);
  }
}

const adapterNpmNames = FRAMEWORK_ADAPTER_FOLDERS.map((folder) => npmNameForFolder(folder));
const adapterPeerNames = Object.values(FRAMEWORK_PEER_BY_FOLDER);
const frameworkRuntimeNames = new Set(['react', 'react-dom', ...adapterPeerNames]);
const intelligenceNpmName = npmNameForFolder(INTELLIGENCE_FOLDER);

const core = readPkg(CORE_FOLDER);
if (!core) {
  errors.push(`Missing package.json for packages/${CORE_FOLDER}`);
} else {
  assertNoDeps(
    CORE_FOLDER,
    core,
    new Set([
      npmNameForFolder(DOM_FOLDER),
      intelligenceNpmName,
      ...adapterNpmNames,
      ...frameworkRuntimeNames,
      '@dnd-kit/dom',
      '@dnd-kit/core',
      '@dnd-kit/react',
    ]),
    'Core must remain renderer-agnostic',
  );
  for (const dep of Object.keys(allDeps(core))) {
    if (dep.startsWith('@dnd-kit/')) {
      errors.push(`packages/core must not depend on "${dep}"`);
    }
  }
  assertPublishableMetadata(CORE_FOLDER, core);
}

const dom = readPkg(DOM_FOLDER);
if (!dom) {
  errors.push(`Missing package.json for packages/${DOM_FOLDER}`);
} else {
  assertNoDeps(
    DOM_FOLDER,
    dom,
    new Set([...adapterNpmNames, ...frameworkRuntimeNames, intelligenceNpmName]),
    'DOM must not depend on framework adapters, UI frameworks, or intelligence',
  );
  if (!dom.dependencies?.['@dndgem/core']) {
    errors.push('@dndgem/dom must declare a dependency on @dndgem/core');
  }
  assertPublishableMetadata(DOM_FOLDER, dom);
  for (const dep of Object.keys(allDeps(dom))) {
    if (dep.startsWith('@dnd-kit/') && dep !== '@dnd-kit/dom') {
      errors.push(
        `packages/dom must not depend on "${dep}" (only @dnd-kit/dom is the approved provider)`,
      );
    }
  }
}

for (const folder of existingAdapterFolders()) {
  const pkg = readPkg(folder);
  if (!pkg) {
    continue;
  }
  const otherAdapters = adapterNpmNames.filter((name) => name !== npmNameForFolder(folder));
  const peer = FRAMEWORK_PEER_BY_FOLDER[folder];
  const otherPeers = adapterPeerNames.filter((name) => name !== peer);

  if (!pkg.dependencies?.['@dndgem/dom']) {
    errors.push(`${npmNameForFolder(folder)} must declare a dependency on @dndgem/dom`);
  }
  if (pkg.peerDependencies?.[peer] === undefined) {
    errors.push(`${npmNameForFolder(folder)} must declare ${peer} as a peerDependency`);
  }
  assertNoDeps(
    folder,
    pkg,
    new Set(otherAdapters),
    'adapters must not depend on another framework adapter',
  );
  assertNoDeps(
    folder,
    pkg,
    new Set([intelligenceNpmName]),
    'adapters must not depend on intelligence in DND-4.2',
  );
  assertNoDeps(
    folder,
    pkg,
    new Set(otherPeers),
    'adapters must not depend on another UI framework',
  );
  for (const dep of Object.keys(allDeps(pkg))) {
    if (dep.startsWith('@dnd-kit/')) {
      errors.push(
        `packages/${folder} must not depend on "${dep}" (consume @dndgem/dom interaction APIs)`,
      );
    }
  }
  assertPublishableMetadata(folder, pkg);
}

const intelligence = readPkg(INTELLIGENCE_FOLDER);
if (packageDirExists(INTELLIGENCE_FOLDER)) {
  if (!intelligence) {
    errors.push(`Missing package.json for packages/${INTELLIGENCE_FOLDER}`);
  } else {
    if (intelligence.private !== true) {
      errors.push(`packages/${INTELLIGENCE_FOLDER} must remain private during DND-4.2`);
    }
    if (!intelligence.dependencies?.['@dndgem/core']) {
      errors.push(`${intelligenceNpmName} must declare a dependency on @dndgem/core`);
    }
    assertNoDeps(
      INTELLIGENCE_FOLDER,
      intelligence,
      new Set([
        npmNameForFolder(DOM_FOLDER),
        ...adapterNpmNames,
        ...frameworkRuntimeNames,
        '@dnd-kit/dom',
        '@dnd-kit/core',
        '@dnd-kit/react',
      ]),
      'intelligence must depend on Core only',
    );
    for (const dep of Object.keys(allDeps(intelligence))) {
      if (dep.startsWith('@dnd-kit/')) {
        errors.push(`packages/${INTELLIGENCE_FOLDER} must not depend on "${dep}"`);
      }
    }
  }
}

const allowedFolders = new Set([
  CORE_FOLDER,
  DOM_FOLDER,
  ...FRAMEWORK_ADAPTER_FOLDERS,
  ...OPTIONAL_PRIVATE_FOLDERS,
]);
for (const folder of existingPackageFolders()) {
  if (FORBIDDEN_PACKAGE_FOLDERS.includes(folder)) {
    errors.push(
      `Forbidden package folder packages/${folder} (not a JS/DOM adapter over @dndgem/dom)`,
    );
    continue;
  }
  if (!allowedFolders.has(folder)) {
    errors.push(
      `Unexpected package folder packages/${folder} (allowed: core, dom, ${FRAMEWORK_ADAPTER_FOLDERS.join(', ')}, ${OPTIONAL_PRIVATE_FOLDERS.join(', ')})`,
    );
  }
}

if (errors.length > 0) {
  console.error('Package boundary check FAILED:\n');
  for (const error of errors) {
    console.error(` - ${error}`);
  }
  process.exit(1);
}

const adapters = existingAdapterFolders();
const absentAdapters = FRAMEWORK_ADAPTER_FOLDERS.filter((folder) => !packageDirExists(folder));
console.log('Package boundary check PASSED');
console.log(' - core: no DOM/framework/intelligence/dnd-kit dependencies');
console.log(
  ' - dom: no framework adapters or intelligence; depends on core; optional @dnd-kit/dom provider only',
);
if (packageDirExists(INTELLIGENCE_FOLDER)) {
  console.log(` - intelligence: private optional layer; depends on core only`);
}
console.log(
  ` - adapters present: ${adapters.length === 0 ? '(none)' : adapters.map(npmNameForFolder).join(', ')}`,
);
console.log(
  ` - planned adapters (absent OK): ${absentAdapters.length === 0 ? '(none)' : absentAdapters.map(npmNameForFolder).join(', ')}`,
);
console.log(' - public exports present on existing packages');
