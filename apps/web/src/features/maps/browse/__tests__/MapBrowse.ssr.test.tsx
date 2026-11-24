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

function headMeta(
  router: Awaited<ReturnType<typeof renderPath>>['router'],
): readonly unknown[] {
  return (
    router.state.matches.find(
      (match) => match.routeId === '/maplestory/{-$buildId}/maps/_browse/',
    )?.meta ?? []
  );
}

describe('Map Browse server rendering', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const data = await mapBrowseFixture();
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

  it('states that map data is unavailable for a build without it', async () => {
    mockedLoad.mockResolvedValue({ status: 'unavailable' });

    const { html } = await renderPath('/maplestory/maps');

    expect(html).toContain('Map data is unavailable for this build.');
  });
});
