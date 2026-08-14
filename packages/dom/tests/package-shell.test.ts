import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DOM_PACKAGE_NAME, DOM_PACKAGE_VERSION, getDomPackageInfo } from '../src/index.js';

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version: string };

describe('@dndgem/dom package shell', () => {
  it('exposes package identity and linked core info', () => {
    const info = getDomPackageInfo();
    expect(info.name).toBe(DOM_PACKAGE_NAME);
    expect(info.version).toBe(pkg.version);
    expect(DOM_PACKAGE_VERSION).toBe(pkg.version);
    expect(info.core.name).toBe('@dndgem/core');
  });
});
