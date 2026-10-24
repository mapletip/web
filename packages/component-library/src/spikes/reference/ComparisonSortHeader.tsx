import { UnstyledButton, VisuallyHidden } from '@mantine/core';
import type { ReactElement } from 'react';

import classes from './comparison-sort-header.module.css';

export interface ComparisonSortHeaderProps {
  /** Visible text, e.g. "W.ATT". */
  readonly label: string;
  /** Expansion of an abbreviation, e.g. "Weapon attack"; visually hidden. */
  readonly fullLabel?: string;
  /** Undefined means this column is not the sort column. */
  readonly direction?: 'ascending' | 'descending';
  /** Report intent; the host chooses the next direction and re-sorts. */
  readonly onSort: () => void;
  readonly align?: 'start' | 'end';
}

/** Native sort button for a column header: label, abbreviation expansion, announced sort state. */
export function ComparisonSortHeader({
  label,
  fullLabel,
  direction,
  onSort,
  align = 'start',
}: ComparisonSortHeaderProps): ReactElement {
  return (
    <UnstyledButton
      className={classes['button']}
      data-align={align}
      onClick={onSort}
    >
      <span>{label}</span>
      {fullLabel ? <VisuallyHidden>{` (${fullLabel})`}</VisuallyHidden> : null}
      {direction ? (
        <>
          <span aria-hidden="true">
            {direction === 'ascending' ? '↑' : '↓'}
          </span>
          <VisuallyHidden>{`, sorted ${direction}`}</VisuallyHidden>
        </>
      ) : null}
    </UnstyledButton>
  );
}
