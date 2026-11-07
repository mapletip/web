import { MantineProvider } from '@mantine/core';
import { itemIconUrl } from '@mapletip/data/items';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useIcon from '@/assets/maplestory/navigation/items-use-red-potion.png?no-inline';
import { MAPLEKIT_RELEASE } from '@/config/maplekit';
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
      icon: '3a453e4e40b44d9358f9348abdda896b64ecc046a52e5b07a2388bdbd7dc8601',
    },
    {
      key: 'item:use:recovery',
      sourceId: '02000004',
      itemClass: 'consume',
      functions: ['recovery'],
      icon: '07c090345b4e437b6204eb7e234119d7709846f6b263712c7df5121add2bdc71',
    },
    {
      key: 'item:use:stars',
      sourceId: '02070000',
      itemClass: 'consume',
      types: ['throwing-star'],
      icon: 'f77172ea2f08e2e8586c8d2a208c3614cbf112a09796609f9b4fc5c8affb5e0e',
    },
    {
      key: 'item:use:potion',
      sourceId: '02000003',
      itemClass: 'consume',
      types: ['potion'],
      icon: '8e3e5f732599bc6a681e939e526ab134619cdb6711dfa52a7f7011e4e2f4d5b6',
    },
    {
      key: 'item:etc:quest',
      sourceId: '04031001',
      itemClass: 'etc',
      neededForQuestCount: 1,
      icon: '63df4ceb3580419b2ae1db57f001573eac4fe068edfe5aeea17c4ce734de0f7a',
    },
    {
      key: 'item:setup:chair',
      sourceId: '03010007',
      itemClass: 'setup',
      types: ['chair'],
      icon: '15ceb9596a6bdc8f61f8aa1382292f3b428a30281315b83ed0499c5d0492e120',
    },
    {
      key: 'item:cash:pet',
      sourceId: '5000002',
      itemClass: 'pet',
      icon: '7cb4e8cd5e402cc35d7bd6d51dafb1800670816463425b50525f091accdde43e',
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
      expectedDirectChildren: ['Use', 'ETC', 'Set-up', 'Cash'],
      unexpectedLabels: ['Scrolls', 'Recovery', 'Quest Items'],
      expectedHasIcon: false,
    },
    {
      url: '/maplestory/items/use',
      expectedBuildId: 'cw-launch',
      expectedScope: ITEM_SCOPES.use,
      expectedChildSlug: undefined,
      currentLabel: 'Use',
      expectedBackLinks: [{ href: '/maplestory/items', label: 'All Items' }],
      expectedDirectChildren: [
        'Scrolls',
        'Recovery',
        'Throwing Stars',
        'Buffs',
      ],
      unexpectedLabels: [
        'ETC',
        'Set-up',
        'Cash',
        'Bullets',
        'Boxes',
        'Monster Cards',
        'Mastery Books',
      ],
      expectedHasIcon: true,
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
        'Scrolls',
        'Recovery',
        'Throwing Stars',
        'Buffs',
        'ETC',
        'Set-up',
      ],
      expectedHasIcon: false,
    },
    {
      url: '/maplestory/items/use/scrolls',
      expectedBuildId: 'cw-launch',
      expectedScope: ITEM_SCOPES.use,
      expectedChildSlug: 'scrolls',
      currentLabel: 'Scrolls',
      expectedBackLinks: [
        { href: '/maplestory/items', label: 'All Items' },
        { href: '/maplestory/items/use', label: 'Use' },
      ],
      expectedDirectChildren: [] as readonly string[],
      unexpectedLabels: ['Recovery', 'Throwing Stars', 'ETC', 'Set-up'],
      expectedHasIcon: true,
    },
    {
      url: '/maplestory/gms-v83/items',
      expectedBuildId: 'gms-v83',
      expectedScope: ITEM_SCOPES.all,
      expectedChildSlug: undefined,
      currentLabel: 'All Items',
      expectedBackLinks: [] as readonly { href: string; label: string }[],
      expectedDirectChildren: ['Use', 'ETC', 'Set-up', 'Cash'],
      unexpectedLabels: ['Quest Items', 'Chairs'],
      expectedHasIcon: false,
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
      expectedHasIcon: true,
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
    expectedHasIcon,
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

      // The current category and active build each have one current link.
      const currentMatches = html.match(/aria-current="page"/g) ?? [];
      expect(currentMatches).toHaveLength(2);
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
      expect(navChip.querySelector('img') !== null).toBe(expectedHasIcon);

      expect(
        screen.getByRole('button', { name: /Open all filters/i }),
      ).toBeInTheDocument();
    });
  }

  it('renders the mobile navigation chip with the Use icon in SSR for /maplestory/items/use', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items/use'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const html = renderToString(
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    // Verify the chip button exists with Use accessible name
    expect(html).toContain('Item categories: Use. Open Item categories');
    // Verify the chip button includes the Use scope icon
    const chipMatch = html.match(
      /<button[^>]*aria-label="Item categories: Use\. Open Item categories"[^>]*>([\s\S]*?)<\/button>/,
    );
    expect(chipMatch).not.toBeNull();
    expect(chipMatch?.[1]).toContain(useIcon);
    expect(chipMatch?.[1]).toContain('Use');
  });

  it('renders the mobile navigation chip with Recovery icon in SSR for /maplestory/items/use/recovery', async () => {
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
    // Verify the chip button has Recovery icon
    const chipMatch = html.match(
      /<button[^>]*aria-label="Item categories: Recovery\. Open Item categories"[^>]*>([\s\S]*?)<\/button>/,
    );
    expect(chipMatch).not.toBeNull();
    const recoveryIcon = itemIconUrl(
      MAPLEKIT_RELEASE.baseUrl,
      '07c090345b4e437b6204eb7e234119d7709846f6b263712c7df5121add2bdc71',
    );
    expect(chipMatch?.[1]).toContain(recoveryIcon);
    expect(chipMatch?.[1]).toContain('Recovery');
  });

  it('shows icons on children in the rail during SSR for /maplestory/items/use', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items/use'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const html = renderToString(
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    const upgradeScrollIcon = itemIconUrl(
      MAPLEKIT_RELEASE.baseUrl,
      '3a453e4e40b44d9358f9348abdda896b64ecc046a52e5b07a2388bdbd7dc8601',
    );
    const recoveryIcon = itemIconUrl(
      MAPLEKIT_RELEASE.baseUrl,
      '07c090345b4e437b6204eb7e234119d7709846f6b263712c7df5121add2bdc71',
    );
    const starsIcon = itemIconUrl(
      MAPLEKIT_RELEASE.baseUrl,
      'f77172ea2f08e2e8586c8d2a208c3614cbf112a09796609f9b4fc5c8affb5e0e',
    );

    expect(html).toContain(upgradeScrollIcon);
    expect(html).toContain(recoveryIcon);
    expect(html).toContain(starsIcon);
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

  it('handles mobile category drawer: drill into Use, apply leaf Recovery, back returns to items', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/items'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    render(
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    // Open drawer from category chip
    const chip = screen.getByRole('button', {
      name: /Item categories: All Items\. Open Item categories/i,
    });
    fireEvent.click(chip);

    // Dialog mounts
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // In the drawer, rows are buttons. Tap "Use" (non-leaf row)
    const useBtn = within(dialog).getByRole('button', { name: /^Use/i });
    fireEvent.click(useBtn);

    // Drawer stays open, shows Use's children, URL unchanged
    expect(history.location.pathname).toBe('/maplestory/items');
    expect(
      within(dialog).getByRole('button', { name: /^Use/i }),
    ).toHaveAttribute('aria-current', 'true');

    // Tap "Recovery" (leaf row) -> navigates with replace and closes drawer
    const recoveryBtn = within(dialog).getByRole('button', {
      name: /^Recovery/i,
    });
    fireEvent.click(recoveryBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(history.location.pathname).toBe('/maplestory/items/use/recovery');

    // History back returns to /maplestory/items
    history.back();
    expect(history.location.pathname).toBe('/maplestory/items');
  });

  const notFoundUrls = [
    '/maplestory/cw-launch/items',
    '/maplestory/not-a-build/items',
    '/maplestory/items/all',
    '/maplestory/items/use/nope',
    '/maplestory/items/use/upgrade-scrolls',
    '/maplestory/items/etc/monster-materials',
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
