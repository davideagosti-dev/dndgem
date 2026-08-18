#!/usr/bin/env node
/**
 * Exact-version npm publish guard (DND-FX.6).
 *
 * Distinguishes:
 *   EXISTS         — registry already has this name@version
 *   NOT_PUBLISHED  — expected not-found (package missing or version missing)
 *   unexpected     — auth, network, or malformed registry errors (must fail)
 *
 * Does not publish. Does not mutate dist-tags.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  existingPublishableFolders,
  npmNameForFolder,
  packageJsonPath,
} from './package-topology.mjs';

export const EXISTS = 'EXISTS';
export const NOT_PUBLISHED = 'NOT_PUBLISHED';

const UNVERSIONED = '0.0.0';

export function tryParseJson(text) {
  if (typeof text !== 'string') {
    return undefined;
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

export function extractNpmErrorCode(parsed, text) {
  if (parsed && typeof parsed === 'object' && parsed.error && parsed.error.code) {
    return String(parsed.error.code).toUpperCase();
  }
  const combined = typeof text === 'string' ? text : '';
  const match = combined.match(/\bnpm error code (E[A-Z0-9]+)\b/i);
  return match ? match[1].toUpperCase() : undefined;
}

function normalizeReportedVersion(parsed, stdout) {
  if (typeof parsed === 'string' && parsed.length > 0) {
    return parsed;
  }
  if (parsed && typeof parsed === 'object' && typeof parsed.version === 'string') {
    return parsed.version;
  }
  const trimmed = typeof stdout === 'string' ? stdout.trim() : '';
  if (/^[0-9]/.test(trimmed) && !trimmed.includes('\n')) {
    return trimmed.replace(/^"|"$/g, '');
  }
  return undefined;
}

export function classifyNpmViewResult({ exitCode, stdout = '', stderr = '', expectedVersion }) {
  const combined = `${stdout}\n${stderr}`;
  const parsed = tryParseJson(stdout) ?? tryParseJson(stderr);
  const errorCode = extractNpmErrorCode(parsed, combined);

  if (exitCode === 0) {
    const reported = normalizeReportedVersion(parsed, stdout);
    if (reported === expectedVersion) {
      return { status: EXISTS, errorCode: undefined };
    }
    throw new Error(
      `npm view succeeded but reported ${reported === undefined ? '(empty)' : JSON.stringify(reported)} instead of ${JSON.stringify(expectedVersion)}`,
    );
  }

  if (errorCode === 'E404') {
    return { status: NOT_PUBLISHED, errorCode };
  }

  const detail = combined.trim() || 'no npm output';
  throw new Error(
    `Unexpected npm registry error (${errorCode ?? `exit ${exitCode}`}) while checking ${expectedVersion}: ${detail.slice(0, 800)}`,
  );
}

export function decidePublishAction({ name, version, existence }) {
  if (version === UNVERSIONED) {
    return {
      action: 'refuse',
      message: `${name} is still 0.0.0. Run changeset version before a real publish.`,
    };
  }
  if (existence === EXISTS) {
    return {
      action: 'skip',
      message: `Skipping ${name}@${version} — version already exists on npm`,
    };
  }
  if (existence === NOT_PUBLISHED) {
    return {
      action: 'publish',
      message: `Publishing ${name}@${version} — exact version not on npm`,
    };
  }
  throw new Error(`Unknown existence status for ${name}@${version}: ${existence}`);
}

const PACKAGE_NAME_RE = /^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/;
const PACKAGE_VERSION_RE = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/;

export function assertSafePackageSpec(name, version) {
  if (!PACKAGE_NAME_RE.test(name)) {
    throw new Error(`Refusing npm view for invalid package name: ${name}`);
  }
  if (!PACKAGE_VERSION_RE.test(version)) {
    throw new Error(`Refusing npm view for invalid package version: ${version}`);
  }
}

export function defaultRunNpmView(name, version) {
  assertSafePackageSpec(name, version);
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['view', `${name}@${version}`, 'version', '--json'], {
    encoding: 'utf8',
    windowsHide: true,
    // Node on Windows cannot spawn .cmd files without a shell (EINVAL).
    shell: isWindows,
  });
  if (result.error) {
    return {
      exitCode: 1,
      stdout: result.stdout ?? '',
      stderr: `${result.stderr ?? ''}\n${result.error.message}`,
    };
  }
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

export function queryExactVersion(name, version, runNpmView = defaultRunNpmView) {
  const result = runNpmView(name, version);
  return classifyNpmViewResult({
    ...result,
    expectedVersion: version,
  });
}

export function readPublishablePackage(folder) {
  const pkg = JSON.parse(readFileSync(packageJsonPath(folder), 'utf8'));
  if (typeof pkg.name !== 'string' || typeof pkg.version !== 'string') {
    throw new Error(`packages/${folder}/package.json is missing name or version`);
  }
  return { folder, name: pkg.name, version: pkg.version };
}

export function planPackage({ name, version, runNpmView = defaultRunNpmView }) {
  if (version === UNVERSIONED) {
    return {
      name,
      version,
      existence: undefined,
      ...decidePublishAction({ name, version, existence: NOT_PUBLISHED }),
    };
  }
  const { status } = queryExactVersion(name, version, runNpmView);
  return {
    name,
    version,
    existence: status,
    ...decidePublishAction({ name, version, existence: status }),
  };
}

function printPlanRow(plan) {
  const existence = plan.existence ?? 'n/a';
  const would = plan.action === 'refuse' ? 'REFUSE' : plan.action === 'skip' ? 'SKIP' : 'PUBLISH';
  console.log(`${plan.name}@${plan.version}\t${existence}\twould ${would}`);
  console.error(plan.message);
}

function parseArgs(argv) {
  const args = { folder: undefined, name: undefined, version: undefined, plan: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--plan') {
      args.plan = true;
    } else if (token === '--folder') {
      args.folder = argv[i + 1];
      i += 1;
    } else if (token === '--name') {
      args.name = argv[i + 1];
      i += 1;
    } else if (token === '--version') {
      args.version = argv[i + 1];
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  return args;
}

export function main(argv = process.argv.slice(2), runNpmView = defaultRunNpmView) {
  const args = parseArgs(argv);

  if (args.plan) {
    const folders = existingPublishableFolders();
    for (const folder of folders) {
      const pkg = readPublishablePackage(folder);
      const plan = planPackage({ ...pkg, runNpmView });
      printPlanRow(plan);
      if (plan.action === 'refuse') {
        process.exitCode = 1;
      }
    }
    return;
  }

  let name;
  let version;
  if (args.folder) {
    const pkg = readPublishablePackage(args.folder);
    name = pkg.name;
    version = pkg.version;
    if (pkg.name !== npmNameForFolder(args.folder)) {
      throw new Error(
        `packages/${args.folder} name is ${pkg.name}, expected ${npmNameForFolder(args.folder)}`,
      );
    }
  } else if (args.name && args.version) {
    name = args.name;
    version = args.version;
  } else {
    throw new Error(
      'Usage: npm-publish-guard.mjs --folder <folder> | --name <name> --version <version> | --plan',
    );
  }

  const plan = planPackage({ name, version, runNpmView });
  console.error(plan.message);
  if (plan.action === 'refuse') {
    process.exit(1);
  }
  process.stdout.write(`${plan.action}\n`);
}

const invokedDirectly =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
