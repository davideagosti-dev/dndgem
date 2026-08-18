import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EXISTS,
  NOT_PUBLISHED,
  assertSafePackageSpec,
  classifyNpmViewResult,
  decidePublishAction,
  planPackage,
} from './npm-publish-guard.mjs';

test('A: version not on npm selects publish', () => {
  const classified = classifyNpmViewResult({
    exitCode: 1,
    stdout: JSON.stringify({
      error: {
        code: 'E404',
        summary: "The requested resource '@dndgem/vue@0.1.0-alpha.2' could not be found",
      },
    }),
    stderr: 'npm error code E404',
    expectedVersion: '0.1.0-alpha.2',
  });
  assert.equal(classified.status, NOT_PUBLISHED);
  const decision = decidePublishAction({
    name: '@dndgem/vue',
    version: '0.1.0-alpha.2',
    existence: classified.status,
  });
  assert.equal(decision.action, 'publish');
});

test('B: exact version already exists selects skip', () => {
  const classified = classifyNpmViewResult({
    exitCode: 0,
    stdout: '"0.1.0-alpha.1"\n',
    stderr: '',
    expectedVersion: '0.1.0-alpha.1',
  });
  assert.equal(classified.status, EXISTS);
  const decision = decidePublishAction({
    name: '@dndgem/core',
    version: '0.1.0-alpha.1',
    existence: classified.status,
  });
  assert.equal(decision.action, 'skip');
  assert.match(
    decision.message,
    /Skipping @dndgem\/core@0\.1\.0-alpha\.1 — version already exists on npm/,
  );
});

test('C: package exists but exact target version does not selects publish', () => {
  const classified = classifyNpmViewResult({
    exitCode: 1,
    stdout: '',
    stderr: ['npm error code E404', 'npm error 404 No match found for version 0.1.0-alpha.2'].join(
      '\n',
    ),
    expectedVersion: '0.1.0-alpha.2',
  });
  assert.equal(classified.status, NOT_PUBLISHED);
  const decision = decidePublishAction({
    name: '@dndgem/core',
    version: '0.1.0-alpha.2',
    existence: classified.status,
  });
  assert.equal(decision.action, 'publish');
});

test('D: unexpected npm registry error fails closed', () => {
  assert.throws(
    () =>
      classifyNpmViewResult({
        exitCode: 1,
        stdout: JSON.stringify({
          error: {
            code: 'E401',
            summary: 'Unable to authenticate',
          },
        }),
        stderr: 'npm error code E401',
        expectedVersion: '0.1.0-alpha.2',
      }),
    /Unexpected npm registry error \(E401\)/,
  );
  assert.throws(
    () =>
      classifyNpmViewResult({
        exitCode: 1,
        stdout: '',
        stderr: 'npm error code ECONNREFUSED',
        expectedVersion: '0.1.0-alpha.2',
      }),
    /Unexpected npm registry error \(ECONNREFUSED\)/,
  );
  assert.throws(
    () =>
      classifyNpmViewResult({
        exitCode: 1,
        stdout: '',
        stderr: 'network timeout',
        expectedVersion: '0.1.0-alpha.2',
      }),
    /Unexpected npm registry error \(exit 1\)/,
  );
});

test('E: version 0.0.0 is refused without a registry query', () => {
  const decision = decidePublishAction({
    name: '@dndgem/vue',
    version: '0.0.0',
    existence: NOT_PUBLISHED,
  });
  assert.equal(decision.action, 'refuse');
  assert.match(decision.message, /still 0\.0\.0/);
});

test('bootstrap vue alpha.2 EXISTS path would skip', () => {
  const plan = planPackage({
    name: '@dndgem/vue',
    version: '0.1.0-alpha.2',
    runNpmView: () => ({
      exitCode: 0,
      stdout: '"0.1.0-alpha.2"\n',
      stderr: '',
    }),
  });
  assert.equal(plan.existence, EXISTS);
  assert.equal(plan.action, 'skip');
  assert.match(
    plan.message,
    /Skipping @dndgem\/vue@0\.1\.0-alpha\.2 — version already exists on npm/,
  );
});

test('bootstrap vue alpha.2 missing path would publish', () => {
  const plan = planPackage({
    name: '@dndgem/vue',
    version: '0.1.0-alpha.2',
    runNpmView: () => ({
      exitCode: 1,
      stdout: JSON.stringify({
        error: { code: 'E404', summary: 'Not Found' },
      }),
      stderr: 'npm error code E404',
    }),
  });
  assert.equal(plan.existence, NOT_PUBLISHED);
  assert.equal(plan.action, 'publish');
});

test('successful view with mismatched version fails closed', () => {
  assert.throws(
    () =>
      classifyNpmViewResult({
        exitCode: 0,
        stdout: '"0.1.0-alpha.1"\n',
        stderr: '',
        expectedVersion: '0.1.0-alpha.2',
      }),
    /reported "0\.1\.0-alpha\.1"/,
  );
});

test('rejects unsafe npm view specs before spawning', () => {
  assert.throws(() => assertSafePackageSpec('not-scoped', '0.1.0-alpha.2'), /invalid package name/);
  assert.throws(
    () => assertSafePackageSpec('@dndgem/core', '1; rm -rf /'),
    /invalid package version/,
  );
});
