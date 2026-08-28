import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  createFakeOpenAITransport,
  createOpenAILayoutPlanner,
  ProviderError,
} from '../src/index.js';
import { createContentConstraints, createLayoutIntent, createLayoutItem } from '@dndgem/core';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(pkgRoot, '..', '..');

describe('BYOK / secret hygiene', () => {
  it('package import and fake planner require no OPENAI_API_KEY', async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const planner = createOpenAILayoutPlanner({
        transport: createFakeOpenAITransport(async () => ({
          kind: 'ok',
          proposal: { automaticItemOrder: ['item-0'] },
        })),
      });
      const intent = createLayoutIntent({
        space: { width: 100, height: 100 },
        items: [
          createLayoutItem({
            id: 'only',
            constraints: createContentConstraints({ preferredWidth: 50, preferredHeight: 50 }),
          }),
        ],
      });
      const proposal = await planner({ intent }, { requestId: 1 });
      expect(proposal.automaticItemOrder).toEqual(['only']);
    } finally {
      if (previous !== undefined) {
        process.env.OPENAI_API_KEY = previous;
      }
    }
  });

  it('live planner construction without key fails closed before network', () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      expect(() => createOpenAILayoutPlanner({})).toThrow(ProviderError);
    } finally {
      if (previous !== undefined) {
        process.env.OPENAI_API_KEY = previous;
      }
    }
  });

  it('.gitignore protects .env files and allows .env.example', () => {
    const gitignore = readFileSync(join(repoRoot, '.gitignore'), 'utf8');
    expect(gitignore).toMatch(/^\.env$/m);
    expect(gitignore).toMatch(/^\.env\.\*$/m);
    expect(gitignore).toMatch(/^!\.env\.example$/m);
  });

  it('no committed fixture contains secret-like openai key material', () => {
    const samples = [
      readFileSync(join(pkgRoot, 'src/planner.ts'), 'utf8'),
      readFileSync(join(pkgRoot, 'experiment/corpus.ts'), 'utf8'),
    ];
    for (const sample of samples) {
      expect(sample).not.toMatch(/sk-[a-zA-Z0-9]{10,}/);
      expect(sample).not.toMatch(/OPENAI_API_KEY\s*=\s*['"]sk-/);
    }
  });
});
