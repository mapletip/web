import { themeQuartz } from 'ag-grid-community';

/**
 * AG Grid theme derived from Mantine's CSS variables, so the grid follows the
 * active Mantine theme and color scheme without a second token system.
 * Theme params accept any CSS string, so `var(--mantine-*)` passes through.
 */
const hover = 'color-mix(in srgb, var(--mantine-color-text) 7%, transparent)';

export const comparisonGridTheme = themeQuartz.withParams({
  browserColorScheme: 'inherit',
  fontFamily: 'var(--mantine-font-family)',
  fontSize: 'var(--mantine-font-size-sm)',
  headerFontSize: 'var(--mantine-font-size-xs)',
  headerFontWeight: 650,
  backgroundColor: 'var(--mantine-color-body)',
  foregroundColor: 'var(--mantine-color-text)',
  headerBackgroundColor: 'var(--mantine-color-body)',
  headerTextColor: 'var(--mantine-color-dimmed)',
  borderColor: 'var(--mantine-color-default-border)',
  accentColor: 'var(--mantine-primary-color-filled)',
  rangeSelectionBorderColor: 'var(--mantine-primary-color-filled)',
  wrapperBorderRadius: 'var(--mantine-radius-default)',
  // Both hovers are translucent, so where they overlap the intersection is darker.
  rowHoverColor: hover,
  columnHoverColor: hover,
  oddRowBackgroundColor: 'transparent',
  // Only affects domLayout 'autoHeight'. The page layout caps the body by
  // setting this variable on an ancestor; unset means grow to fit all rows.
  autoHeightMaxBodyHeight: 'var(--comparison-grid-max-body-height, none)',
  spacing: 6,
  rowHeight: 40,
  headerHeight: 36,
  cellHorizontalPadding: 10,
  pinnedColumnBorder: {
    width: 1,
    color: 'var(--mantine-color-default-border)',
  },
});
