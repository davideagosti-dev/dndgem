import type { ReactElement } from 'react';
import { CompatBoard } from './compat-board';
import { CompatNav } from './nav';

export const dynamic = 'force-dynamic';

export default function BoardPage(): ReactElement {
  return (
    <>
      <CompatNav />
      <CompatBoard />
    </>
  );
}
