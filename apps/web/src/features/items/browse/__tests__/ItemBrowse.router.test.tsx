import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routeTree } from '@/routeTree.gen';

import { DEFAULT_NAV_PARAMS, ITEM_NAV_TARGET } from '../navigation';
import type { ItemRow } from '../project';
import { ITEM_BROWSE_DEFAULT_SEARCH } from '../search-params';

const { fixtureRows, fixtureCoverage } = vi.hoisted(() => {
  const rows: readonly ItemRow[] = [
    {
      key: 'item:02000000',
      sourceId: '02000000',
      name: 'Red Potion',
      itemClass: 'consume',
      types: ['potion'],
      functions: ['recovery'],
      hp: 50,
    },
    {
      key: 'item:02070000',
      sourceId: '02070000',
      name: 'Subi Throwing-Stars',
      itemClass: 'consume',
      types: ['throwing-star'],
      attack: 1,
    },
    {
      key: 'item:digit-name',
      sourceId: '02000001',
      name: 'Potion 2000000',
      itemClass: 'consume',
      types: ['potion'],
      functions: ['recovery'],
      hp: 100,
    },
    {
      key: 'item:scroll:helmet',
      sourceId: '02040001',
      name: 'Scroll for Helmet DEF 60%',
      itemClass: 'consume',
      types: ['upgrade-scroll'],
      targetLabel: 'hat',
      success: 60,
      cursed: 0,
      tier: 'lesser',
      stats: { weaponDefense: 2 },
      directTargetCount: 1,
    },
    {
      key: 'item:scroll:shoes',
      sourceId: '02040002',
      name: 'Scroll for Shoes Jump 100%',
      itemClass: 'consume',
      types: ['upgrade-scroll'],
      targetLabel: 'shoes',
      success: 100,
      tier: 'intermediate',
      stats: { jump: 2 },
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
  const coverage = {
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
  } as const;
  return { fixtureRows: rows, fixtureCoverage: coverage };
});

vi.mock('../load', () => ({
  loadItemBrowse: vi
    .fn()
    .mockResolvedValue({ rows: fixtureRows, coverage: fixtureCoverage }),
}));

describe('Items Browse router state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function loadRouter(initialEntry: string) {
    const history = createMemoryHistory({ initialEntries: [initialEntry] });
    const router = createRouter({ routeTree, history });
    await router.load();
    return router;
  }

  function renderRouter(router: Awaited<ReturnType<typeof loadRouter>>) {
    return render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );
  }

  async function mountRoute(initialEntry: string) {
    const router = await loadRouter(initialEntry);
    return { router, ...renderRouter(router), user: userEvent.setup() };
  }

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

  it('matches exact numeric item IDs without displaying them', async () => {
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

    expect(screen.getByText('Red Potion')).toBeInTheDocument();
    expect(screen.getByText('Potion 2000000')).toBeInTheDocument();
    expect(screen.getByRole('table')).not.toHaveTextContent('02000000');
  });

  it('matches partial numeric queries in names, not item IDs', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items?q=200'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    expect(screen.getByText('Potion 2000000')).toBeInTheDocument();
    expect(screen.queryByText('Red Potion')).not.toBeInTheDocument();
    expect(screen.getByRole('table')).not.toHaveTextContent('02000000');
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

  it('round-trips a multi-select facet through a JSON URL and reload', async () => {
    const { router, user, unmount } = await mountRoute(
      '/maplestory/items/use?page=2&pageSize=25',
    );

    await user.click(screen.getByRole('checkbox', { name: /^Potion/ }));
    await waitFor(() => {
      const url = new URL(router.state.location.href, 'http://localhost');
      expect(url.searchParams.get('types')).toBe('["potion"]');
      expect(url.searchParams.has('page')).toBe(false);
    });

    const generatedUrl = router.state.location.href;
    const reloadedRouter = await loadRouter(generatedUrl);
    unmount();
    renderRouter(reloadedRouter);

    expect(screen.getByRole('checkbox', { name: /^Potion/ })).toBeChecked();
    expect(reloadedRouter.state.matches.at(-1)?.search).toMatchObject({
      types: ['potion'],
      pageSize: 25,
    });
  });

  it('round-trips a bucket selection through a JSON URL and reload', async () => {
    const { router, user, unmount } = await mountRoute(
      '/maplestory/items/use/recovery',
    );

    await user.click(screen.getByRole('checkbox', { name: /^50/ }));
    await waitFor(() => {
      const url = new URL(router.state.location.href, 'http://localhost');
      expect(url.searchParams.get('hp')).toBe('["50"]');
    });

    const generatedUrl = router.state.location.href;
    const reloadedRouter = await loadRouter(generatedUrl);
    unmount();
    renderRouter(reloadedRouter);

    expect(screen.getByRole('checkbox', { name: /^50/ })).toBeChecked();
  });

  it('round-trips a custom range through a JSON URL and reload', async () => {
    const { router, user, unmount } = await mountRoute(
      '/maplestory/items/use/recovery',
    );

    await user.click(screen.getByRole('checkbox', { name: 'Custom' }));
    await user.type(screen.getByRole('textbox', { name: 'HP to' }), '100');
    await user.type(screen.getByRole('textbox', { name: 'HP from' }), '60');
    await waitFor(() => {
      const url = new URL(router.state.location.href, 'http://localhost');
      expect(url.searchParams.get('hp')).toBe('{"min":60,"max":100}');
    });

    const generatedUrl = router.state.location.href;
    const reloadedRouter = await loadRouter(generatedUrl);
    unmount();
    renderRouter(reloadedRouter);

    expect(screen.getByRole('textbox', { name: 'HP from' })).toHaveValue('60');
    expect(screen.getByRole('textbox', { name: 'HP to' })).toHaveValue('100');
  });

  it('shows scroll facets on the real scroll child route', async () => {
    await mountRoute('/maplestory/items/use/scrolls');

    expect(screen.getAllByText('Equipment type').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Stat').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Success rate').length).toBeGreaterThan(0);
  });

  it('drops invalid facet values and ignores valid values absent from the category', async () => {
    const router = await loadRouter(
      '/maplestory/items/use?types=%5B%22not-an-option%22%5D&empty=%5B%5D&hp=%7B%22min%22%3A100%2C%22max%22%3A50%7D',
    );
    renderRouter(router);
    expect(
      screen.getByRole('button', { name: /Filters, 0 active/ }),
    ).toBeInTheDocument();
  });

  it('drops page and facet params from category breadcrumb links', async () => {
    const { router, user } = await mountRoute(
      '/maplestory/items/use?q=Extra&page=2&pageSize=25&sort=name-desc&types=%5B%22not-an-option%22%5D',
    );
    const breadcrumb = screen.getByLabelText('Breadcrumb');
    const allItems = within(breadcrumb).getByRole('link', {
      name: 'All Items',
    });
    await user.click(allItems);

    await waitFor(() => {
      expect(
        new URL(router.state.location.href, 'http://localhost').pathname,
      ).toBe('/maplestory/items');
    });
    const url = new URL(router.state.location.href, 'http://localhost');
    expect(url.searchParams.get('q')).toBe('Extra');
    expect(url.searchParams.get('pageSize')).toBe('25');
    expect(url.searchParams.get('sort')).toBe('name-desc');
    expect(url.searchParams.has('page')).toBe(false);
    expect(url.searchParams.has('types')).toBe(false);
  });
});
