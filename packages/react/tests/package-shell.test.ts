import { describe, expect, it } from 'vitest';
import { REACT_PACKAGE_NAME, getReactPackageInfo } from '../src/index.js';

describe('@dndgem/react package shell', () => {
  it('exposes package identity and linked core/dom info', () => {
    const info = getReactPackageInfo();
    expect(info.name).toBe(REACT_PACKAGE_NAME);
    expect(info.version).toBe('0.0.0');
    expect(info.core.name).toBe('@dndgem/core');
    expect(info.dom.name).toBe('@dndgem/dom');
  });
});
