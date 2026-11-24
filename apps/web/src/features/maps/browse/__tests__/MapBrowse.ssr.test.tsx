import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routeTree } from '@/routeTree.gen';

import { loadMapBrowse } from '../load';
import type { MapBrowseData } from '../project';

import { mapBrowseFixture } from './mapBrowseFixture';

vi.mock('../load', () => ({ loadMapBrowse: vi.fn() }));

const mockedLoad = vi.mocked(loadMapBrowse);

function cardNames(html: string): readonly (string | undefined)[] {
  return [...html.matchAll(/<h3[^>]*>(?:<a[^>]*>)?([^<]+)</gu)].map((match) =>
    match[1]
      ?.replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&amp;', '&'),
  );
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

function param(value: unknown): string {
  return encodeURIComponent(JSON.stringify(value));
}

describe('Map Browse server rendering', () => {
  let data: MapBrowseData;
  const monsterKey = (name: string) =>
    data.monsters.find((monster) => monster.name === name)?.key;
  const npcKey = (name: string) =>
    data.npcs.find((npc) => npc.name === name)?.key;

  beforeEach(async () => {
    vi.clearAllMocks();
    data = await mapBrowseFixture();
    mockedLoad.mockResolvedValue({ status: 'available', data });
  });

  it('renders the first page of map names A to Z with indexable metadata', async () => {
    const { router, html } = await renderPath('/maplestory/maps');

    expect(html).toContain('MapleStory Classic World Maps');
    const names = cardNames(html);
    expect(names.slice(0, 3)).toEqual([
      'Brass Walk',
      'Cloud Arch',
      'Festival Booth',
    ]);
    expect(names.at(-1)).toBe('Unnamed map');
    expect(headMeta(router)).toContainEqual({
      name: 'robots',
      content: 'index,follow',
    });
    expect(mockedLoad).toHaveBeenCalledWith(
      'cw-launch',
      expect.any(AbortSignal),
    );
  });

  it('serves the alternate build and does not index a search', async () => {
    const { router } = await renderPath('/maplestory/gms-v83/maps?q=lamp');

    expect(mockedLoad).toHaveBeenCalledWith('gms-v83', expect.any(AbortSignal));
    expect(headMeta(router)).toContainEqual({
      name: 'robots',
      content: 'noindex,follow',
    });
  });

  it.each(['/maplestory/cw-launch/maps', '/maplestory/not-a-build/maps'])(
    'returns not found for %s',
    async (path) => {
      const { router } = await renderPath(path);

      expect(
        router.state.matches.some(
          (match) =>
            match.status === 'notFound' ||
            Boolean((match as { _notFound?: boolean })._notFound),
        ),
      ).toBe(true);
      expect(mockedLoad).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['a map name', 'meadow', ['Lamplight Meadow']],
    ['a street name', 'lamplight hall', ['Unnamed map']],
    ['an activity', 'lantern relay', ['Lantern Rehearsal <Stage 1>']],
    ['a collection', 'event maps', ['Festival Booth']],
    [
      'an area',
      'lamplight',
      ['Lamplight Meadow', 'Lantern Rehearsal <Stage 1>', 'Unnamed map'],
    ],
    ['an NPC', 'festival host', ['Festival Booth']],
    [
      'a monster',
      'twin sprout',
      ['Lamplight Meadow', 'Practice Grove', 'Synthetic Monster Yard'],
    ],
  ])('searches by %s', async (_kind, query, expected) => {
    const { html } = await renderPath(
      `/maplestory/maps?q=${encodeURIComponent(query)}`,
    );

    expect(cardNames(html)).toEqual(expected);
  });

  it('orders by lowest monster level with maps without monsters last', async () => {
    const { html } = await renderPath(
      '/maplestory/maps?sort=lowestMonsterLevel-asc&pageSize=100',
    );
    const names = cardNames(html);

    expect([...names.slice(0, 3)].sort()).toEqual([
      'Practice Grove',
      'Stillwater Stage',
      'Synthetic Monster Yard',
    ]);
    expect(names.indexOf('Brass Walk')).toBeGreaterThan(
      names.indexOf('Lantern Rehearsal <Stage 1>'),
    );
  });

  it('ignores invalid address values', async () => {
    const { html } = await renderPath(
      '/maplestory/maps?sort=bogus-asc&monster=not-in-build',
    );

    expect(cardNames(html)[0]).toBe('Brass Walk');
  });

  it('lists a region including its area-less maps', async () => {
    const { html, router } = await renderPath(
      '/maplestory/maps/in/lantern-hills',
    );

    expect(html).toContain('MapleStory Classic World Lantern Hills Maps');
    expect(cardNames(html)).toEqual([
      'Lamplight Meadow',
      'Lantern Rehearsal <Stage 1>',
      'Lantern Square',
      'Practice Grove',
      'Synthetic Monster Yard',
      'Unnamed map',
    ]);
    expect(canonical(router)).toEqual({
      rel: 'canonical',
      href: 'https://mapletip.com/maplestory/maps/in/lantern-hills',
    });
  });

  it('lists an area with its own title and indexes it', async () => {
    const { html, router } = await renderPath(
      '/maplestory/maps/in/lantern-hills/lamplight',
    );

    expect(cardNames(html)).toEqual([
      'Lamplight Meadow',
      'Lantern Rehearsal <Stage 1>',
      'Unnamed map',
    ]);
    expect(headMeta(router)).toContainEqual({
      title: 'MapleStory Classic World Lamplight Maps – MapleTip',
    });
    expect(headMeta(router)).toContainEqual({
      name: 'robots',
      content: 'index,follow',
    });
  });

  it('lists a collection under its label', async () => {
    const { html } = await renderPath('/maplestory/maps/in/event');

    expect(html).toContain('MapleStory Classic World Event maps');
    expect(cardNames(html)).toEqual(['Festival Booth']);
  });

  it('keeps a filtered location page out of the index with the page as canonical', async () => {
    const { router } = await renderPath(
      '/maplestory/maps/in/lantern-hills/lamplight?q=meadow',
    );

    expect(headMeta(router)).toContainEqual({
      name: 'robots',
      content: 'noindex,follow',
    });
    expect(canonical(router)).toEqual({
      rel: 'canonical',
      href: 'https://mapletip.com/maplestory/maps/in/lantern-hills/lamplight',
    });
  });

  it.each([
    '/maplestory/maps/in/not-a-place',
    '/maplestory/maps/in/event/lamplight',
  ])('returns not found for %s', async (path) => {
    const { router } = await renderPath(path);

    expect(
      router.state.matches.some(
        (match) =>
          match.status === 'notFound' ||
          Boolean((match as { _notFound?: boolean })._notFound),
      ),
    ).toBe(true);
  });

  it('filters by one monster and names it on each card', async () => {
    const { html } = await renderPath(
      `/maplestory/maps?monster=${param([monsterKey('Wide Banner')])}`,
    );

    expect(cardNames(html)).toEqual(['Lantern Rehearsal <Stage 1>']);
    expect(html).toContain('Wide Banner (3 spawn points)');
  });

  it('filters by several monsters as any of them', async () => {
    const { html } = await renderPath(
      `/maplestory/maps?monster=${param([
        monsterKey('Wide Banner'),
        monsterKey(
          'Extraordinarily Long Named Fixture Creature Of The Far Northern Reaches',
        ),
      ])}`,
    );

    expect(cardNames(html)).toEqual([
      'Lamplight Meadow',
      'Lantern Rehearsal <Stage 1>',
    ]);
  });

  it('filters by NPC', async () => {
    const { html } = await renderPath(
      `/maplestory/maps?npc=${param([npcKey('Festival Host')])}`,
    );

    expect(cardNames(html)).toEqual(['Festival Booth']);
    expect(html).toContain('data-testid="map-card-highlight"');
  });

  it('filters by monster level and leaves out maps without monsters', async () => {
    const { html } = await renderPath(
      `/maplestory/maps?level=${param({ min: 3, max: 5 })}`,
    );

    expect(cardNames(html)).toEqual([
      'Lamplight Meadow',
      'Synthetic Monster Yard',
    ]);
  });

  it('filters by activity type and by maps with NPCs', async () => {
    const partyQuests = await renderPath(
      `/maplestory/maps?activityType=${param(['Party quest'])}`,
    );
    expect(cardNames(partyQuests.html)).toEqual([
      'Lantern Rehearsal <Stage 1>',
    ]);

    const withNpcs = await renderPath('/maplestory/maps?hasNpcs=true');
    expect(cardNames(withNpcs.html)).toEqual([
      'Brass Walk',
      'Festival Booth',
      'Lamplight Meadow',
      'Lantern Square',
      'Quiet Gallery',
    ]);
  });

  it('hides the activity filter for a build without reviewed activities', async () => {
    mockedLoad.mockResolvedValue({
      status: 'available',
      data: {
        ...data,
        rows: data.rows.map((row) => {
          const { activityType, ...unreviewed } = row;
          return activityType === undefined ? row : unreviewed;
        }),
      },
    });

    const { html } = await renderPath('/maplestory/maps');

    expect(html).toContain('Has NPCs');
    expect(html).not.toContain('Party quest');
  });

  it('states that map data is unavailable for a build without it', async () => {
    mockedLoad.mockResolvedValue({ status: 'unavailable' });

    const { html } = await renderPath('/maplestory/maps');

    expect(html).toContain('Map data is unavailable for this build.');
  });
});
