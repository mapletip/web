import type { ReactElement, ReactNode } from 'react';

import classes from './FacetOptionGroup.module.css';

export interface FacetOptionGroupProps {
  readonly labelId: string;
  readonly children: ReactNode;
}

export interface FacetOptionLayoutProps {
  readonly children: ReactNode;
}

/** Shared compact spacing for options and the controls that follow them. */
export function FacetOptionLayout({
  children,
}: FacetOptionLayoutProps): ReactElement {
  return <div className={classes['layout']}>{children}</div>;
}

/** Shared compact spacing and accessible grouping for a facet's options. */
export function FacetOptionGroup({
  labelId,
  children,
}: FacetOptionGroupProps): ReactElement {
  return (
    <div className={classes['group']} role="group" aria-labelledby={labelId}>
      {children}
    </div>
  );
}
