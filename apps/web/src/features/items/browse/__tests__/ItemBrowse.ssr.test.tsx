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
  loadItemBrowse: vi.fn().mockResolvedValue({
    rows: fixtureRows,
    coverage: {
      relationships: {
        'cash-shop-listing': 'complete',
        'found-in-container': 'complete',
        'made-by-recipe': 'complete',
        'monster-drop': 'partial',
        'needed-for-quest': 'complete',
        'quest-reward': 'complete',
        'used-in-recipe': 'complete',
      },
      scrollTier: 'complete',
    },
  }),
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
    expect(html).toContain('02070000');

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
    expect(html).toContain('href="/maplestory/items/use/arrows"');
    expect(html).toContain('href="/maplestory/items/etc"');

    // 4. Scope and child counts present in SSR HTML
    expect(html).toContain('Throwing Stars');
  });

  it('renders exact-ID notice when an item ID belongs to another scope', async () => {
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

    expect(html).toContain('Item 02000000 is in');
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

    // All category child links are in SSR HTML even when on All Items
    expect(html).toContain('href="/maplestory/items/use/throwing-stars"');
    expect(html).toContain('href="/maplestory/items/use/arrows"');
    expect(html).toContain('href="/maplestory/items/use/potions"');

    // Active link has aria-current="page"
    expect(html).toContain('aria-current="page"');
  });
});
