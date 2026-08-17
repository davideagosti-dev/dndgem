#!/usr/bin/env node
/**
 * Compile DnDGemProvider.svelte to dist JS after tsc.
 * svelte-package would keep .svelte source; packed Node consumers need compiled JS.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(pkgRoot, 'src', 'DnDGemProvider.svelte');
const distDir = join(pkgRoot, 'dist');
const source = readFileSync(sourcePath, 'utf8');

const result = compile(source, {
  filename: 'DnDGemProvider.svelte',
  css: 'injected',
});

writeFileSync(join(distDir, 'DnDGemProvider.js'), result.js.code);
if (typeof result.js.map === 'string' && result.js.map.length > 0) {
  writeFileSync(join(distDir, 'DnDGemProvider.js.map'), result.js.map);
}

const dts = readFileSync(join(pkgRoot, 'src', 'DnDGemProvider.svelte.d.ts'), 'utf8').replaceAll(
  './types.js',
  './types.js',
);
writeFileSync(join(distDir, 'DnDGemProvider.d.ts'), dts);

for (const name of readdirSync(distDir)) {
  if (
    !name.endsWith('.js') &&
    !name.endsWith('.d.ts') &&
    !name.endsWith('.map') &&
    !name.endsWith('.d.ts.map')
  ) {
    continue;
  }
  const path = join(distDir, name);
  const text = readFileSync(path, 'utf8');
  const next = text.replaceAll('DnDGemProvider.svelte', 'DnDGemProvider.js');
  if (next !== text) {
    writeFileSync(path, next);
  }
}
