import { MantineProvider } from '@mantine/core';
import type {
  ItemBrowseRecordV2_2,
  ItemBrowseRowV2_2,
} from '@mapletip/data/items';
import { theme } from '@mapletip/theme';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BuildId } from '@/config/maplekit';
import { fixtureRelease } from '@/mocks/release';
import { routeTree } from '@/routeTree.gen';

import {
  ITEM_BROWSE_UNAVAILABLE_MESSAGE,
  loadItemBrowse,
  type LoadedItemBrowse,
} from '../load';
import { projectItemBrowseRows } from '../project';

vi.mock('../load', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../load')>();
  return { ...actual, loadItemBrowse: vi.fn() };
});

const mockedLoad = vi.mocked(loadItemBrowse);

function fixtureBrowse(buildId: BuildId): LoadedItemBrowse {
  const descriptor = fixtureRelease.builds.get(buildId)?.itemBrowse;
  if (!descriptor) throw new Error(`Missing browse pack for ${buildId}`);
  const bytes = fixtureRelease.files.get(descriptor.path);
  if (!bytes) throw new Error(`Missing fixture file for ${buildId}`);
  const pack = JSON.parse(new TextDecoder().decode(bytes)) as {
    coverage: LoadedItemBrowse['coverage'];
    records: Record<string, ItemBrowseRecordV2_2 | undefined>;
  };
  const records = Object.entries(pack.records).flatMap(
    ([key, record]): ItemBrowseRowV2_2[] =>
      record ? [{ ...record, key }] : [],
  );
  return {
    rows: projectItemBrowseRows(records),
    coverage: pack.coverage,
  };
}

async function renderPath(path: string) {
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
  return { router, html };
}

type TestRouter = Awaited<ReturnType<typeof renderPath>>['router'];

function leafMatch(router: TestRouter) {
  return router.state.matches.at(-1);
}

function headMeta(router: TestRouter): readonly unknown[] {
  return leafMatch(router)?.meta ?? [];
}

function canonical(router: TestRouter): unknown {
  return leafMatch(router)?.links?.find(
    (link) => (link as { rel?: string }).rel === 'canonical',
  );
}

function railHtml(html: string): string {
  const match =
    /<nav[^>]*aria-label="Item categories"[^>]*>([\s\S]*?)<\/nav>/u.exec(html);
  if (!match?.[1]) throw new Error('Expected Item categories rail in SSR HTML');
  return match[1].replaceAll('<!-- -->', '');
}

function isNotFound(router: TestRouter): boolean {
  return router.state.matches.some(
    (match) =>
      match.status === 'notFound' ||
      Boolean((match as { _notFound?: boolean })._notFound),
  );
}

