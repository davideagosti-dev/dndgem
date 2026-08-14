#!/usr/bin/env node
/**
 * Lightweight package-boundary verifier for DnDGem.
 * Enforces dependency direction and forbidden runtime deps without heavy tooling.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = join(root, 'packages');

const errors = [];

function readPkg(name) {
  const pkgPath = join(packagesDir, name, 'package.json');
  if (!existsSync(pkgPath)) {
    errors.push(`Missing package.json for packages/${name}`);
    return null;
  }
  return JSON.parse(readFileSync(pkgPath, 'utf8'));
}

function allDeps(pkg) {
  return {
    ...pkg.dependencies,
    ...pkg.optionalDependencies,
    ...pkg.peerDependencies,
    ...pkg.devDependencies,
  };
}

function assertNoDeps(packageName, pkg, forbidden) {
  const deps = allDeps(pkg);
  for (const dep of Object.keys(deps)) {
    if (forbidden.has(dep)) {
      errors.push(`packages/${packageName} must not depend on "${dep}"`);
    }
  }
}

const core = readPkg('core');
const dom = readPkg('dom');
const react = readPkg('react');

if (core) {
  assertNoDeps(
    'core',
    core,
    new Set([
      '@dndgem/dom',
      '@dndgem/react',
      'react',
      'react-dom',
      '@dnd-kit/dom',
      '@dnd-kit/core',
      '@dnd-kit/react',
    ]),
  );
  for (const dep of Object.keys(allDeps(core))) {
    if (dep.startsWith('@dnd-kit/')) {
      errors.push(`packages/core must not depend on "${dep}"`);
    }
  }
  if (core.type !== 'module') errors.push('packages/core should be ESM ("type": "module")');
  if (!core.exports?.['.']) errors.push('packages/core must declare a public "." export');
  assertPublishableMetadata('core', core);
}

if (dom) {
  assertNoDeps('dom', dom, new Set(['@dndgem/react', 'react', 'react-dom']));
  if (dom.type !== 'module') errors.push('packages/dom should be ESM ("type": "module")');
  if (!dom.exports?.['.']) errors.push('packages/dom must declare a public "." export');
  if (!dom.dependencies?.['@dndgem/core']) {
    errors.push('@dndgem/dom must declare a dependency on @dndgem/core');
  }
  assertPublishableMetadata('dom', dom);
  for (const dep of Object.keys(allDeps(dom))) {
    if (dep.startsWith('@dnd-kit/') && dep !== '@dnd-kit/dom') {
      errors.push(
        `packages/dom must not depend on "${dep}" (only @dnd-kit/dom is the approved provider)`,
      );
    }
  }
}

if (react) {
  if (react.type !== 'module') errors.push('packages/react should be ESM ("type": "module")');
  if (!react.exports?.['.']) errors.push('packages/react must declare a public "." export');
  if (!react.dependencies?.['@dndgem/core']) {
    errors.push('@dndgem/react must declare a dependency on @dndgem/core');
  }
  if (!react.dependencies?.['@dndgem/dom']) {
    errors.push('@dndgem/react must declare a dependency on @dndgem/dom');
  }
  if (react.peerDependencies?.react === undefined) {
    errors.push('@dndgem/react must declare react as a peerDependency');
  }
  assertPublishableMetadata('react', react);
  for (const dep of Object.keys(allDeps(react))) {
    if (dep.startsWith('@dnd-kit/')) {
      errors.push(
        `packages/react must not depend on "${dep}" (consume @dndgem/dom interaction APIs)`,
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
}

// Ensure no unexpected packages under packages/ for Phase 2
for (const name of readdirSync(packagesDir)) {
  if (!['core', 'dom', 'react'].includes(name)) {
    errors.push(`Unexpected package folder packages/${name} (Phase 2 allows core/dom/react only)`);
  }
}

if (errors.length > 0) {
  console.error('Package boundary check FAILED:\n');
  for (const error of errors) {
    console.error(` - ${error}`);
  }
  process.exit(1);
}

console.log('Package boundary check PASSED');
console.log(' - core: no DOM/React/dnd-kit dependencies');
console.log(' - dom: no React dependencies; depends on core; optional @dnd-kit/dom provider only');
console.log(' - react: depends on core and dom; react is a peerDependency; no dnd-kit');
console.log(' - public exports present on packages');
