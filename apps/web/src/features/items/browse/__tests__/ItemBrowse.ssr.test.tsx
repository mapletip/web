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

import { getCategoryRows } from '../assignment';
import { ITEM_SCOPES } from '../categories';
import { getItemColumns } from '../columns';
import type { ItemRow } from '../project';
import type { ItemCategorySelection } from '../routing';

const { fixtureRows, cwCoverage, gmsCoverage } = vi.hoisted(() => {
  const rows: readonly ItemRow[] = [
    {
      sourceId: '02000000',
      name: 'Red Potion',
      itemClass: 'consume',
      types: ['potion'],
      functions: ['recovery'],
      hp: 50,
    },
    {
      sourceId: '02040000',
      name: 'Scroll for Helmet DEF 100%',
      itemClass: 'consume',
      types: ['upgrade-scroll'],
      targetLabel: 'hat',
      success: 100,
      cursed: 0,
      stats: { weaponDefense: 1 },
      tier: 'lesser',
    },
    {
      sourceId: '02070000',
      name: 'Subi Throwing-Stars',
      itemClass: 'consume',
      types: ['throwing-star'],
      attack: 15,
    },
    {
      sourceId: '04000000',
      name: 'Snail Shell',
      itemClass: 'etc',
      neededForQuestCount: 1,
      usedInRecipeCount: 1,
      questFlag: true,
    },
    {
      sourceId: '03010000',
      name: 'Relaxer',
      itemClass: 'setup',
      types: ['chair'],
      seatHp: 50,
    },
    {
      sourceId: '05000000',
      name: 'Brown Puppy',
      itemClass: 'pet',
      cashShopListingCount: 1,
      closeness: 1,
    },
    {
      sourceId: '05010000',
      name: 'Transparent Hat',
      itemClass: 'cash',
      cashShopListingCount: 1,
    },
  ];
  const relationships = (status: 'complete' | 'unsupported') => ({
    'cash-shop-listing': 'complete' as const,
    'found-in-container': 'complete' as const,
    'made-by-recipe': status,
    'monster-drop': 'partial' as const,
    'needed-for-quest': 'complete' as const,
    'quest-reward': 'complete' as const,
    'used-in-recipe': status,
  });
  return {
    fixtureRows: rows,
    cwCoverage: {
      relationships: relationships('complete'),
      scrollTier: 'complete' as const,
    },
    gmsCoverage: {
      relationships: relationships('unsupported'),
      scrollTier: 'unsupported' as const,
    },
  };
});

vi.mock('../load', () => ({
  loadItemBrowse: vi.fn().mockImplementation((buildId: string) =>
    Promise.resolve({
      rows: fixtureRows,
      coverage: buildId === 'gms-v83' ? gmsCoverage : cwCoverage,
    }),
  ),
}));

describe('Items Browse server rendering', () => {
  it('renders category breadcrumbs from nav nodes', async () => {
    const history = createMemoryHistory({
      initialEntries: [
        '/maplestory/items/etc?q=potion&page=4&pageSize=25&sort=name-desc',
      ],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    expect(html).toContain(
      'href="/maplestory/items?q=potion&amp;pageSize=25&amp;sort=name-desc"',
    );
    expect(html).not.toContain('page=4');
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('All Items');
    expect(html).toContain('ETC');
    expect(html).not.toContain('Home');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('name="robots" content="noindex,follow"');
    expect(html).not.toMatch(/<h2[^>]*>Filters<\/h2>/u);
  });

  it('marks a clean default-build category as indexable', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/maplestory/items'] }),
    });
    await router.load();

    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    expect(html).toContain('name="robots" content="index,follow"');
    expect(html).toContain(
      'rel="canonical" href="https://mapletip.com/maplestory/items"',
    );
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

  it('renders every category for both builds with unique columns and sorts', async () => {
    const categories: ItemCategorySelection[] = [];
    for (const scope of Object.values(ITEM_SCOPES)) {
      categories.push({ scope });
      for (const child of scope.children) {
        categories.push({ scope, child });
      }
    }

    for (const buildPrefix of ['', '/gms-v83']) {
      const coverage = buildPrefix === '/gms-v83' ? gmsCoverage : cwCoverage;
      for (const { scope, child } of categories) {
        const basePath = `/maplestory${buildPrefix}/items`;
        const path =
          scope.slug === 'all'
            ? basePath
            : [basePath, scope.slug, child?.slug].filter(Boolean).join('/');
        const scopedRows = getCategoryRows({
          rows: fixtureRows,
          scope,
          child,
        });
        const { columns, sortOptions } = getItemColumns({
          category: { scope, child },
          coverage,
          rows: scopedRows,
        });

        const columnKeys = columns.map(({ accessor }) => accessor);
        expect(new Set(columnKeys).size, `Duplicate columns on ${path}`).toBe(
          columnKeys.length,
        );

        const sortKeys = sortOptions.map(
          ({ field, direction }) => `${field}:${direction}`,
        );
        expect(new Set(sortKeys).size, `Duplicate sorts on ${path}`).toBe(
          sortKeys.length,
        );

        const router = createRouter({
          routeTree,
          history: createMemoryHistory({ initialEntries: [path] }),
        });
        await router.load();

        const html = renderToString(
          <MantineProvider theme={theme} forceColorScheme="dark">
            <RouterProvider router={router} />
          </MantineProvider>,
        );
        expect(html).toContain('Item categories');
      }
    }
  }, 30_000);
});
