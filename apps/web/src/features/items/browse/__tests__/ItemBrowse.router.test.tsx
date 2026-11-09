import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      attack: 15,
    },
    {
      key: 'item:02070001',
      sourceId: '02070001',
      name: 'Mokbi Throwing-Stars',
      itemClass: 'consume',
      types: ['throwing-star'],
      attack: 19,
      monsterDropCount: 1,
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

describe('ItemBrowse real router interactions', () => {
  it('serializes array search params as comma strings without JSON brackets (%5B)', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    await router.navigate({
      to: '/maplestory/{-$buildId}/items/{-$scope}/{-$child}',
      search: { types: ['potion', 'food-buff'] },
    });

    const href = router.state.location.href;
    expect(href).not.toContain('%5B');
    expect(href).not.toContain('%22');
    expect(href).toMatch(/types=potion(%2C|,)food-buff/);
  });

  it('rail scope rows with children are real links that navigate when clicked', async () => {
    const user = userEvent.setup();
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    const railNav = screen.getByRole('navigation', {
      name: 'Item categories',
    });
    const useLink = within(railNav).getByRole('link', { name: /^Use\b/ });
    expect(useLink).toHaveAttribute('href', '/maplestory/items/use');

    await user.click(useLink);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/maplestory/items/use');
    });
  });

  it('marks exactly one item as aria-current="page" in rail and mobile on /items/use', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items/use'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    const railNav = screen.getByRole('navigation', {
      name: 'Item categories',
    });
    const railActiveLinks = within(railNav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');

    expect(railActiveLinks).toHaveLength(1);
    expect(railActiveLinks[0]).toHaveAccessibleName(/^Use\b/);

    const allItemsRail = within(railNav).getByRole('link', {
      name: /^All Items\b/,
    });
    expect(allItemsRail).not.toHaveAttribute('aria-current');

    const mobileNav = screen.getByRole('navigation', {
      name: 'Inventory scopes',
    });
    const mobileActiveLinks = within(mobileNav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');

    expect(mobileActiveLinks).toHaveLength(1);
    expect(mobileActiveLinks[0]).toHaveAccessibleName(/^Use\b/);

    const allItemsMobile = within(mobileNav).getByRole('link', {
      name: /^All Items\b/,
    });
    expect(allItemsMobile).not.toHaveAttribute('aria-current');
  });

  it('keeps populated child links visible on scope and child pages', async () => {
    const scopeHistory = createMemoryHistory({
      initialEntries: ['/maplestory/items/use'],
    });
    const scopeRouter = createRouter({ routeTree, history: scopeHistory });
    await scopeRouter.load();

    const { unmount } = render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={scopeRouter} />
      </MantineProvider>,
    );

    const railScope = screen.getByRole('navigation', {
      name: 'Item categories',
    });
    const potionLink = within(railScope).getByRole('link', {
      name: /^Potions\b/,
    });
    const throwingStarsLink = within(railScope).getByRole('link', {
      name: /^Throwing Stars\b/,
    });
    expect(potionLink).toBeVisible();
    expect(throwingStarsLink).toBeVisible();

    unmount();

    const childHistory = createMemoryHistory({
      initialEntries: ['/maplestory/items/use/potions'],
    });
    const childRouter = createRouter({ routeTree, history: childHistory });
    await childRouter.load();

    render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RouterProvider router={childRouter} />
      </MantineProvider>,
    );

    const railChild = screen.getByRole('navigation', {
      name: 'Item categories',
    });
    const activeChildLink = within(railChild).getByRole('link', {
      name: /^Potions\b/,
    });
    const siblingChildLink = railChild.querySelector(
      'a[href="/maplestory/items/use/throwing-stars"]',
    );

    expect(activeChildLink).toBeVisible();
    expect(siblingChildLink).not.toBeNull();
    expect(siblingChildLink).toBeVisible();
  });

  it('round-trips one multi-select and one open-ended range facet through the real router', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items/use/throwing-stars?attackMin=17'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    expect(router.state.location.search).toEqual({ attackMin: 17 });

    await router.navigate({
      to: '/maplestory/{-$buildId}/items/{-$scope}/{-$child}',
      search: {
        attackMin: 17,
        rel: ['monster-drop'],
      },
    });

    const href = router.state.location.href;
    expect(href).toContain('attackMin=17');
    expect(href).toContain('rel=monster-drop');

    const searchState = router.state.location.search as Record<string, unknown>;
    expect(searchState['attackMin']).toBe(17);
    expect(searchState['rel']).toBe('monster-drop');
  });

  it('preserves single numeric URL values for both multi-select and bucket through real router', async () => {
    const history = createMemoryHistory({
      initialEntries: [
        '/maplestory/items/use/upgrade-scrolls?scrollSuccess=100&hpPercent=35',
      ],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const leafMatch = router.state.matches.find((m) =>
      m.routeId.includes('$child'),
    );
    expect(leafMatch?.search).toEqual(
      expect.objectContaining({
        scrollSuccess: 100,
        hpPercent: 35,
      }),
    );

    await router.navigate({
      to: '/maplestory/{-$buildId}/items/{-$scope}/{-$child}',
      search: {
        scrollSuccess: 100,
        hpPercent: 35,
      },
    });

    const href = router.state.location.href;
    expect(href).toContain('scrollSuccess=100');
    expect(href).toContain('hpPercent=35');
    expect(href).not.toContain('%22');
  });
});
