import { describe, expect, it } from 'vitest';
import { CORE_PACKAGE_NAME, getCorePackageInfo } from '../src/index.js';

describe('@dndgem/core package shell', () => {
  it('exposes package identity through the public entry', () => {
    expect(getCorePackageInfo()).toEqual({
      name: CORE_PACKAGE_NAME,
      version: '0.0.0',
    });
  });
});