describe('Items Browse server rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedLoad.mockImplementation((buildId) =>
      Promise.resolve(fixtureBrowse(buildId)),
    );
  });

  it('renders a category with its heading, cards, drill-down rail and indexable metadata', async () => {
    const { router, html } = await renderPath('/maplestory/items/use/scrolls');
    const rail = railHtml(html);

    expect(html).toMatch(/<h1[^>]*>MapleStory Classic World Scrolls<\/h1>/u);
    expect(html).toContain('Unsorted Practice Scroll');
    const links = rail.match(/<a\b[^>]*>/gu) ?? [];
    expect(links).toHaveLength(3);
    expect(links[0]).toContain('href="/maplestory/items/all"');
    expect(links[1]).toContain('href="/maplestory/items/use"');
    expect(links[1]).not.toContain('aria-current');
    expect(links[2]).toContain('href="/maplestory/items/use/scrolls"');
    expect(links[2]).toContain('aria-current="page"');
    expect(rail).not.toContain('Stars &amp; Arrows');
    expect(headMeta(router)).toContainEqual({
      title: 'MapleStory Classic World Scrolls – MapleTip',
    });
    expect(headMeta(router)).toContainEqual({
      name: 'robots',
      content: 'index,follow',
    });
    expect(canonical(router)).toEqual({
      rel: 'canonical',
      href: 'https://mapletip.com/maplestory/items/use/scrolls',
    });
    expect(mockedLoad).toHaveBeenCalledWith(
      'cw-launch',
      expect.any(AbortSignal),
    );
  });

  it('serves an alternate build with its own heading, canonical address and noindex', async () => {
    const { router, html } = await renderPath(
      '/maplestory/gms-v83/items/use/scrolls',
    );

    expect(html).toMatch(/<h1[^>]*>MapleStory GMS v83 Scrolls<\/h1>/u);
    expect(mockedLoad).toHaveBeenCalledWith('gms-v83', expect.any(AbortSignal));
    expect(headMeta(router)).toContainEqual({
      title: 'MapleStory GMS v83 Scrolls – MapleTip',
    });
    expect(headMeta(router)).toContainEqual({
      name: 'robots',
      content: 'noindex,follow',
    });
    expect(canonical(router)).toEqual({
      rel: 'canonical',
      href: 'https://mapletip.com/maplestory/gms-v83/items/use/scrolls',
    });
  });

  it('serves an empty category with its heading, empty state and noindex, and hides it from group rails', async () => {
    const base = fixtureBrowse('cw-launch');
    mockedLoad.mockResolvedValue({
      ...base,
      rows: base.rows.filter((row) => row.kind !== 'monster-cards'),
    });

    const emptyView = await renderPath('/maplestory/items/use/monster-cards');
    expect(emptyView.html).toMatch(
      /<h1[^>]*>MapleStory Classic World Monster Cards<\/h1>/u,
    );
    expect(emptyView.html).toContain('No Classic World items available');
    expect(headMeta(emptyView.router)).toContainEqual({
      name: 'robots',
      content: 'noindex,follow',
    });
    expect(canonical(emptyView.router)).toEqual({
      rel: 'canonical',
      href: 'https://mapletip.com/maplestory/items/use/monster-cards',
    });

    const groupView = await renderPath('/maplestory/items/use');
    expect(railHtml(groupView.html)).not.toContain('Monster Cards');
  });

  it.each([
    '/maplestory/cw-launch/items/use/scrolls',
    '/maplestory/not-a-build/items/use/scrolls',
    '/maplestory/items/unknown',
    '/maplestory/items/use/recovery',
    '/maplestory/items/etc/scrolls',
    '/maplestory/items/practice-tonic-123',
  ])('returns not found for %s', async (path) => {
    const { router } = await renderPath(path);

    expect(isNotFound(router)).toBe(true);
  });

  it.each([
    [
      'a search',
      '/maplestory/items/use/scrolls?q=practice',
      'https://mapletip.com/maplestory/items/use/scrolls',
    ],
    [
      'a non-default sort',
      '/maplestory/items/use/scrolls?sort=name-desc',
      'https://mapletip.com/maplestory/items/use/scrolls',
    ],
    [
      'a later page',
      '/maplestory/items/etc/monster-drops?page=2',
      'https://mapletip.com/maplestory/items/etc/monster-drops',
    ],
    [
      'cross-category results',
      '/maplestory/items/all',
      'https://mapletip.com/maplestory/items/all',
    ],
  ])(
    'marks %s as noindex,follow with its canonical address',
    async (_label, path, expectedCanonical) => {
      const { router } = await renderPath(path);

      expect(headMeta(router)).toContainEqual({
        name: 'robots',
        content: 'noindex,follow',
      });
      expect(canonical(router)).toEqual({
        rel: 'canonical',
        href: expectedCanonical,
      });
    },
  );

  it.each([
    ['/maplestory/items', 'MapleStory Classic World Items'],
    ['/maplestory/items/use', 'MapleStory Classic World Use Items'],
    ['/maplestory/items/etc', 'MapleStory Classic World ETC Items'],
    ['/maplestory/items/setup', 'MapleStory Classic World Set-up Items'],
    [
      '/maplestory/items/cash',
      'MapleStory Classic World Pets &amp; Cash Items',
    ],
  ])(
    'renders site navigation destination %s',
    async (path, expectedHeading) => {
      const { router, html } = await renderPath(path);

      expect(isNotFound(router)).toBe(false);
      expect(html).toContain(expectedHeading);
      expect(headMeta(router)).toContainEqual({
        name: 'robots',
        content: 'index,follow',
      });
    },
  );

  it('shows the generic unavailable state when item data fails to load', async () => {
    mockedLoad.mockRejectedValue(new Error(ITEM_BROWSE_UNAVAILABLE_MESSAGE));

    const { html } = await renderPath('/maplestory/items/use/scrolls');

    expect(html).toContain('Something went wrong');
    expect(html).toContain('Try again');
    expect(html).not.toContain('v2/items');
  });
});
