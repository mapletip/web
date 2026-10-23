import type { ComponentType } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { sortSpikeMonsters } from '../ag-grid/fixtures';
import { MonsterComparisonGrid } from '../ag-grid/MonsterComparisonGrid';

import { MonsterDataTable } from './MonsterDataTable';
import { MonsterMantineTable } from './MonsterMantineTable';
import { MonsterTanStackTable } from './MonsterTanStackTable';
import { Harness, records } from './testing';
import type { MonsterTableProps } from './types';

/*
 * Same fixtures, same viewport, same harness for every candidate. Numbers are
 * recorded for the decision record; assertions are deliberately generous
 * (regression guards, not targets). Remote-browser harness overhead is included.
 */

const AgGrid: ComponentType<MonsterTableProps> = ({
  rows,
  sort,
  onSortChange,
}) => (
  <MonsterComparisonGrid
    rows={rows}
    sort={sort}
    onSortChange={onSortChange as never}
    layout="bounded"
  />
);

interface Candidate {
  readonly name: string;
  readonly Table: ComponentType<MonsterTableProps>;
  readonly firstRow: (container: HTMLElement) => string;
  readonly ready: (container: HTMLElement) => boolean;
  readonly header: (container: HTMLElement) => Element | null;
}

const tableFirstRow = (container: HTMLElement) =>
  container.querySelector('tbody tr')?.textContent ?? '';

const candidates: Candidate[] = [
  {
    name: 'Mantine Table + TanStack',
    Table: MonsterTanStackTable,
    firstRow: tableFirstRow,
    ready: (c) => c.querySelectorAll('tbody tr').length === 100,
    header: (c) => c.querySelector('thead th button[title="HP"]'),
  },
  {
    name: 'Mantine Table alone',
    Table: MonsterMantineTable,
    firstRow: tableFirstRow,
    ready: (c) => c.querySelectorAll('tbody tr').length === 100,
    header: (c) => c.querySelector('thead th button[title="HP"]'),
  },
  {
    name: 'Mantine DataTable',
    Table: MonsterDataTable,
    firstRow: tableFirstRow,
    ready: (c) => c.querySelectorAll('tbody tr').length === 100,
    header: (c) => c.querySelector('thead th[data-accessor="hp"]'),
  },
  {
    name: 'AG Grid Community',
    Table: AgGrid,
    firstRow: (c) =>
      c.querySelector('[role="row"][row-index="0"]')?.textContent ?? '',
    ready: (c) =>
      c.querySelector('[role="row"][row-index="0"] [col-id="name"]') !== null,
    header: (c) =>
      c.querySelector(
        '[role="columnheader"][col-id="hp"] .ag-header-cell-label',
      ),
  },
];

const frame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;

beforeEach(async () => {
  await page.viewport(1440, 900);
  document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
});

describe('performance under identical conditions (100 rows × 11 columns, 1440×900)', () => {
  test.each(candidates)('$name', async (candidate) => {
    const mounts: number[] = [];
    const sorts: number[] = [];
    let domNodes = 0;
    const expected = sortSpikeMonsters(records, {
      field: 'hp',
      direction: 'desc',
    })[0]!.name;

    for (let run = 0; run < 7; run += 1) {
      let sortedAt = 0;
      const start = performance.now();
      const screen = await render(
        <Harness
          Table={candidate.Table}
          onSortChange={() => {
            sortedAt = performance.now();
          }}
        />,
      );
      await vi.waitFor(
        () => expect(candidate.ready(screen.container)).toBe(true),
        { timeout: 5000, interval: 1 },
      );
      await frame();
      mounts.push(performance.now() - start);
      domNodes = screen.container.querySelectorAll('*').length;

      candidate
        .header(screen.container)!
        .dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true }),
        );
      await vi.waitFor(
        () => expect(candidate.firstRow(screen.container)).toContain(expected),
        { timeout: 5000, interval: 1 },
      );
      await frame();
      if (sortedAt > 0) sorts.push(performance.now() - sortedAt);
      await screen.unmount();
    }

    console.info(
      `[spike:perf] ${candidate.name}: mount→painted first=${mounts[0]!.toFixed(0)}ms median=${median(mounts).toFixed(0)}ms; sort event→painted median=${sorts.length ? median(sorts).toFixed(0) : 'n/a'}ms (n=${sorts.length}); DOM nodes=${domNodes}`,
    );
    expect(median(mounts)).toBeLessThan(3000);
  });
});
