import { getCorePackageInfo } from '@dndgem/core';
import { getDomPackageInfo } from '@dndgem/dom';
import { getReactPackageInfo } from '@dndgem/react';

const core = getCorePackageInfo();
const dom = getDomPackageInfo();
const reactPkg = getReactPackageInfo();

export function App() {
  return (
    <main className="shell">
      <h1>DnDGem Playground</h1>
      <p className="eyebrow">Engineering shell only — no adaptive layout behaviour yet.</p>
      <p>
        This app exists to prove workspace linking for <code>@dndgem/core</code>,{' '}
        <code>@dndgem/dom</code>, and <code>@dndgem/react</code>.
      </p>
      <ul>
        <li>
          {core.name}@{core.version}
        </li>
        <li>
          {dom.name}@{dom.version}
        </li>
        <li>
          {reactPkg.name}@{reactPkg.version}
        </li>
      </ul>
    </main>
  );
}
