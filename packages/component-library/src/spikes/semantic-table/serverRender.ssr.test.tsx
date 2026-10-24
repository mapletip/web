import { MantineProvider, Pagination } from '@mantine/core';
import { gzipSync } from 'node:zlib';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { createSpikeMonsters, sortSpikeMonsters } from '../ag-grid/fixtures';
import { MonsterComparisonGrid } from '../ag-grid/MonsterComparisonGrid';

import { MonsterDataTable } from './MonsterDataTable';
import { MonsterMantineTable } from './MonsterMantineTable';
import { MonsterTanStackTable } from './MonsterTanStackTable';

/*
 * Runs in plain Node (vitest "ssr" project, no DOM). `renderToString` is
 * React's supported server API; there is no framework. These tests prove HTML
 * generation only: they cannot prove search-engine indexing, and routing for
 * static generation belongs to the future application.
 */

const sort = { field: 'exp', direction: 'desc' } as const;
const rows = sortSpikeMonsters(createSpikeMonsters(100), sort);
const noop = () => {};

const render = (node: ReactNode): string =>
  renderToString(<MantineProvider>{node}</MantineProvider>);

function inspect(html: string) {
  const firstIndex = html.indexOf(rows[0]!.name);
  const lastIndex = html.lastIndexOf(rows[99]!.name);
  return {
    gzipKb: Math.round(gzipSync(html).length / 1024),
    rawKb: Math.round(html.length / 1024),
    recordNames: rows.filter((row) => html.includes(row.name)).length,
    entityLinks: (html.match(/<a [^>]*href="\/monsters\/[^"]+"/gu) ?? [])
      .length,
    columnHeaders: (html.match(/<th[^>]*scope="col"/gu) ?? []).length,
    rowHeaders: (html.match(/<th[^>]*scope="row"/gu) ?? []).length,
    headerCells: (html.match(/<th[ >]/gu) ?? []).length,
    ariaSortDescending: (html.match(/aria-sort="descending"/gu) ?? []).length,
    ariaSortAny: (html.match(/aria-sort=/gu) ?? []).length,
    caption: /<caption/u.test(html),
    thRoleButton: (html.match(/<th[^>]*role="button"/gu) ?? []).length,
    headerButtons: (html.match(/<th[^>]*>\s*<button/gu) ?? []).length,
    firstSortedInOrder:
      rows.every(
        (row, index) =>
          index === 0 ||
          html.indexOf(row.name) > html.indexOf(rows[index - 1]!.name),
      ) &&
      firstIndex >= 0 &&
      lastIndex > firstIndex,
  };
}

describe('server rendering in plain Node', () => {
  test('runs without browser globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  const results: Record<string, ReturnType<typeof inspect>> = {};

  test('TanStack Table + Mantine Table', () => {
    const html = render(
      <MonsterTanStackTable
        rows={rows}
        caption="Monsters, sorted by EXP descending"
        sort={sort}
        onSortChange={noop}
      />,
    );
    const result = (results['tanstack'] = inspect(html));
    expect(result).toMatchObject({
      recordNames: 100,
      entityLinks: 100,
      columnHeaders: 11,
      rowHeaders: 100,
      ariaSortDescending: 1,
      ariaSortAny: 11,
      caption: true,
      thRoleButton: 0,
      headerButtons: 11,
      firstSortedInOrder: true,
    });
  });

  test('Mantine Table alone renders identical markup to the TanStack version', () => {
    const props = {
      rows,
      caption: 'Monsters, sorted by EXP descending',
      sort,
      onSortChange: noop,
    };
    const plain = render(<MonsterMantineTable {...props} />);
    const engine = render(<MonsterTanStackTable {...props} />);
    results['mantine'] = inspect(plain);
    expect(plain.replace(/\s+/gu, '')).toBe(engine.replace(/\s+/gu, ''));
  });

  test('Mantine DataTable', () => {
    const html = render(
      <MonsterDataTable
        rows={rows}
        caption="unused"
        sort={sort}
        onSortChange={noop}
      />,
    );
    const result = (results['datatable'] = inspect(html));
    // Rows, links and order are server-rendered…
    expect(result).toMatchObject({
      recordNames: 100,
      entityLinks: 100,
      firstSortedInOrder: true,
    });
    // …but the header semantics are not what we want (characterised, not endorsed).
    expect(result).toMatchObject({
      columnHeaders: 0,
      rowHeaders: 0,
      ariaSortAny: 0,
      caption: false,
      thRoleButton: 11,
      headerButtons: 0,
    });
  });

  test('AG Grid Community server-renders no records', () => {
    const html = render(
      <MonsterComparisonGrid
        rows={rows}
        sort={sort}
        onSortChange={noop}
        layout="bounded"
      />,
    );
    const result = (results['aggrid'] = inspect(html));
    expect(result).toMatchObject({
      recordNames: 0,
      entityLinks: 0,
      columnHeaders: 0,
      headerCells: 0,
    });
  });

  test('Mantine Pagination renders real, indexable anchors', () => {
    const html = render(
      <Pagination
        total={13}
        value={2}
        getItemProps={(page) => ({ component: 'a', href: `?page=${page}` })}
        getControlProps={(control) => ({
          component: 'a',
          href: `?page=${control === 'next' ? 3 : control === 'previous' ? 1 : control === 'first' ? 1 : 13}`,
        })}
      />,
    );
    expect(html).toContain('href="?page=1"');
    expect(html).toContain('href="?page=3"');
    expect(html).toContain('aria-current="page"');
    console.info(
      `[spike:ssr] pagination anchors=${(html.match(/<a /gu) ?? []).length}`,
    );
  });

  test('summary', () => {
    console.info(`[spike:ssr] ${JSON.stringify(results)}`);
    expect(Object.keys(results)).toHaveLength(4);
  });
});
