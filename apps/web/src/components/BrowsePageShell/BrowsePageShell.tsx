import type { ReactElement, ReactNode } from 'react';

import classes from './BrowsePageShell.module.css';

export interface BrowsePageShellProps {
  readonly children: ReactNode;
  readonly fillViewport?: boolean;
  readonly className?: string;
}

export function BrowsePageShell({
  children,
  fillViewport = true,
  className,
}: BrowsePageShellProps): ReactElement {
  const combinedClassName = className
    ? `${classes['page']} ${className}`
    : classes['page'];

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={combinedClassName}
      {...(fillViewport ? { 'data-fill-viewport': '' } : {})}
    >
      {children}
    </main>
  );
}
