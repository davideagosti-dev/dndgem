#!/usr/bin/env node
/**
 * Compile DnDGemProvider.svelte to dist JS after tsc.
 * svelte-package would keep .svelte source; packed Node consumers need compiled JS.
 *
 * Client and server builds are separate.
 * `exports.browser` → client; `exports.node` → server (SvelteKit SSR).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(pkgRoot, 'src', 'DnDGemProvider.svelte');
const distDir = join(pkgRoot, 'dist');
const source = readFileSync(sourcePath, 'utf8');

function compileGenerate(generate) {
  const result = compile(source, {
    filename: 'DnDGemProvider.svelte',
    css: 'injected',
    generate,
  });
  const suffix = generate === 'server' ? 'server' : 'client';
  writeFileSync(join(distDir, `DnDGemProvider.${suffix}.js`), result.js.code);
  if (typeof result.js.map === 'string' && result.js.map.length > 0) {
    writeFileSync(join(distDir, `DnDGemProvider.${suffix}.js.map`), result.js.map);
  }
}

compileGenerate('client');
compileGenerate('server');

writeFileSync(
  join(distDir, 'DnDGemProvider.js'),
  `export { default } from './DnDGemProvider.client.js';\n`,
);

const dts = readFileSync(join(pkgRoot, 'src', 'DnDGemProvider.svelte.d.ts'), 'utf8');
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

const indexJs = readFileSync(join(distDir, 'index.js'), 'utf8');
writeFileSync(
  join(distDir, 'index.server.js'),
  indexJs.replaceAll('./DnDGemProvider.js', './DnDGemProvider.server.js'),
);
writeFileSync(
  join(distDir, 'index.server.d.ts'),
  readFileSync(join(distDir, 'index.d.ts'), 'utf8'),
);
