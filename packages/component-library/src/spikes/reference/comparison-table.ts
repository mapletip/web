import classes from './comparison-table.module.css';

export const comparisonTableClasses = {
  table: classes['table'] ?? '',
  headerCell: classes['headerCell'] ?? '',
  numericCell: classes['numericCell'] ?? '',
  sortedCell: classes['sortedCell'] ?? '',
} as const;

/** Default viewport-relative height limit; hosts may override. */
export const comparisonTableMaxHeight = 'calc(100dvh - 120px)';
