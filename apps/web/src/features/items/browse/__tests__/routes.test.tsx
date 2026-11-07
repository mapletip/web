import { MantineProvider } from '@mantine/core';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routeTree } from '@/routeTree.gen';

import { ITEM_SCOPES } from '../categories';
import { loadItemBrowse } from '../load';
import { parseItemRouteParams } from '../routing';

vi.mock('../load', () => ({
  loadItemBrowse: vi.fn().mockResolvedValue({ rows: [], coverage: {} }),
}));

describe('Items Browse route integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validTestCases = [
    {
      url: '/maplestory/items',
      expectedBuildId: 'cw-launch',
      expectedScope: ITEM_SCOPES.all,
      expectedChildSlug: undefined,
    },
    {
      url: '/maplestory/items/use',
      expectedBuildId: 'cw-launch',
      expectedScope: ITEM_SCOPES.use,
      expectedChildSlug: undefined,
    },
    {
      url: '/maplestory/items/use/upgrade-scrolls',
      expectedBuildId: 'cw-launch',
      expectedScope: ITEM_SCOPES.use,
      expectedChildSlug: 'upgrade-scrolls',
    },
    {
      url: '/maplestory/gms-v83/items',
      expectedBuildId: 'gms-v83',
      expectedScope: ITEM_SCOPES.all,
      expectedChildSlug: undefined,
    },
    {
      url: '/maplestory/gms-v83/items/etc/quest-items',
      expectedBuildId: 'gms-v83',
      expectedScope: ITEM_SCOPES.etc,
      expectedChildSlug: 'quest-items',
    },
  ];

  for (const {
    url,
    expectedBuildId,
    expectedScope,
    expectedChildSlug,
  } of validTestCases) {
    it(`matches items leaf and loads data for ${url}`, async () => {
      const history = createMemoryHistory({ initialEntries: [url] });
      const router = createRouter({ routeTree, history });
      await router.load();

      const leafMatch = router.state.matches.find(
        (m) =>
          m.routeId === '/maplestory/{-$buildId}/items/{-$scope}/{-$child}',
      );
      expect(leafMatch).toBeDefined();

      const { buildId, category } = parseItemRouteParams(
        leafMatch?.params ?? {},
      );
      expect(buildId).toBe(expectedBuildId);
      expect(category.scope).toBe(expectedScope);
      expect(category.child?.slug).toBe(expectedChildSlug);

      expect(loadItemBrowse).toHaveBeenCalledTimes(1);
      expect(loadItemBrowse).toHaveBeenCalledWith(
        expectedBuildId,
        expect.anything(),
      );
    });

    it(`renders rail category links with correct hrefs and a single aria-current for ${url}`, async () => {
      const history = createMemoryHistory({ initialEntries: [url] });
      const router = createRouter({ routeTree, history });
      await router.load();

      const { container } = render(
        <MantineProvider>
          <RouterProvider router={router} />
        </MantineProvider>,
      );

      const railNav = container.querySelector(
        'nav[aria-label="Item categories"]',
      );
      expect(railNav).not.toBeNull();

      const links = railNav?.querySelectorAll('a') ?? [];
      expect(links.length).toBeGreaterThan(0);

      // Verify scope links point to correct hrefs
      const buildPrefix =
        expectedBuildId === 'cw-launch' ? '' : `/${expectedBuildId}`;
      const allLink = Array.from(links).find(
        (l) => l.getAttribute('href') === `/maplestory${buildPrefix}/items`,
      );
      expect(allLink).toBeDefined();

      const useLink = Array.from(links).find(
        (l) => l.getAttribute('href') === `/maplestory${buildPrefix}/items/use`,
      );
      expect(useLink).toBeDefined();

      // Only the active entry gets aria-current="page"
      const activeLinks = Array.from(links).filter(
        (link) => link.getAttribute('aria-current') === 'page',
      );
      expect(activeLinks).toHaveLength(1);
      expect(activeLinks[0]?.getAttribute('href')).toBe(url);

      // Mobile scope navigation assertions
      const mobileScopeNav = container.querySelector(
        'nav[aria-label="Inventory scopes"]',
      );
      expect(mobileScopeNav).not.toBeNull();

      const mobileScopeTabs = Array.from(
        mobileScopeNav?.querySelectorAll('a') ?? [],
      );
      expect(mobileScopeTabs.length).toBeGreaterThan(0);

      const parentScopeHref =
        expectedScope.slug === 'all'
          ? `/maplestory${buildPrefix}/items`
          : `/maplestory${buildPrefix}/items/${expectedScope.slug}`;
      const parentScopeTab = mobileScopeTabs.find(
        (tab) => tab.getAttribute('href') === parentScopeHref,
      );
      expect(parentScopeTab).toBeDefined();

      const isChildPage = expectedChildSlug !== undefined;

      // The parent scope tab is always expanded
      expect(parentScopeTab?.hasAttribute('data-expanded')).toBe(true);
      expect(parentScopeTab?.getAttribute('aria-current')).toBe(
        isChildPage ? null : 'page',
      );

      // Exactly the parent scope tab has data-expanded; other tabs have neither
      const expandedTabs = mobileScopeTabs.filter((tab) =>
        tab.hasAttribute('data-expanded'),
      );
      expect(expandedTabs).toEqual([parentScopeTab]);

      const currentScopeTabs = mobileScopeTabs.filter(
        (tab) => tab.getAttribute('aria-current') === 'page',
      );
      expect(currentScopeTabs).toEqual(isChildPage ? [] : [parentScopeTab]);
    });
  }

  const notFoundUrls = [
    '/maplestory/cw-launch/items',
    '/maplestory/not-a-build/items',
    '/maplestory/items/all',
    '/maplestory/items/use/nope',
  ];

  for (const url of notFoundUrls) {
    it(`triggers notFound and never calls loader for ${url}`, async () => {
      const history = createMemoryHistory({ initialEntries: [url] });
      const router = createRouter({ routeTree, history });
      await router.load();

      const hasNotFound = router.state.matches.some((match) =>
        Boolean((match as { _notFound?: boolean })._notFound),
      );
      expect(hasNotFound).toBe(true);
      expect(loadItemBrowse).not.toHaveBeenCalled();
    });
  }

  it('preserves Monster Browse matching for /maplestory/gms-v83/monsters', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/gms-v83/monsters'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const monsterMatch = router.state.matches.find(
      (m) => m.routeId === '/maplestory/$buildId/monsters',
    );
    expect(monsterMatch).toBeDefined();
    expect(loadItemBrowse).not.toHaveBeenCalled();
  });
});
