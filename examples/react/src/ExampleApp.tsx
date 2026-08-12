import { getCorePackageInfo } from '@dndgem/core';
import { getReactPackageInfo } from '@dndgem/react';

export function ExampleApp() {
  const core = getCorePackageInfo();
  const reactPkg = getReactPackageInfo();

  return (
    <main>
      <h1>DnDGem React Example</h1>
      <p>Minimal public-export consumer. No AdaptiveGrid yet.</p>
      <ul>
        <li>
          {core.name}@{core.version}
        </li>
        <li>
          {reactPkg.name}@{reactPkg.version}
        </li>
      </ul>
    </main>
  );
}
