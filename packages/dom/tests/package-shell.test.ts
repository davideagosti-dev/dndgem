import { describe, expect, it } from 'vitest';
import { DOM_PACKAGE_NAME, getDomPackageInfo } from '../src/index.js';

describe('@dndgem/dom package shell', () => {
  it('exposes package identity and linked core info', () => {
    const info = getDomPackageInfo();
    expect(info.name).toBe(DOM_PACKAGE_NAME);
    expect(info.version).toBe('0.0.0');
    expect(info.core.name).toBe('@dndgem/core');
  });
});
