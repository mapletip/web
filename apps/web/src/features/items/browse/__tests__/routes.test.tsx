import { MantineProvider } from '@mantine/core';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useIcon from '@/assets/maplestory/navigation/items-use-red-potion.png?no-inline';
import { routeTree } from '@/routeTree.gen';

import { ITEM_SCOPES } from '../categories';
import { loadItemBrowse } from '../load';
import type { ItemRow } from '../project';
import { parseItemRouteParams } from '../routing';

const { mockRows } = vi.hoisted(() => {
  const rows: readonly ItemRow[] = [
    {
      key: 'item:use:scroll',
      sourceId: '02040000',
      itemClass: 'consume',
      types: ['upgrade-scroll'],
    },
    {
      key: 'item:use:recovery',
      sourceId: '02000000',
      itemClass: 'consume',
      functions: ['recovery'],
    },
    {
      key: 'item:use:stars',
      sourceId: '02070000',
      itemClass: 'consume',
      types: ['throwing-star'],
    },
    {
      key: 'item:use:potion',
      sourceId: '02001000',
      itemClass: 'consume',
      types: ['potion'],
    },
    {
      key: 'item:etc:quest',
      sourceId: '04000000',
      itemClass: 'etc',
      neededForQuestCount: 1,
    },
    {
      key: 'item:setup:chair',
      sourceId: '03010000',
      itemClass: 'setup',
      types: ['chair'],
    },
    {
      key: 'item:cash:pet',
      sourceId: '05000000',
      itemClass: 'pet',
    },
  ];
  return { mockRows: rows };
});

