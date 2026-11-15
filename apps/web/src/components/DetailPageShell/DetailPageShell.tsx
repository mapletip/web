import type { ReactElement, ReactNode } from 'react';

import classes from './DetailPageShell.module.css';

export interface DetailPageShellProps {
  readonly children: ReactNode;
}

/** Shared main landmark and width/padding container for record detail pages. */
export function DetailPageShell({
  children,
}: DetailPageShellProps): ReactElement {
  return (
    <main id="main-content" tabIndex={-1} className={classes['page']}>
      {children}
    </main>
  );
}
