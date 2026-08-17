import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

if (typeof HTMLElement !== 'undefined') {
  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    const raw = this.getAttribute('data-box');
    if (raw !== null && raw.length > 0) {
      const [left, top, width, height] = raw.split(/[\s,]+/).map(Number);
      const x = left ?? 0;
      const y = top ?? 0;
      const w = width ?? 0;
      const h = height ?? 0;
      return {
        x,
        y,
        left: x,
        top: y,
        width: w,
        height: h,
        right: x + w,
        bottom: y + h,
        toJSON() {
          return {};
        },
      };
    }
    return originalGetBoundingClientRect.call(this);
  };
}
