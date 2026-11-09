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

import { getCategoryRows, ITEM_SCOPES } from '../categories';
import { getItemColumns } from '../columns';
import type { ItemRow } from '../project';

const { fixtureRows, cwCoverage, gmsCoverage } = vi.hoisted(() => {
  const rows: readonly ItemRow[] = [
    {
      key: '1',
      sourceId: '02000000',
      name: 'Red Potion',
      itemClass: 'consume',
      types: ['potion'],
      functions: ['recovery'],
      hp: 50,
    },
    {
      key: '2',
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
      key: '3',
      sourceId: '02070000',
      name: 'Subi Throwing-Stars',
      itemClass: 'consume',
      types: ['throwing-star'],
      attack: 15,
    },
    {
      key: '4',
      sourceId: '04000000',
      name: 'Snail Shell',
      itemClass: 'etc',
      neededForQuestCount: 1,
      usedInRecipeCount: 1,
      questFlag: true,
    },
    {
      key: '5',
      sourceId: '03010000',
      name: 'Relaxer',
      itemClass: 'setup',
      types: ['chair'],
      seatHp: 50,
    },
    {
      key: '6',
      sourceId: '05000000',
      name: 'Brown Puppy',
      itemClass: 'pet',
      cashShopListingCount: 1,
      closeness: 1,
    },
    {
      key: '7',
      sourceId: '05010000',
      name: 'Transparent Hat',
      itemClass: 'cash',
      cashShopListingCount: 1,
    },
  ];
  const rels = (r: 'complete' | 'unsupported') => ({
    'cash-shop-listing': 'complete' as const,
    'found-in-container': 'complete' as const,
    'made-by-recipe': r,
    'monster-drop': 'partial' as const,
    'needed-for-quest': 'complete' as const,
    'quest-reward': 'complete' as const,
    'used-in-recipe': r,
  });
  return {
    fixtureRows: rows,
    cwCoverage: {
      relationships: rels('complete'),
      scrollTier: 'complete' as const,
    },
    gmsCoverage: {
      relationships: rels('unsupported'),
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

describe('ItemBrowse server rendering', () => {
  it('renders filtered rows and real links for a filtered category URL', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items/use/throwing-stars'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    // Filtered row matches
    expect(html).toContain('Subi Throwing-Stars');
    expect(html).not.toContain('02070000');

    // Items outside this child category are not rendered in the results
    expect(html).not.toContain('Red Potion');
    expect(html).not.toContain('Snail Shell');

    // Real links in SSR HTML
    // 1. Breadcrumbs
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/maplestory/items"');
    expect(html).toContain('href="/maplestory/items/use"');

    // 2. Build switch
    expect(html).toContain(
      'href="/maplestory/gms-v83/items/use/throwing-stars"',
    );

    // 3. Rail and mobile links
    expect(html).toContain('href="/maplestory/items/use/throwing-stars"');
    expect(html).not.toContain('href="/maplestory/items/use/arrows"');
    expect(html).toContain('href="/maplestory/items/etc"');

    // 4. Scope and child counts present in SSR HTML
    expect(html).toContain('Throwing Stars');
  });

  it('keeps exact-ID search results within the current scope without a notice', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items/etc?q=02000000'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    expect(html).not.toContain('Item 02000000 is in');
    expect(html).toContain('href="/maplestory/items/use?q=02000000"');
  });

  it('renders rail landmark and all category links in SSR HTML on All Items page', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    // Rail landmark with accessible name
    expect(html).toContain('aria-label="Item categories"');

    // Populated category child links are in SSR HTML even when on All Items
    expect(html).toContain('href="/maplestory/items/use/throwing-stars"');
    expect(html).not.toContain('href="/maplestory/items/use/arrows"');
    expect(html).toContain('href="/maplestory/items/use/potions"');

    // Active link has aria-current="page"
    expect(html).toContain('aria-current="page"');
  });

  it('renders every category across CW-like and GMS-like coverage without throwing, with unique sort options and column keys', async () => {
    const categories = Object.values(ITEM_SCOPES).flatMap((scope) =>
      scope.slug === 'all'
        ? [{ scope, child: undefined }]
        : [
            { scope, child: undefined },
            ...scope.children.map((child) => ({ scope, child })),
          ],
    );

    for (const buildPrefix of ['', '/gms-v83']) {
      const coverage = buildPrefix === '/gms-v83' ? gmsCoverage : cwCoverage;
      for (const { scope, child } of categories) {
        const basePath = `/maplestory${buildPrefix}/items`;
        const path =
          scope.slug === 'all'
            ? basePath
            : [basePath, scope.slug, child?.slug].filter(Boolean).join('/');

        const scopedRows = getCategoryRows(fixtureRows, scope, child);
        const { columns, sortOptions } = getItemColumns(
          { scope, child },
          coverage,
          scopedRows,
        );

        const colKeys = columns.map((c) => c.accessor);
        expect(new Set(colKeys).size, `Duplicate column keys on ${path}`).toBe(
          colKeys.length,
        );

        const sortValues = sortOptions.map((o) => `${o.field}:${o.direction}`);
        expect(
          new Set(sortValues).size,
          `Duplicate sort options on ${path}`,
        ).toBe(sortValues.length);

        const history = createMemoryHistory({ initialEntries: [path] });
        const router = createRouter({ routeTree, history });
        await router.load();

        const html = renderToString(
          <MantineProvider theme={theme} forceColorScheme="dark">
            <RouterProvider router={router} />
          </MantineProvider>,
        );

        expect(html).toContain('Item categories');
      }
    }
  }, 15_000);
});
