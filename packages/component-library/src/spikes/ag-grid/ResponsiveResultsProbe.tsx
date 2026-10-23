import { Box, Skeleton, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { lazy, Suspense, useMemo, useState, type ReactElement } from 'react';

import {
  sortSpikeMonsters,
  type SpikeMonster,
  type SpikeSort,
} from './fixtures';

type GridModule = typeof import('./MonsterComparisonGrid');

/** The only reference to the grid module: a dynamic import, so bundlers split it out. */
export const loadComparisonGrid = (): Promise<GridModule> =>
  import('./MonsterComparisonGrid');

/**
 * Spike probe for the rendering strategy (D2) and the import boundary (D4),
 * not a proposed component. Cards are always rendered (server HTML with real
 * links; CSS-hidden from `md`). The grid is client-only: it mounts, and its
 * module is requested, only when the `md` media query matches after hydration.
 */
export function ResponsiveResultsProbe({
  records,
  loader = loadComparisonGrid,
}: {
  readonly records: readonly SpikeMonster[];
  readonly loader?: () => Promise<GridModule>;
}): ReactElement {
  // Mantine's default: `false` on the server and first client render, then the real value.
  const desktop = useMediaQuery('(min-width: 62em)');
  const [sort, setSort] = useState<SpikeSort | null>({
    field: 'exp',
    direction: 'desc',
  });
  const rows = useMemo(() => sortSpikeMonsters(records, sort), [records, sort]);
  const LazyGrid = useMemo(
    () =>
      lazy(() =>
        loader().then((module) => ({ default: module.MonsterComparisonGrid })),
      ),
    [loader],
  );

  return (
    <>
      <Box component="ul" hiddenFrom="md" aria-label="Monster results">
        {rows.map((record) => (
          <li key={record.id}>
            <a href={record.href}>{record.name}</a>
            <Text span size="xs" c="dimmed">
              {' '}
              Lv {record.level}
            </Text>
          </li>
        ))}
      </Box>
      {desktop ? (
        <Suspense fallback={<Skeleton height={400} />}>
          <LazyGrid
            rows={rows}
            sort={sort}
            onSortChange={setSort}
            layout="bounded"
          />
        </Suspense>
      ) : null}
    </>
  );
}
