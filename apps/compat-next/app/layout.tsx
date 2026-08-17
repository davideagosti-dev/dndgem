import type { ReactNode } from 'react';
import './styles.css';

export const metadata = {
  title: 'DnDGem Next Compat',
};

export default function RootLayout({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <html lang="en">
      <body>
        <div data-testid="compat-shell">{children}</div>
      </body>
    </html>
  );
}
