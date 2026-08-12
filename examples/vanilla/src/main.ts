import { getCorePackageInfo } from '@dndgem/core';
import { getDomPackageInfo } from '@dndgem/dom';

const app = document.querySelector('#app');

if (!app) {
  throw new Error('Vanilla example root element #app was not found');
}

const core = getCorePackageInfo();
const dom = getDomPackageInfo();

app.innerHTML = `
  <h1>DnDGem Vanilla Example</h1>
  <p>Minimal public-export consumer. No adaptive layout behaviour.</p>
  <ul>
    <li>${core.name}@${core.version}</li>
    <li>${dom.name}@${dom.version}</li>
  </ul>
`;
