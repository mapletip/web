import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routeTree } from '@/routeTree.gen';

import { DEFAULT_NAV_PARAMS, ITEM_NAV_TARGET } from '../navigation';
import type { ItemRow } from '../project';
import { ITEM_BROWSE_DEFAULT_SEARCH } from '../search-params';

const { fixtureRows } = vi.hoisted(() => {
  const rows: readonly ItemRow[] = [
    {
      key: 'item:02000000',
      sourceId: '02000000',
      name: 'Red Potion',
      itemClass: 'consume',
    },
    {
      key: 'item:02070000',
      sourceId: '02070000',
      name: 'Subi Throwing-Stars',
      itemClass: 'consume',
    },
    {
      key: 'item:digit-name',
      sourceId: '02000001',
      name: 'Potion 2000000',
      itemClass: 'consume',
    },
    {
      key: 'item:04000000',
      sourceId: '04000000',
      name: 'Snail Shell',
      itemClass: 'etc',
    },
    ...Array.from({ length: 50 }, (_, index): ItemRow => ({
      key: `item:extra:${index}`,
      sourceId: String(6000000 + index),
      name: `Extra Item ${index + 1}`,
      itemClass: 'consume',
    })),
  ];
  return { fixtureRows: rows };
});

vi.mock('../load', () => ({
  loadItemBrowse: vi.fn().mockResolvedValue({ rows: fixtureRows }),
}));

describe('Items Browse router state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pagination as real links with serializable search state', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items?pageSize=25'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    const pageTwo = screen.getByRole('link', { name: 'Page 2' });
    const href = pageTwo.getAttribute('href');
    expect(href).not.toBeNull();
    const target = new URL(href ?? '', 'http://localhost');
    expect(target.pathname).toBe('/maplestory/items');
    expect(target.searchParams.get('page')).toBe('2');
    expect(target.searchParams.get('pageSize')).toBe('25');
    expect(target.searchParams.has('q')).toBe(false);
    expect(target.searchParams.has('sort')).toBe(false);
  });

  it('strips default search params through the route middleware', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    await router.navigate({
      to: ITEM_NAV_TARGET,
      params: DEFAULT_NAV_PARAMS,
      search: ITEM_BROWSE_DEFAULT_SEARCH,
    });

    expect(router.state.location.href).toBe('/maplestory/items');
  });

  it('searches numeric substrings in item names', async () => {
    const user = userEvent.setup();
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items?q=2000000'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    const search = screen.getByRole('textbox', {
      name: 'Search Classic World items',
    });
    expect(screen.getByText('Potion 2000000')).toBeInTheDocument();
    expect(screen.queryByText('Red Potion')).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'Potion');
    await waitFor(() => {
      expect(screen.getByText('Red Potion')).toBeInTheDocument();
    });
  });

  it('keeps numeric q values from shared URLs and reloads the generated URL', async () => {
    const user = userEvent.setup();
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items/use?q=2000000'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    const search = screen.getByRole('textbox', {
      name: 'Search Classic World items',
    });
    expect(search).toHaveValue('2000000');
    const loadedQuery = new URL(
      router.state.location.href,
      'http://localhost',
    ).searchParams.get('q');
    expect(['2000000', '"2000000"']).toContain(loadedQuery);
    expect(screen.getByText('Potion 2000000')).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, '2000000');
    await waitFor(() => {
      expect(
        new URL(
          router.state.location.href,
          'http://localhost',
        ).searchParams.has('q'),
      ).toBe(true);
    });
    const generatedUrl = router.state.location.href;
    const reloadHistory = createMemoryHistory({
      initialEntries: [generatedUrl],
    });
    const reloadRouter = createRouter({ routeTree, history: reloadHistory });
    await reloadRouter.load();

    const generatedQuery = new URL(
      generatedUrl,
      'http://localhost',
    ).searchParams.get('q');
    expect(['2000000', '"2000000"']).toContain(generatedQuery);
    expect(reloadRouter.state.matches.at(-1)?.search).toMatchObject({
      q: '2000000',
    });
  });

  it('replaces debounced search and pushes pagination', async () => {
    const user = userEvent.setup();
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items?pageSize=25'],
    });
    const replace = vi.spyOn(history, 'replace');
    const push = vi.spyOn(history, 'push');
    const router = createRouter({ routeTree, history });
    await router.load();

    render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    const search = screen.getByRole('textbox', {
      name: 'Search Classic World items',
    });
    await user.type(search, 'Red Potion');
    await waitFor(() => {
      expect(
        new URL(
          router.state.location.href,
          'http://localhost',
        ).searchParams.get('q'),
      ).toBe('Red Potion');
    });
    expect(replace).toHaveBeenCalled();

    await user.clear(search);
    await waitFor(() => {
      expect(
        new URL(
          router.state.location.href,
          'http://localhost',
        ).searchParams.has('q'),
      ).toBe(false);
    });
    push.mockClear();
    await user.click(screen.getByRole('link', { name: 'Page 2' }));
    await waitFor(() => {
      expect(router.state.location.href).toContain('page=2');
    });
    expect(push).toHaveBeenCalled();
  });

  it('replaces a page that FacetedBrowser clamps to the last available page', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items?page=99&pageSize=25'],
    });
    const replace = vi.spyOn(history, 'replace');
    const router = createRouter({ routeTree, history });
    await router.load();

    render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(
        new URL(
          router.state.location.href,
          'http://localhost',
        ).searchParams.get('page'),
      ).toBe('3');
    });
    expect(replace).toHaveBeenCalled();
  });
});
