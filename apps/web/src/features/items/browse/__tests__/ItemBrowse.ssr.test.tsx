import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { routeTree } from '@/routeTree.gen';

import type { ItemRow } from '../project';

const { fixtureRows } = vi.hoisted(() => {
  const rows: readonly ItemRow[] = [
    {
      key: 'item:02000000',
      sourceId: '02000000',
      name: 'Red Potion',
      itemClass: 'consume',
      types: ['potion'],
      functions: ['recovery'],
    },
    {
      key: 'item:02070000',
      sourceId: '02070000',
      name: 'Subi Throwing-Stars',
      itemClass: 'consume',
      types: ['throwing-star'],
    },
    {
      key: 'item:04000000',
      sourceId: '04000000',
      name: 'Snail Shell',
      itemClass: 'etc',
    },
  ];
  return { fixtureRows: rows };
});

vi.mock('../load', () => ({
  loadItemBrowse: vi.fn().mockResolvedValue({ rows: fixtureRows }),
}));

describe('Items Browse server rendering', () => {
  it('renders category breadcrumbs, build links and exact-ID links from nav nodes', async () => {
    const history = createMemoryHistory({
      initialEntries: [
        '/maplestory/items/etc?q=02000000&page=4&pageSize=25&sort=sourceId-desc',
      ],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    expect(html).toContain('Item 02000000 is in');
    expect(html).toContain(
      'href="/maplestory/items?q=02000000&amp;pageSize=25&amp;sort=sourceId-desc"',
    );
    expect(html).toContain(
      'href="/maplestory/items/use?q=02000000&amp;pageSize=25&amp;sort=sourceId-desc"',
    );
    expect(html).toContain(
      'href="/maplestory/gms-v83/items/etc?q=02000000&amp;pageSize=25&amp;sort=sourceId-desc"',
    );
    expect(html).not.toContain('page=4');
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('All Items');
    expect(html).toContain('ETC');
    expect(html).not.toContain('Home');
    expect(html).toContain('aria-label="MapleStory game build"');
    expect(html).toContain('aria-current="page"');
  });

  it('shows the custom empty state only for a category with no rows', async () => {
    const emptyCategoryHistory = createMemoryHistory({
      initialEntries: ['/maplestory/items/use/bullets'],
    });
    const emptyCategoryRouter = createRouter({
      routeTree,
      history: emptyCategoryHistory,
    });
    await emptyCategoryRouter.load();

    const emptyCategoryHtml = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={emptyCategoryRouter} />
      </MantineProvider>,
    );
    expect(emptyCategoryHtml.replaceAll('<!-- -->', '')).toContain(
      'Classic World has no Bullets.',
    );

    const noSearchResultsHistory = createMemoryHistory({
      initialEntries: ['/maplestory/items?q=missing'],
    });
    const noSearchResultsRouter = createRouter({
      routeTree,
      history: noSearchResultsHistory,
    });
    await noSearchResultsRouter.load();

    const noSearchResultsHtml = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={noSearchResultsRouter} />
      </MantineProvider>,
    );
    expect(noSearchResultsHtml).toContain('No Classic World items match');
    expect(noSearchResultsHtml).not.toContain(
      'Classic World has no All Items.',
    );
  });
});