vi.mock('../load', () => ({
  loadItemBrowse: vi.fn().mockResolvedValue({
    rows: mockRows,
    coverage: {},
  }),
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
      currentLabel: 'All Items',
      expectedBackLinks: [] as readonly { href: string; label: string }[],
      expectedDirectChildren: ['Use', 'ETC', 'Set-up', 'Cash/Pet'],
      unexpectedLabels: ['Upgrade Scrolls', 'Recovery', 'Quest Items'],
    },
    {
      url: '/maplestory/items/use',
      expectedBuildId: 'cw-launch',
      expectedScope: ITEM_SCOPES.use,
      expectedChildSlug: undefined,
      currentLabel: 'Use',
      expectedBackLinks: [{ href: '/maplestory/items', label: 'All Items' }],
      expectedDirectChildren: [
        'Upgrade Scrolls',
        'Recovery',
        'Throwing Stars',
        'Potions',
      ],
      unexpectedLabels: [
        'ETC',
        'Set-up',
        'Cash/Pet',
        'Bullets',
        'Reward Containers',
        'Monster Cards',
        'Skill Items',
      ],
    },
    {
      url: '/maplestory/items/use/bullets',
      expectedBuildId: 'cw-launch',
      expectedScope: ITEM_SCOPES.use,
      expectedChildSlug: 'bullets',
      currentLabel: 'Bullets',
      expectedBackLinks: [
        { href: '/maplestory/items', label: 'All Items' },
        { href: '/maplestory/items/use', label: 'Use' },
      ],
      expectedDirectChildren: [] as readonly string[],
      unexpectedLabels: [
        'Upgrade Scrolls',
        'Recovery',
        'Throwing Stars',
        'Potions',
        'ETC',
        'Set-up',
      ],
    },
    {
      url: '/maplestory/items/use/upgrade-scrolls',
      expectedBuildId: 'cw-launch',
      expectedScope: ITEM_SCOPES.use,
      expectedChildSlug: 'upgrade-scrolls',
      currentLabel: 'Upgrade Scrolls',
      expectedBackLinks: [
        { href: '/maplestory/items', label: 'All Items' },
        { href: '/maplestory/items/use', label: 'Use' },
      ],
      expectedDirectChildren: [] as readonly string[],
      unexpectedLabels: ['Recovery', 'Throwing Stars', 'ETC', 'Set-up'],
    },
    {
      url: '/maplestory/gms-v83/items',
      expectedBuildId: 'gms-v83',
      expectedScope: ITEM_SCOPES.all,
      expectedChildSlug: undefined,
      currentLabel: 'All Items',
      expectedBackLinks: [] as readonly { href: string; label: string }[],
      expectedDirectChildren: ['Use', 'ETC', 'Set-up', 'Cash/Pet'],
      unexpectedLabels: ['Quest Items', 'Chairs'],
    },
    {
      url: '/maplestory/gms-v83/items/etc/quest-items',
      expectedBuildId: 'gms-v83',
      expectedScope: ITEM_SCOPES.etc,
      expectedChildSlug: 'quest-items',
      currentLabel: 'Quest Items',
      expectedBackLinks: [
        { href: '/maplestory/gms-v83/items', label: 'All Items' },
        { href: '/maplestory/gms-v83/items/etc', label: 'ETC' },
      ],
      expectedDirectChildren: [] as readonly string[],
      unexpectedLabels: ['Crafting', 'Ores', 'Use', 'Set-up'],
    },
  ];

  for (const {
    url,
    expectedBuildId,
    expectedScope,
    expectedChildSlug,
    currentLabel,
    expectedBackLinks,
    expectedDirectChildren,
    unexpectedLabels,
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

    it(`renders exact drill-down shape and single aria-current in SSR for ${url}`, async () => {
      const history = createMemoryHistory({ initialEntries: [url] });
      const router = createRouter({ routeTree, history });
      await router.load();

      const html = renderToString(
        <MantineProvider>
          <RouterProvider router={router} />
        </MantineProvider>,
      );

      // Verify exactly one aria-current="page" across the entire SSR output
      const currentMatches = html.match(/aria-current="page"/g) ?? [];
      expect(currentMatches).toHaveLength(1);
    });

    it(`renders drill-down navigation and responsive chip for ${url}`, async () => {
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

      // Verify exactly one aria-current in the desktop rail
      const activeLinks = Array.from(links).filter(
        (link) => link.getAttribute('aria-current') === 'page',
      );
      expect(activeLinks).toHaveLength(1);
      expect(activeLinks[0]?.getAttribute('href')).toBe(url);
      expect(activeLinks[0]?.textContent).toContain(currentLabel);

      // Verify back rows
      const backLinks = Array.from(links).filter((link) =>
        link.textContent?.includes('←'),
      );
      expect(backLinks).toHaveLength(expectedBackLinks.length);
      for (const [index, expectedBack] of expectedBackLinks.entries()) {
        const link = backLinks[index];
        expect(link?.getAttribute('href')).toBe(expectedBack.href);
        expect(link?.textContent).toContain(`← ${expectedBack.label}`);
      }

      // Verify direct children
      for (const childLabel of expectedDirectChildren) {
        const childLink = Array.from(links).find((link) =>
          link.textContent?.includes(childLabel),
        );
        expect(childLink).toBeDefined();
      }

      // Verify no siblings outside drill-down path
      for (const unexpected of unexpectedLabels) {
        const unexpectedLink = Array.from(links).find((link) =>
          link.textContent?.includes(unexpected),
        );
        expect(unexpectedLink).toBeUndefined();
      }

      // Verify mobile quick navigation chip
      const navChip = screen.getByRole('button', {
        name: `Item categories: ${currentLabel}. Open Item categories`,
      });
      expect(navChip).toBeVisible();
      expect(navChip.textContent).toContain(currentLabel);
      expect(navChip.querySelector('img')).not.toBeNull();

      // Verify "Filters" button is absent when facets are empty
      expect(
        screen.queryByRole('button', { name: /Open all filters/i }),
      ).not.toBeInTheDocument();
    });
  }

  it('renders the mobile navigation chip with the Use icon in SSR for /maplestory/items/use/recovery', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items/use/recovery'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const html = renderToString(
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    // Verify the chip button exists with Recovery accessible name
    expect(html).toContain('Item categories: Recovery. Open Item categories');
    // Verify the chip button includes the Use scope icon
    const chipMatch = html.match(
      /<button[^>]*aria-label="Item categories: Recovery\. Open Item categories"[^>]*>([\s\S]*?)<\/button>/,
    );
    expect(chipMatch).not.toBeNull();
    expect(chipMatch?.[1]).toContain(useIcon);
  });

  it('CW /maplestory/items/use/bullets renders 200 with Bullets as current (0) plus ← All Items, ← Use', async () => {
    const url = '/maplestory/items/use/bullets';
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
    const activeLink = Array.from(links).find(
      (link) => link.getAttribute('aria-current') === 'page',
    );
    expect(activeLink).toBeDefined();
    expect(activeLink?.getAttribute('href')).toBe(
      '/maplestory/items/use/bullets',
    );
    expect(activeLink?.textContent).toContain('Bullets');
    expect(activeLink?.textContent).toContain('0');

    const backLinks = Array.from(links).filter((link) =>
      link.textContent?.includes('←'),
    );
    expect(backLinks).toHaveLength(2);
    expect(backLinks[0]?.getAttribute('href')).toBe('/maplestory/items');
    expect(backLinks[0]?.textContent).toContain('← All Items');
    expect(backLinks[1]?.getAttribute('href')).toBe('/maplestory/items/use');
    expect(backLinks[1]?.textContent).toContain('← Use');
  });

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
