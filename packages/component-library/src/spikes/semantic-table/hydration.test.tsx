import { MantineProvider } from '@mantine/core';
import { useEffect, type ComponentType, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import '../../styles.css';
import { theme } from '../../theme';
import { createSpikeMonsters, sortSpikeMonsters } from '../ag-grid/fixtures';
import { MonsterComparisonGrid } from '../ag-grid/MonsterComparisonGrid';

import { MonsterDataTable } from './MonsterDataTable';
import { MonsterMantineTable } from './MonsterMantineTable';
import { MonsterTanStackTable } from './MonsterTanStackTable';
import type { MonsterTableProps } from './types';

/*
 * Server HTML is produced with React's renderToString (in the browser bundle
 * here; the plain-Node equivalent is in serverRender.ssr.test.tsx), inserted
 * as static markup, measured, then hydrated with hydrateRoot. This proves
 * hydration without recoverable errors and the layout delta. It is not an
 * application-framework SSG test.
 */

const sort = { field: 'exp', direction: 'desc' } as const;
const rows = sortSpikeMonsters(createSpikeMonsters(100), sort);
const noop = () => {};

function Mark({ onMount }: { readonly onMount: () => void }): null {
  useEffect(onMount, [onMount]);
  return null;
}

function tree(
  Table: ComponentType<MonsterTableProps>,
  onMount: () => void,
): ReactElement {
  return (
    <MantineProvider theme={theme}>
      <div style={{ padding: 12, width: 1100 }}>
        <Table
          rows={rows}
          caption="Monsters, sorted by EXP descending"
          sort={sort}
          onSortChange={noop}
        />
      </div>
      <Mark onMount={onMount} />
    </MantineProvider>
  );
}

const snapshot = (host: HTMLElement) => {
  const rect = (element: Element | null) => {
    const box = element?.getBoundingClientRect();
    return box
      ? {
          top: Math.round(box.top),
          height: Math.round(box.height),
          width: Math.round(box.width),
        }
      : null;
  };
  return {
    table: rect(host.querySelector('table')),
    firstRow: rect(host.querySelector('tbody tr')),
    host: rect(host),
    rowCount: host.querySelectorAll('tbody tr').length,
  };
};

let host: HTMLElement;
beforeEach(async () => {
  await page.viewport(1440, 900);
  // What Mantine's SSR setup (`<ColorSchemeScript />` / `mantineHtmlProps`) puts on <html>.
  document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  host = document.createElement('div');
  document.body.append(host);
});
afterEach(() => host.remove());

async function hydrate(Table: ComponentType<MonsterTableProps>) {
  const html = renderToString(tree(Table, noop));
  host.innerHTML = html;
  const before = snapshot(host);
  const errors: unknown[] = [];
  const consoleErrors: unknown[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => consoleErrors.push(args);
  let mounted = 0;
  const start = performance.now();
  const root = hydrateRoot(
    host,
    tree(Table, () => {
      mounted = performance.now();
    }),
    {
      onRecoverableError: (error) => errors.push(error),
    },
  );
  await vi.waitFor(() => expect(mounted).toBeGreaterThan(0), { timeout: 5000 });
  await new Promise((resolve) => setTimeout(resolve, 300));
  console.error = original;
  const after = snapshot(host);
  root.unmount();
  return { before, after, errors, consoleErrors, hydrateMs: mounted - start };
}

describe('hydration of server-rendered HTML', () => {
  test.each([
    ['Mantine Table alone', MonsterMantineTable],
    ['Mantine Table + TanStack Table', MonsterTanStackTable],
    ['Mantine DataTable', MonsterDataTable],
  ] as const)(
    '%s hydrates without errors and without layout change',
    async (name, Table) => {
      const { before, after, errors, consoleErrors, hydrateMs } =
        await hydrate(Table);
      console.info(
        `[spike] hydrate ${name}: ${hydrateMs.toFixed(0)}ms, rows=${after.rowCount}, table ${JSON.stringify(before.table)} -> ${JSON.stringify(after.table)}`,
      );
      expect(errors).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(before.rowCount).toBe(100);
      expect(after).toEqual(before);
    },
  );

  test('AG Grid: server HTML is an empty shell, so the grid appears after hydration (large layout change)', async () => {
    const Grid = ({ rows: data, sort: current }: MonsterTableProps) => (
      <MonsterComparisonGrid
        rows={data}
        sort={current}
        onSortChange={noop}
        layout="bounded"
      />
    );
    const { before, after, errors } = await hydrate(Grid);
    console.info(
      `[spike] hydrate AG Grid: server rows=${before.rowCount}, host ${JSON.stringify(before.host)} -> ${JSON.stringify(after.host)}, recoverable errors=${errors.length}`,
    );
    expect(before.rowCount).toBe(0);
    expect(after.host!.height).toBeGreaterThan(
      (before.host?.height ?? 0) + 200,
    );
  });

  test('without the server-rendered color-scheme attribute the row borders pop in (Mantine SSR requirement)', async () => {
    const html = renderToString(tree(MonsterMantineTable, noop));
    document.documentElement.removeAttribute('data-mantine-color-scheme');
    host.innerHTML = html;
    const before = snapshot(host);
    const root = hydrateRoot(host, tree(MonsterMantineTable, noop));
    await vi.waitFor(() =>
      expect(
        document.documentElement.getAttribute('data-mantine-color-scheme'),
      ).not.toBeNull(),
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    const after = snapshot(host);
    root.unmount();
    console.info(
      `[spike] hydrate without color-scheme attribute: table height ${before.table?.height} -> ${after.table?.height}`,
    );
    expect(after.table!.height).toBeGreaterThan(before.table!.height);
  });
});
