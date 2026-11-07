import type { ReactElement, ReactNode } from 'react';

import classes from './BrowsePageShell.module.css';

export interface BrowsePageShellProps {
  readonly children: ReactNode;
}

export function BrowsePageShell({
  children,
}: BrowsePageShellProps): ReactElement {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={classes['page']}
      data-fill-viewport=""
    >
      {children}
    </main>
  );
}
