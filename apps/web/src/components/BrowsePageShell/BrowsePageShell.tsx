import type { ReactElement, ReactNode } from 'react';

import classes from './BrowsePageShell.module.css';

export interface BrowsePageShellProps {
  readonly children: ReactNode;
  /**
   * Bound the page to the viewport so a comparison table scrolls on its own.
   * Card-only pages pass `false` and scroll with the document.
   */
  readonly fillViewport?: boolean;
}

export function BrowsePageShell({
  children,
  fillViewport = true,
}: BrowsePageShellProps): ReactElement {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={classes['page']}
      data-fill-viewport={fillViewport ? '' : undefined}
    >
      {children}
    </main>
  );
}
