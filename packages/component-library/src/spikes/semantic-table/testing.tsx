import { MantineProvider } from '@mantine/core';
import {
  useMemo,
  useState,
  type ComponentType,
  type ReactElement,
} from 'react';
import { expect, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../styles.css';
import { theme } from '../../theme';
import {
  createSpikeMonsters,
  sortSpikeMonsters,
  type SpikeMonsterNumericField,
  type SpikeSort,
} from '../ag-grid/fixtures';

import type { MonsterTableProps } from './types';

export const records = createSpikeMonsters(100);

export function Harness({
  Table,
  count = 100,
  initialSort = { field: 'exp', direction: 'desc' },
  hiddenColumns,
  onSortChange,
}: {
  readonly Table: ComponentType<MonsterTableProps>;
  readonly count?: number;
  readonly initialSort?: SpikeSort | null;
  readonly hiddenColumns?: readonly SpikeMonsterNumericField[];
  readonly onSortChange?: (sort: SpikeSort) => void;
}): ReactElement {
  const [sort, setSort] = useState<SpikeSort | null>(initialSort);
  const rows = useMemo(
    () => sortSpikeMonsters(records.slice(0, count), sort),
    [count, sort],
  );
  return (
    <MantineProvider theme={theme}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(0, 1fr)',
          gap: 16,
        }}
      >
        <aside aria-label="Filters">rail</aside>
        <main style={{ minWidth: 0 }}>
          <button type="button">Before table</button>
          <Table
            rows={rows}
            caption="Monsters, sorted by EXP descending"
            sort={sort}
            onSortChange={(next) => {
              onSortChange?.(next);
              setSort(next);
            }}
            {...(hiddenColumns ? { hiddenColumns } : {})}
          />
          <button type="button">After table</button>
          <div style={{ height: 1200 }} />
        </main>
      </div>
    </MantineProvider>
  );
}

export async function renderTable(
  props: Parameters<typeof Harness>[0],
): Promise<HTMLElement> {
  const screen = await render(<Harness {...props} />);
  await vi.waitFor(
    () => expect(screen.container.querySelector('tbody tr')).not.toBeNull(),
    {
      timeout: 5000,
    },
  );
  return screen.container;
}

export const bodyRows = (container: HTMLElement): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>('tbody tr'),
];

export function cell(
  container: HTMLElement,
  rowIndex: number,
  column: number,
): HTMLElement {
  const found = bodyRows(container)[rowIndex]?.children[column];
  if (!(found instanceof HTMLElement))
    throw new Error(`No cell ${rowIndex}/${column}`);
  return found;
}

export const scroller = (container: HTMLElement): HTMLElement =>
  container.querySelector<HTMLElement>('table')!.parentElement!.parentElement!;

/**
 * Tab from the control before the table, recording each stop's tag, until `done`
 * returns true (max 20 presses). Firefox makes a scrollable region itself a Tab
 * stop, so callers must not hard-code stop counts.
 */
export async function tabUntil(
  container: HTMLElement,
  done: (active: HTMLElement) => boolean,
): Promise<string[]> {
  container.querySelector<HTMLElement>('main > button')!.focus();
  const stops: string[] = [];
  for (let index = 0; index < 20; index += 1) {
    await userEvent.tab();
    const active = document.activeElement as HTMLElement;
    stops.push(active.tagName);
    if (done(active)) break;
  }
  return stops;
}
