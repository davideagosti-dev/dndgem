import type { ReactElement } from 'react';
import { CompatNav } from '../nav';

export const dynamic = 'force-dynamic';

export default function OtherPage(): ReactElement {
  return (
    <main>
      <CompatNav />
      <h1>Other route</h1>
      <p data-testid="other-status">No DnDGem board on this route.</p>
    </main>
  );
}
