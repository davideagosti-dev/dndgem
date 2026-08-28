import { createContentConstraints, createLayoutIntent, createLayoutItem } from '@dndgem/core';
import { describe, expect, it } from 'vitest';
import { assertProviderDtoPrivacy, buildProviderPlanningDto } from '../src/dto.js';

describe('provider DTO privacy', () => {
  it('serializes aliases only — never application ids or content fields', () => {
    const intent = createLayoutIntent({
      space: { width: 200, height: 100 },
      items: [
        createLayoutItem({
          id: 'hero-primary-card',
          constraints: createContentConstraints({ preferredWidth: 100, preferredHeight: 80 }),
        }),
        createLayoutItem({
          id: 'secret-form-field',
          constraints: createContentConstraints({ preferredWidth: 90, preferredHeight: 40 }),
        }),
        createLayoutItem({
          id: 'pinned-nav',
          constraints: createContentConstraints({ preferredWidth: 50, preferredHeight: 100 }),
        }),
      ],
      desiredPlacements: {
        'pinned-nav': { x: 0, y: 0, width: 50, height: 100 },
      },
    });

    const { dto } = buildProviderPlanningDto({
      intent,
      prominence: { 'hero-primary-card': 3 },
    });

    const serialized = JSON.stringify(dto);
    assertProviderDtoPrivacy(serialized, [
      'hero-primary-card',
      'secret-form-field',
      'pinned-nav',
      'textContent',
      'innerHTML',
      'aria',
      'password',
      'https://',
      'http://',
      'credential',
    ]);

    expect(dto.automaticItems.map((item) => item.alias)).toEqual(['item-0', 'item-1']);
    expect(dto.sourceItems.map((item) => item.alias)).toEqual(['item-2']);
    expect(serialized).not.toMatch(/hero-primary-card/);
  });
});
