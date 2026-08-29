/**
 * Load repository-root `.env.local` into `process.env` when keys are unset.
 * Used only by the manual live experiment harness (BYOK). Never logs values.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOWED_KEYS = new Set(['OPENAI_API_KEY', 'DNDGEM_OPENAI_MODEL']);

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Resolve `.env.local` from the monorepo root (two levels above `experiment/`).
 */
export function loadExperimentLocalEnv(): void {
  const experimentDir = dirname(fileURLToPath(import.meta.url));
  const envPath = join(experimentDir, '..', '..', '..', '.env.local');
  if (!existsSync(envPath)) {
    return;
  }

  const text = readFileSync(envPath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }
    const eq = line.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    if (!ALLOWED_KEYS.has(key)) {
      continue;
    }
    const existing = process.env[key];
    if (typeof existing === 'string' && existing.trim().length > 0) {
      continue;
    }
    const value = stripQuotes(line.slice(eq + 1));
    if (value.length > 0) {
      process.env[key] = value;
    }
  }
}
