import type { ReactElement } from 'react';
import Link from 'next/link';

export function CompatNav(): ReactElement {
  return (
    <nav>
      <Link href="/" data-testid="nav-board">
        Board
      </Link>
      <Link href="/other" data-testid="nav-other">
        Other
      </Link>
    </nav>
  );
}
