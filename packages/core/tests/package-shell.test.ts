import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CORE_PACKAGE_NAME, CORE_PACKAGE_VERSION, getCorePackageInfo } from '../src/index.js';

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version: string };

describe('@dndgem/core package shell', () => {
  it('exposes package identity through the public entry', () => {
    expect(CORE_PACKAGE_VERSION).toBe(pkg.version);
    expect(getCorePackageInfo()).toEqual({
      name: CORE_PACKAGE_NAME,
      version: pkg.version,
    });
  });
});
