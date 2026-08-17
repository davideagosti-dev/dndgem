#!/usr/bin/env node
/**
 * Pack existing publishable `@dndgem/*` packages (topology: scripts/package-topology.mjs),
 * then install the current Alpha tarballs into an isolated consumer fixture.
 * Validates contents, ESM/type entrypoints, Core solve, Vanilla session, React mount, Vue mount, and Angular mount when present.
 *
 * Does not publish. New adapters are packed when their package folder exists.
 * The consumer fixture covers every packed publishable package.
 */
import { execFileSync, execSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, isAbsolute, join } from 'node:path';
import { existingPublishableFolders, REPO_ROOT } from './package-topology.mjs';

const root = REPO_ROOT;
const packDir = join(root, '.tmp', 'pack');

const PUBLIC_PACKAGES = existingPublishableFolders();

const FORBIDDEN_PATH_SNIPPETS = [
  'tests/',
  'src/',
  'benchmarks/',
  'fixtures/',
  'vitest.config',
  'tsconfig',
  'eslint',
  '.changeset',
];

function readPkg(dir) {
  return JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'), 'utf8'));
}

function run(command, options = {}) {
  return execSync(command, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  });
}

function runInherit(command, options = {}) {
  execSync(command, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });
}

function listTarball(tarballPath) {
  const output = execFileSync('tar', ['-tf', tarballPath], { encoding: 'utf8' });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^package\//, ''));
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parsePackJson(raw) {
  const start = raw.indexOf('{');
  assert(start !== -1, `pnpm pack did not print JSON: ${raw}`);
  return JSON.parse(raw.slice(start));
}

function packOne(dir) {
  const pkg = readPkg(dir);
  const raw = run(`pnpm pack --json --pack-destination "${packDir}"`, {
    cwd: join(root, 'packages', dir),
  }).trim();
  const parsed = parsePackJson(raw);
  const tarballPath = parsed.filename ?? parsed.path;
  assert(
    typeof tarballPath === 'string' && tarballPath.length > 0,
    `pnpm pack did not return a path for ${dir}`,
  );
  const resolved = existsSync(tarballPath)
    ? tarballPath
    : isAbsolute(tarballPath)
      ? tarballPath
      : join(packDir, tarballPath);
  assert(existsSync(resolved), `packed tarball not found: ${resolved}`);
  const files = Array.isArray(parsed.files)
    ? parsed.files.map((file) => file.path ?? file)
    : listTarball(resolved);
  const packedSize = statSync(resolved).size;
  let unpackedSize = 0;
  try {
    const listing = execFileSync('tar', ['-tvf', resolved], { encoding: 'utf8' });
    for (const line of listing.split(/\r?\n/)) {
      const match =
        line.match(/\s(\d+)\s+\d{4}-\d{2}-\d{2}/) ?? line.match(/\s(\d+)\s+[A-Z][a-z]{2}/);
      if (match) {
        unpackedSize += Number(match[1]);
      }
    }
  } catch {
    unpackedSize = packedSize;
  }

  for (const snippet of FORBIDDEN_PATH_SNIPPETS) {
    const leaked = files.filter((file) => file.includes(snippet) && !file.startsWith('dist/'));
    assert(
      leaked.length === 0,
      `${pkg.name} packed forbidden path (${snippet}): ${leaked.join(', ')}`,
    );
  }
  assert(files.includes('package.json'), `${pkg.name} tarball missing package.json`);
  assert(files.includes('LICENSE'), `${pkg.name} tarball missing LICENSE`);
  assert(files.includes('README.md'), `${pkg.name} tarball missing README.md`);
  assert(files.includes('dist/index.js'), `${pkg.name} tarball missing dist/index.js`);
  assert(files.includes('dist/index.d.ts'), `${pkg.name} tarball missing dist/index.d.ts`);

  const packedPkgJson = JSON.parse(
    execFileSync('tar', ['-xOf', resolved, 'package/package.json'], { encoding: 'utf8' }),
  );
  assert(packedPkgJson.author === 'DA62', `${pkg.name} packed author must be DA62`);
  assert(
    typeof packedPkgJson.homepage === 'string' &&
      packedPkgJson.homepage.replace(/\/$/, '') === 'https://dndgem.dev',
    `${pkg.name} packed homepage must be https://dndgem.dev`,
  );
  assert(
    packedPkgJson.bugs?.email === 'support@dndgem.dev',
    `${pkg.name} packed bugs.email must be support@dndgem.dev`,
  );
  assert(
    !JSON.stringify(packedPkgJson).includes('fingem-ai.com'),
    `${pkg.name} packed package.json must not contain fingem-ai.com`,
  );

  const packedReadme = execFileSync('tar', ['-xOf', resolved, 'package/README.md'], {
    encoding: 'utf8',
  });
  assert(
    packedReadme.includes('support@dndgem.dev'),
    `${pkg.name} packed README must include support@dndgem.dev`,
  );
  assert(
    packedReadme.includes('https://playground.dndgem.dev/'),
    `${pkg.name} packed README must include canonical playground URL`,
  );
  assert(
    !packedReadme.includes('support@fingem-ai.com'),
    `${pkg.name} packed README must not advertise support@fingem-ai.com`,
  );
  assert(packedReadme.includes('DA62'), `${pkg.name} packed README must attribute DA62`);

  const indexDts = execFileSync('tar', ['-xOf', resolved, 'package/dist/index.d.ts'], {
    encoding: 'utf8',
  });
  assert(
    !/from ['"]@dnd-kit\//.test(indexDts) && !/import\(['"]@dnd-kit\//.test(indexDts),
    `${pkg.name} public types import @dnd-kit`,
  );
  assert(!indexDts.includes('packages/'), `${pkg.name} public types leak monorepo paths`);
  assert(!/from '\.\.\/src\//.test(indexDts), `${pkg.name} public types leak source paths`);

  if (dir === 'dom') {
    const sessionDts = execFileSync('tar', ['-xOf', resolved, 'package/dist/session.d.ts'], {
      encoding: 'utf8',
    });
    assert(
      sessionDts.includes('proposalUnplacedItemIds'),
      `${pkg.name} public types must expose proposalUnplacedItemIds`,
    );
    assert(
      /readonly proposalUnplacedItemIds:\s*readonly string\[\]/.test(sessionDts),
      `${pkg.name} proposalUnplacedItemIds must be readonly string[]`,
    );
    assert(
      !/interface LayoutSessionAutoLayoutState \{[^}]*\bunplacedItemIds\b/.test(
        sessionDts.replace(/\s+/g, ' '),
      ),
      `${pkg.name} must not expose ambiguous session-level unplacedItemIds`,
    );
  }
  if (dir === 'core') {
    assert(
      /export \{[^}]*createAutoLayoutProposal/.test(indexDts) &&
        /export \{[^}]*PlacementOrigin/.test(indexDts),
      `${pkg.name} public types must expose Auto-Layout proposal surface`,
    );
    assert(
      !/export \{[^}]*maxProbeCountForOccupancy/.test(indexDts) &&
        !/export declare function maxProbeCountForOccupancy/.test(indexDts),
      `${pkg.name} must not export maxProbeCountForOccupancy`,
    );
  }
  if (dir === 'react' || dir === 'vue' || dir === 'angular' || dir === 'svelte') {
    const typesDts = execFileSync('tar', ['-xOf', resolved, 'package/dist/types.d.ts'], {
      encoding: 'utf8',
    });
    assert(
      /autoLayout\??:\s*boolean/.test(typesDts),
      `${pkg.name} public types must expose autoLayout?: boolean`,
    );
  }
  if (dir === 'angular') {
    const boardDirectiveJs = execFileSync(
      'tar',
      ['-xOf', resolved, 'package/dist/board.directive.js'],
      { encoding: 'utf8' },
    );
    assert(
      boardDirectiveJs.includes('ɵɵngDeclareDirective'),
      `${pkg.name} must ship Angular partial compilation (ɵɵngDeclareDirective)`,
    );
    assert(
      !JSON.stringify(packedPkgJson.dependencies ?? {}).includes('@dndgem/react') &&
        !JSON.stringify(packedPkgJson.dependencies ?? {}).includes('@dndgem/vue') &&
        !JSON.stringify(packedPkgJson.peerDependencies ?? {}).includes('@dnd-kit/'),
      `${pkg.name} must not depend on React, Vue, or dnd-kit`,
    );
  }
  if (dir === 'svelte') {
    assert(
      packedPkgJson.exports?.['.']?.svelte === './dist/index.js',
      `${pkg.name} must declare a svelte export condition`,
    );
    assert(
      packedPkgJson.exports?.['.']?.browser === './dist/index.js',
      `${pkg.name} must declare a browser export condition for client consumers`,
    );
    assert(
      packedPkgJson.exports?.['.']?.node === './dist/index.server.js',
      `${pkg.name} must declare a node/SSR export condition`,
    );
    assert(
      !JSON.stringify(packedPkgJson.dependencies ?? {}).includes('@dndgem/react') &&
        !JSON.stringify(packedPkgJson.dependencies ?? {}).includes('@dndgem/vue') &&
        !JSON.stringify(packedPkgJson.dependencies ?? {}).includes('@dndgem/angular') &&
        !JSON.stringify(packedPkgJson.peerDependencies ?? {}).includes('@dnd-kit/'),
      `${pkg.name} must not depend on React, Vue, Angular, or dnd-kit`,
    );
  }

  return {
    name: pkg.name,
    version: pkg.version,
    tarballPath: resolved,
    files,
    packedSize,
    unpackedSize,
    fileCount: files.length,
  };
}

const coreSmoke = `import {
  createAutoLayoutProposal,
  createLayoutIntent,
  getCorePackageInfo,
  solveLayout,
} from '@dndgem/core';

const info = getCorePackageInfo();
if (info.name !== '@dndgem/core') {
  throw new Error('core package name mismatch');
}

const result = solveLayout({
  intent: createLayoutIntent({
    space: { width: 400, height: 200 },
    items: [{ id: 'chart', constraints: { minWidth: 40, preferredWidth: 120 } }],
    desiredPlacements: { chart: { x: 8, y: 8, width: 120, height: 60 } },
  }),
});

if (result.evaluation.state !== 'VALID' && result.evaluation.state !== 'DEGRADED') {
  throw new Error(\`unexpected core validity: \${result.evaluation.state}\`);
}
if (result.resolved.placements.chart === undefined) {
  throw new Error('core solve did not place chart');
}

const proposal = createAutoLayoutProposal({
  intent: createLayoutIntent({
    space: { width: 400, height: 200 },
    items: [
      { id: 'a', constraints: { preferredWidth: 80, preferredHeight: 40, minWidth: 20 } },
      { id: 'b', constraints: { preferredWidth: 80, preferredHeight: 40, minWidth: 20 } },
    ],
  }),
});
if (proposal.unplacedItemIds.length !== 0) {
  throw new Error('expected fully automatic proposal to place both items');
}
const autoSolved = solveLayout({ intent: proposal.effectiveIntent });
if (autoSolved.resolved.placements.a === undefined || autoSolved.resolved.placements.b === undefined) {
  throw new Error('auto-layout compose did not place items');
}

console.log('core packed consumer smoke ok', info.version, result.evaluation.state);
`;

const vanillaSmoke = `import { JSDOM } from 'jsdom';
import { createLayoutSession } from '@dndgem/dom';
import { getDomPackageInfo } from '@dndgem/dom';

const info = getDomPackageInfo();
if (info.name !== '@dndgem/dom' || info.core.name !== '@dndgem/core') {
  throw new Error('dom package info mismatch');
}

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
const { document } = dom.window;
globalThis.window = dom.window;
globalThis.document = document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

function stub(el, box) {
  el.getBoundingClientRect = () => ({
    x: box.left,
    y: box.top,
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    right: box.left + box.width,
    bottom: box.top + box.height,
    toJSON() {
      return {};
    },
  });
}

const container = document.createElement('div');
const chart = document.createElement('article');
document.body.append(container, chart);
stub(container, { left: 0, top: 0, width: 400, height: 200 });
stub(chart, { left: 8, top: 8, width: 120, height: 60 });

const mechanics = {
  connect() {
    return { dispose() {} };
  },
};

const session = createLayoutSession({
  container,
  items: [{ id: 'chart', element: chart, constraints: { minWidth: 40, preferredWidth: 120 } }],
  desiredPlacements: { chart: { x: 8, y: 8, width: 120, height: 60 } },
  mechanics,
  ResizeObserver: globalThis.ResizeObserver,
});

const state = session.getState();
if (state.resolved.placements.chart === undefined) {
  throw new Error('vanilla session did not resolve chart');
}
session.dispose();

const autoContainer = document.createElement('div');
const autoA = document.createElement('article');
const autoB = document.createElement('article');
document.body.append(autoContainer, autoA, autoB);
stub(autoContainer, { left: 0, top: 0, width: 400, height: 200 });
stub(autoA, { left: 0, top: 0, width: 80, height: 40 });
stub(autoB, { left: 0, top: 0, width: 80, height: 40 });
const autoSession = createLayoutSession({
  container: autoContainer,
  items: [
    { id: 'a', element: autoA, constraints: { preferredWidth: 80, preferredHeight: 40, minWidth: 20 } },
    { id: 'b', element: autoB, constraints: { preferredWidth: 80, preferredHeight: 40, minWidth: 20 } },
  ],
  autoLayout: true,
  mechanics,
  ResizeObserver: globalThis.ResizeObserver,
});
const autoState = autoSession.getState();
if (autoState.autoLayout?.enabled !== true) {
  throw new Error('expected autoLayout state when enabled');
}
if (!Array.isArray(autoState.autoLayout.proposalUnplacedItemIds)) {
  throw new Error('expected proposalUnplacedItemIds on autoLayout state');
}
if ('unplacedItemIds' in autoState.autoLayout) {
  throw new Error('session autoLayout must not expose ambiguous unplacedItemIds');
}
if (autoState.resolved.placements.a === undefined || autoState.resolved.placements.b === undefined) {
  throw new Error('auto-layout session did not place items');
}
autoSession.dispose();

console.log('dom packed consumer smoke ok', info.version, state.solver.evaluation.state);
`;

const reactSmoke = `import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import {
  DnDGemProvider,
  getReactPackageInfo,
  useDnDGem,
  useDnDGemContainer,
  useDnDGemItem,
} from '@dndgem/react';

const info = getReactPackageInfo();
if (info.name !== '@dndgem/react' || info.dom.name !== '@dndgem/dom') {
  throw new Error('react package info mismatch');
}

const jsdom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
const { window } = jsdom;
globalThis.window = window;
globalThis.document = window.document;
globalThis.HTMLElement = window.HTMLElement;
globalThis.Element = window.Element;
globalThis.Node = window.Node;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

function stub(el, box) {
  el.getBoundingClientRect = () => ({
    x: box.left,
    y: box.top,
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    right: box.left + box.width,
    bottom: box.top + box.height,
    toJSON() {
      return {};
    },
  });
}

function Board() {
  const containerRef = useDnDGemContainer();
  const chart = useDnDGemItem('chart');
  const { ready } = useDnDGem();
  return createElement(
    'div',
    {
      ref: (node) => {
        if (node) {
          stub(node, { left: 0, top: 0, width: 400, height: 200 });
        }
        containerRef(node);
      },
    },
    createElement('article', {
      ref: (node) => {
        if (node) {
          stub(node, { left: 8, top: 8, width: 120, height: 60 });
        }
        chart.ref(node);
      },
      style: chart.style,
      'data-ready': ready ? 'yes' : 'no',
    }),
  );
}

const mechanics = {
  connect() {
    return { dispose() {} };
  },
};

const rootEl = window.document.getElementById('root');
const root = createRoot(rootEl);
await act(async () => {
  root.render(
    createElement(
      DnDGemProvider,
      {
        items: [{ id: 'chart', constraints: { minWidth: 40, preferredWidth: 120 } }],
        desiredPlacements: { chart: { x: 8, y: 8, width: 120, height: 60 } },
        mechanics,
        ResizeObserver: globalThis.ResizeObserver,
      },
      createElement(Board),
    ),
  );
});

if (!rootEl.querySelector('article')) {
  throw new Error('react packed consumer did not mount an item');
}
await act(async () => {
  root.unmount();
});

function AutoBoard() {
  const containerRef = useDnDGemContainer();
  const itemA = useDnDGemItem('a');
  const itemB = useDnDGemItem('b');
  const { state } = useDnDGem();
  return createElement(
    'div',
    {
      ref: (node) => {
        if (node) {
          stub(node, { left: 0, top: 0, width: 400, height: 200 });
        }
        containerRef(node);
      },
      'data-auto': state?.autoLayout?.enabled ? 'yes' : 'no',
      'data-unplaced': state?.autoLayout?.proposalUnplacedItemIds?.join(',') ?? '',
    },
    createElement('article', {
      ref: (node) => {
        if (node) {
          stub(node, { left: 0, top: 0, width: 80, height: 40 });
        }
        itemA.ref(node);
      },
      style: itemA.style,
    }),
    createElement('article', {
      ref: (node) => {
        if (node) {
          stub(node, { left: 0, top: 0, width: 80, height: 40 });
        }
        itemB.ref(node);
      },
      style: itemB.style,
    }),
  );
}

const autoRootEl = window.document.createElement('div');
window.document.body.append(autoRootEl);
const autoRoot = createRoot(autoRootEl);
await act(async () => {
  autoRoot.render(
    createElement(
      DnDGemProvider,
      {
        autoLayout: true,
        items: [
          { id: 'a', constraints: { preferredWidth: 80, preferredHeight: 40, minWidth: 20 } },
          { id: 'b', constraints: { preferredWidth: 80, preferredHeight: 40, minWidth: 20 } },
        ],
        mechanics,
        ResizeObserver: globalThis.ResizeObserver,
      },
      createElement(AutoBoard),
    ),
  );
});
if (autoRootEl.querySelector('[data-auto="yes"]') === null) {
  throw new Error('react packed consumer autoLayout did not enable session state');
}
await act(async () => {
  autoRoot.unmount();
});
console.log('react packed consumer smoke ok', info.version);
`;

const vueSmoke = `import { JSDOM } from 'jsdom';

const jsdom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
const { window } = jsdom;
globalThis.window = window;
globalThis.document = window.document;
globalThis.HTMLElement = window.HTMLElement;
globalThis.SVGElement = window.SVGElement;
globalThis.Element = window.Element;
globalThis.Node = window.Node;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const { createApp, h, nextTick } = await import('vue');
const {
  DnDGemProvider,
  getVuePackageInfo,
  useDnDGem,
  useDnDGemContainer,
  useDnDGemItem,
} = await import('@dndgem/vue');

const info = getVuePackageInfo();
if (info.name !== '@dndgem/vue' || info.dom.name !== '@dndgem/dom') {
  throw new Error('vue package info mismatch');
}

function stub(el, box) {
  el.getBoundingClientRect = () => ({
    x: box.left,
    y: box.top,
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    right: box.left + box.width,
    bottom: box.top + box.height,
    toJSON() {
      return {};
    },
  });
}

const Board = {
  setup() {
    const containerRef = useDnDGemContainer();
    const chart = useDnDGemItem('chart');
    const { ready } = useDnDGem();
    return () =>
      h(
        'div',
        {
          ref: (node) => {
            if (node) {
              stub(node, { left: 0, top: 0, width: 400, height: 200 });
            }
            containerRef(node);
          },
        },
        h('article', {
          ref: (node) => {
            if (node) {
              stub(node, { left: 8, top: 8, width: 120, height: 60 });
            }
            chart.ref(node);
          },
          style: chart.style.value,
          'data-ready': ready.value ? 'yes' : 'no',
        }),
      );
  },
};

const mechanics = {
  connect() {
    return { dispose() {} };
  },
};

const app = createApp({
  setup() {
    return () =>
      h(
        DnDGemProvider,
        {
          items: [{ id: 'chart', constraints: { minWidth: 40, preferredWidth: 120 } }],
          desiredPlacements: { chart: { x: 8, y: 8, width: 120, height: 60 } },
          mechanics,
          ResizeObserver: globalThis.ResizeObserver,
        },
        { default: () => h(Board) },
      );
  },
});
app.mount(window.document.getElementById('app'));
await nextTick();
if (!window.document.querySelector('article')) {
  throw new Error('vue packed consumer did not mount an item');
}
app.unmount();
console.log('vue packed consumer smoke ok', info.version);
`;

const angularSmoke = `import { JSDOM } from 'jsdom';

const jsdom = new JSDOM('<!doctype html><html><body><app-root></app-root></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
const { window } = jsdom;
globalThis.window = window;
globalThis.document = window.document;
globalThis.HTMLElement = window.HTMLElement;
globalThis.SVGElement = window.SVGElement;
globalThis.Element = window.Element;
globalThis.Node = window.Node;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

await import('@angular/compiler');
const { Component, provideZonelessChangeDetection } = await import('@angular/core');
const { bootstrapApplication } = await import('@angular/platform-browser');
const {
  DNDGEM_BOARD_IMPORTS,
  getAngularPackageInfo,
} = await import('@dndgem/angular');

const info = getAngularPackageInfo();
if (info.name !== '@dndgem/angular' || info.dom.name !== '@dndgem/dom') {
  throw new Error('angular package info mismatch');
}

function stub(el, box) {
  el.getBoundingClientRect = () => ({
    x: box.left,
    y: box.top,
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    right: box.left + box.width,
    bottom: box.top + box.height,
    toJSON() {
      return {};
    },
  });
}

const Host = Component({
  standalone: true,
  selector: 'app-root',
  imports: [...DNDGEM_BOARD_IMPORTS],
  template: \`
    <div dndgemBoard dndgemContainer [dndgemItems]="items" [dndgemDesiredPlacements]="desired"
      [dndgemMechanics]="mechanics" [dndgemResizeObserver]="observer">
      <article dndgemItem="chart"></article>
    </div>
  \`,
})(class {
  items = [{ id: 'chart', constraints: { minWidth: 40, preferredWidth: 120 } }];
  desired = { chart: { x: 8, y: 8, width: 120, height: 60 } };
  mechanics = { connect() { return { dispose() {} }; } };
  observer = globalThis.ResizeObserver;
});

const appRef = await bootstrapApplication(Host, {
  providers: [provideZonelessChangeDetection()],
});
const root = window.document.querySelector('app-root');
if (root) {
  const board = root.querySelector('div');
  const chart = root.querySelector('article');
  if (board) stub(board, { left: 0, top: 0, width: 400, height: 200 });
  if (chart) stub(chart, { left: 8, top: 8, width: 120, height: 60 });
}
if (!window.document.querySelector('article')) {
  throw new Error('angular packed consumer did not mount an item');
}
appRef.destroy();
console.log('angular packed consumer smoke ok', info.version);
`;

const svelteSmoke = `import { JSDOM } from 'jsdom';

const jsdom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
const { window } = jsdom;
globalThis.window = window;
globalThis.document = window.document;
for (const key of Object.getOwnPropertyNames(window)) {
  if (typeof globalThis[key] === 'undefined') {
    try {
      globalThis[key] = window[key];
    } catch {
      // ignore host-object getters that cannot be copied
    }
  }
}
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const { createRawSnippet, flushSync, mount, unmount } = await import('svelte');
const {
  DnDGemProvider,
  getSveltePackageInfo,
} = await import('@dndgem/svelte');

const info = getSveltePackageInfo();
if (info.name !== '@dndgem/svelte' || info.dom.name !== '@dndgem/dom') {
  throw new Error('svelte package info mismatch');
}

function stub(el, box) {
  el.getBoundingClientRect = () => ({
    x: box.left,
    y: box.top,
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    right: box.left + box.width,
    bottom: box.top + box.height,
    toJSON() {
      return {};
    },
  });
}

const mechanics = {
  connect() {
    return { dispose() {} };
  },
};

const children = createRawSnippet((raw) => ({
  render: () => \`<div><article></article></div>\`,
  setup(element) {
    const props = raw();
    const board = element;
    const chart = element.querySelector('article');
    stub(board, { left: 0, top: 0, width: 400, height: 200 });
    if (chart) stub(chart, { left: 8, top: 8, width: 120, height: 60 });
    const containerAction = props.dndgemContainer;
    const itemAction = props.dndgemItem;
    const containerLife = containerAction(board);
    const itemLife = chart ? itemAction(chart, 'chart') : undefined;
    return () => {
      itemLife?.destroy?.();
      containerLife?.destroy?.();
    };
  },
}));

const app = mount(DnDGemProvider, {
  target: window.document.getElementById('app'),
  props: {
    items: [{ id: 'chart', constraints: { minWidth: 40, preferredWidth: 120 } }],
    desiredPlacements: { chart: { x: 8, y: 8, width: 120, height: 60 } },
    mechanics,
    ResizeObserver: globalThis.ResizeObserver,
    children,
  },
});
flushSync();
if (!window.document.querySelector('article')) {
  throw new Error('svelte packed consumer did not mount an item');
}
unmount(app);
console.log('svelte packed consumer smoke ok', info.version);
`;

const typecheckSource = `import {
  createAutoLayoutProposal,
  createLayoutIntent,
  solveLayout,
  type AutoLayoutProposal,
  type AutoLayoutProposalInput,
  type LayoutIntent,
  type PlacementOrigin,
  type SolverResult,
} from '@dndgem/core';
import {
  createLayoutSession,
  type LayoutSession,
  type LayoutSessionAutoLayoutState,
  type LayoutSessionState,
} from '@dndgem/dom';
import {
  DnDGemProvider,
  useDnDGem,
  useDnDGemContainer,
  useDnDGemItem,
  type DnDGemProviderProps,
} from '@dndgem/react';
import {
  DnDGemProvider as VueDnDGemProvider,
  useDnDGem as useVueDnDGem,
  useDnDGemContainer as useVueDnDGemContainer,
  useDnDGemItem as useVueDnDGemItem,
  type DnDGemProviderProps as VueDnDGemProviderProps,
} from '@dndgem/vue';
import {
  DNDGEM_BOARD_IMPORTS,
  DnDGemBoardDirective,
  injectDnDGem,
  type DnDGemBoardConfig,
} from '@dndgem/angular';
import {
  DnDGemProvider as SvelteDnDGemProvider,
  getDnDGem,
  dndgemContainer,
  dndgemItem,
  type DnDGemProviderProps as SvelteDnDGemProviderProps,
} from '@dndgem/svelte';

export const intent: LayoutIntent = createLayoutIntent({
  space: { width: 100, height: 80 },
  items: [{ id: 'a' }],
});
export const proposalInput: AutoLayoutProposalInput = { intent };
export const proposal: AutoLayoutProposal = createAutoLayoutProposal(proposalInput);
export const origin: PlacementOrigin = 'generated';
export const solved: SolverResult = solveLayout({ intent: proposal.effectiveIntent });
export type Session = LayoutSession;
export type SessionState = LayoutSessionState;
export type AutoState = LayoutSessionAutoLayoutState;
export type ProviderProps = DnDGemProviderProps;
export const autoLayoutProp: ProviderProps['autoLayout'] = true;
export const proposalUnplaced: AutoState['proposalUnplacedItemIds'] = [];
export const hooks = { useDnDGem, useDnDGemContainer, useDnDGemItem, DnDGemProvider };
export type VueProviderProps = VueDnDGemProviderProps;
export const vueAutoLayoutProp: VueProviderProps['autoLayout'] = true;
export const vueHooks = {
  useVueDnDGem,
  useVueDnDGemContainer,
  useVueDnDGemItem,
  VueDnDGemProvider,
};
export type AngularBoardConfig = DnDGemBoardConfig;
export const angularAutoLayoutProp: AngularBoardConfig['autoLayout'] = true;
export const angularApi = {
  DNDGEM_BOARD_IMPORTS,
  DnDGemBoardDirective,
  injectDnDGem,
};
export type SvelteProviderProps = SvelteDnDGemProviderProps;
export const svelteAutoLayoutProp: SvelteProviderProps['autoLayout'] = true;
export const svelteApi = {
  SvelteDnDGemProvider,
  getDnDGem,
  dndgemContainer,
  dndgemItem,
};
`;

console.log('Building publishable packages…');
runInherit('pnpm --filter "./packages/**" build');

rmSync(packDir, { recursive: true, force: true });
mkdirSync(packDir, { recursive: true });

const packed = PUBLIC_PACKAGES.map(packOne);
assert(
  packed.some((item) => item.name === '@dndgem/vue'),
  'expected packed @dndgem/vue while packages/vue exists',
);
assert(
  packed.some((item) => item.name === '@dndgem/angular'),
  'expected packed @dndgem/angular while packages/angular exists',
);
assert(
  packed.some((item) => item.name === '@dndgem/svelte'),
  'expected packed @dndgem/svelte while packages/svelte exists',
);

console.log('\nPackage artifacts');
for (const item of packed) {
  console.log(
    `- ${item.name}@${item.version}: ${item.tarballPath}\n  packed ${formatBytes(item.packedSize)}, unpacked ~${formatBytes(item.unpackedSize)}, ${item.fileCount} files`,
  );
}

const consumerDir = mkdtempSync(join(tmpdir(), 'dndgem-pack-consumer-'));
const localTarballs = {};
for (const item of packed) {
  const localName = basename(item.tarballPath);
  copyFileSync(item.tarballPath, join(consumerDir, localName));
  localTarballs[item.name] = `file:./${localName}`;
}

writeFileSync(
  join(consumerDir, 'package.json'),
  `${JSON.stringify(
    {
      name: 'dndgem-pack-consumer',
      private: true,
      type: 'module',
      dependencies: {
        '@dndgem/core': localTarballs['@dndgem/core'],
        '@dndgem/dom': localTarballs['@dndgem/dom'],
        '@dndgem/react': localTarballs['@dndgem/react'],
        '@dndgem/vue': localTarballs['@dndgem/vue'],
        '@dndgem/angular': localTarballs['@dndgem/angular'],
        '@dndgem/svelte': localTarballs['@dndgem/svelte'],
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        vue: '^3.5.0',
        '@angular/core': '~21.2.0',
        '@angular/compiler': '~21.2.0',
        '@angular/platform-browser': '~21.2.0',
        svelte: '^5.0.0',
        rxjs: '^7.8.2',
        jsdom: '^26.0.0',
        typescript: '^5.0.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
      },
      pnpm: {
        overrides: {
          '@dndgem/core': localTarballs['@dndgem/core'],
          '@dndgem/dom': localTarballs['@dndgem/dom'],
          '@dndgem/react': localTarballs['@dndgem/react'],
          '@dndgem/vue': localTarballs['@dndgem/vue'],
          '@dndgem/angular': localTarballs['@dndgem/angular'],
          '@dndgem/svelte': localTarballs['@dndgem/svelte'],
        },
      },
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  join(consumerDir, 'tsconfig.json'),
  `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        skipLibCheck: false,
        jsx: 'react-jsx',
        types: [],
      },
      include: ['consumer-types.ts'],
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  join(consumerDir, '.npmrc'),
  ['engine-strict=false', 'strict-peer-dependencies=false', ''].join('\n'),
);

writeFileSync(join(consumerDir, 'core-smoke.mjs'), coreSmoke);
writeFileSync(join(consumerDir, 'vanilla-smoke.mjs'), vanillaSmoke);
writeFileSync(join(consumerDir, 'react-smoke.mjs'), reactSmoke);
writeFileSync(join(consumerDir, 'vue-smoke.mjs'), vueSmoke);
writeFileSync(join(consumerDir, 'angular-smoke.mjs'), angularSmoke);
writeFileSync(join(consumerDir, 'svelte-smoke.mjs'), svelteSmoke);
writeFileSync(join(consumerDir, 'consumer-types.ts'), typecheckSource);

console.log(`\nInstalling packed tarballs into ${consumerDir}`);
runInherit('pnpm install', { cwd: consumerDir });

console.log('\nRuntime smokes');
runInherit('node core-smoke.mjs', { cwd: consumerDir });
runInherit('node vanilla-smoke.mjs', { cwd: consumerDir });
runInherit('node react-smoke.mjs', { cwd: consumerDir });
runInherit('node vue-smoke.mjs', { cwd: consumerDir });
runInherit('node angular-smoke.mjs', { cwd: consumerDir });
runInherit('node --conditions=browser svelte-smoke.mjs', { cwd: consumerDir });

console.log('\nConsumer typecheck');
runInherit('pnpm exec tsc --noEmit -p tsconfig.json', { cwd: consumerDir });

const pre = JSON.parse(readFileSync(join(root, '.changeset', 'pre.json'), 'utf8'));
assert(pre.mode === 'pre', 'Changesets pre mode must be active');
assert(pre.tag === 'alpha', 'Changesets pre tag must be alpha');

const pendingFirstAlphaPath = join(root, '.changeset', 'dnd-2-2-alpha-api.md');
const consumedFirstAlphaPath = join(root, '.changeset', 'pre', 'dnd-2-2-alpha-api.md');
const pendingAutoLayoutPath = join(root, '.changeset', 'dnd-3-4-auto-layout-dom-react.md');
const consumedAutoLayoutPath = join(root, '.changeset', 'pre', 'dnd-3-4-auto-layout-dom-react.md');
const versions = ['core', 'dom', 'react'].map(
  (name) => JSON.parse(readFileSync(join(root, 'packages', name, 'package.json'), 'utf8')).version,
);
const allAlpha0 = versions.every((v) => v === '0.1.0-alpha.0');
const allZero = versions.every((v) => v === '0.0.0');
const aligned = versions.every((v) => v === versions[0]);
const alphaPrerelease = /^0\.1\.0-alpha\.\d+$/;
const allAlphaPrerelease = versions.every((v) => alphaPrerelease.test(v));
assert(aligned, `fixed package group versions must stay aligned; got ${versions.join(', ')}`);

if (existsSync(pendingFirstAlphaPath)) {
  const changeset = readFileSync(pendingFirstAlphaPath, 'utf8');
  assert(
    changeset.includes("'@dndgem/core': minor") &&
      changeset.includes("'@dndgem/dom': minor") &&
      changeset.includes("'@dndgem/react': minor"),
    'Alpha changeset must minor-bump the fixed package group (0.0.0 → 0.1.0-alpha.0)',
  );
  assert(
    allZero,
    'Pending Alpha changeset expects package versions to remain 0.0.0 until versioned',
  );
  console.log('\nChangesets pre mode:', pre.tag, '— first intended publish version 0.1.0-alpha.0');
} else if (existsSync(consumedFirstAlphaPath) && allAlpha0) {
  if (existsSync(pendingAutoLayoutPath)) {
    const changeset = readFileSync(pendingAutoLayoutPath, 'utf8');
    assert(
      changeset.includes("'@dndgem/core': minor") &&
        changeset.includes("'@dndgem/dom': minor") &&
        changeset.includes("'@dndgem/react': minor"),
      'DND-3.4 changeset must minor-bump the fixed package group for the next Alpha',
    );
    assert(
      changeset.includes('proposalUnplacedItemIds'),
      'DND-3.4 changeset must document proposalUnplacedItemIds',
    );
    console.log(
      '\nChangesets pre mode:',
      pre.tag,
      '— packages at 0.1.0-alpha.0; pending DND-3.4 minor → next 0.1.0-alpha.x via changeset version',
    );
  } else {
    console.log('\nChangesets pre mode:', pre.tag, '— packages versioned at 0.1.0-alpha.0');
  }
} else if (
  existsSync(consumedFirstAlphaPath) &&
  existsSync(consumedAutoLayoutPath) &&
  allAlphaPrerelease
) {
  assert(
    !existsSync(pendingAutoLayoutPath),
    'DND-3.4 changeset must be consumed (not still pending) once packages leave 0.1.0-alpha.0',
  );
  assert(
    versions[0] !== '0.1.0-alpha.0',
    'Consumed DND-3.4 Auto-Layout changeset expects packages beyond 0.1.0-alpha.0',
  );
  console.log(
    '\nChangesets pre mode:',
    pre.tag,
    `— packages versioned at ${versions[0]} (Auto-Layout Alpha)`,
  );
} else {
  throw new Error(
    'Expected pending first-Alpha changeset at 0.0.0, consumed first-Alpha at 0.1.0-alpha.0, or consumed DND-3.4 with aligned 0.1.0-alpha.x',
  );
}

rmSync(consumerDir, { recursive: true, force: true });

console.log('\nPacked consumer validation PASSED');
for (const item of packed) {
  console.log(` ${item.name} ${item.fileCount} files, packed ${formatBytes(item.packedSize)}`);
}
