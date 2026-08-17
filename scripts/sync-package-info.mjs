#!/usr/bin/env node
/**
 * After `changeset version`, copy each publishable package.json version into
 * the matching `*_PACKAGE_VERSION` source constant.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const packages = [
  { dir: 'core', constant: 'CORE_PACKAGE_VERSION' },
  { dir: 'dom', constant: 'DOM_PACKAGE_VERSION' },
  { dir: 'react', constant: 'REACT_PACKAGE_VERSION' },
  { dir: 'vue', constant: 'VUE_PACKAGE_VERSION' },
  { dir: 'angular', constant: 'ANGULAR_PACKAGE_VERSION' },
  { dir: 'svelte', constant: 'SVELTE_PACKAGE_VERSION' },
];

for (const item of packages) {
  const pkgPath = join(root, 'packages', item.dir, 'package.json');
  const indexPath = join(root, 'packages', item.dir, 'src', 'index.ts');
  const version = JSON.parse(readFileSync(pkgPath, 'utf8')).version;
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error(`packages/${item.dir}/package.json is missing a version`);
  }
  const source = readFileSync(indexPath, 'utf8');
  const pattern = new RegExp(`export const ${item.constant} = '[^']+' as const;`);
  const next = `export const ${item.constant} = '${version}' as const;`;
  if (!pattern.test(source)) {
    throw new Error(`Could not find ${item.constant} in packages/${item.dir}/src/index.ts`);
  }
  writeFileSync(indexPath, source.replace(pattern, next));
  console.log(`synced ${item.constant} -> ${version}`);
}
