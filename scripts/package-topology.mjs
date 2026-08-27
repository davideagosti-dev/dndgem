/**
 * Authoritative JS/DOM package topology for DnDGem (DND-FX.1).
 *
 * Planned adapter folders may be absent. Do not create placeholder packages.
 * Flutter / AI / meta-framework packages are forbidden here; they are not
 * JS/DOM adapters over `@dndgem/dom`.
 */
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PACKAGES_DIR = join(REPO_ROOT, 'packages');

export const CORE_FOLDER = 'core';
export const DOM_FOLDER = 'dom';

export const INTELLIGENCE_FOLDER = 'intelligence';

/** Approved JS/DOM framework adapter folders — siblings over `@dndgem/dom`. */
export const FRAMEWORK_ADAPTER_FOLDERS = Object.freeze(['react', 'vue', 'angular', 'svelte']);

/** Optional private workspace layers (not publishable). */
export const OPTIONAL_PRIVATE_FOLDERS = Object.freeze([INTELLIGENCE_FOLDER]);

/**
 * Folders that must never appear under `packages/`.
 * Meta-frameworks are compatibility environments, not packages.
 */
export const FORBIDDEN_PACKAGE_FOLDERS = Object.freeze([
  'framework-core',
  'vanilla',
  'next',
  'nuxt',
  'sveltekit',
  'flutter',
  'ai',
]);

/** Framework runtime peerDependency name by adapter folder. */
export const FRAMEWORK_PEER_BY_FOLDER = Object.freeze({
  react: 'react',
  vue: 'vue',
  angular: '@angular/core',
  svelte: 'svelte',
});

export function packageJsonPath(folder) {
  return join(PACKAGES_DIR, folder, 'package.json');
}

export function packageDirExists(folder) {
  return existsSync(packageJsonPath(folder));
}

export function existingPackageFolders() {
  if (!existsSync(PACKAGES_DIR)) {
    return [];
  }
  return readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function existingAdapterFolders() {
  return FRAMEWORK_ADAPTER_FOLDERS.filter((folder) => packageDirExists(folder));
}

/** Publishable `@dndgem/*` folders that currently exist. */
export function existingPublishableFolders() {
  return [CORE_FOLDER, DOM_FOLDER, ...FRAMEWORK_ADAPTER_FOLDERS].filter((folder) =>
    packageDirExists(folder),
  );
}

export function npmNameForFolder(folder) {
  return `@dndgem/${folder}`;
}
