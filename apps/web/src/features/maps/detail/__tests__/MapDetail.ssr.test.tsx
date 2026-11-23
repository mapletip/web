import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import {
  HeadContent,
  RouterContextProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import portalImage from '@/assets/maplestory/maps/minimap-portal.png?no-inline';
import { SITE_ORIGIN } from '@/config/site';
import { routeTree } from '@/routeTree.gen';

import { loadMapDetail } from '../load';
import { MapDetail } from '../MapDetail';
import { projectMapDetail } from '../project';

import { mapPageRecordFixture } from './mapPageFixture';

vi.mock('../load', () => ({ loadMapDetail: vi.fn() }));

const mockedLoadMapDetail = vi.mocked(loadMapDetail);

describe('MapDetail server rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders identity, title, canonical link, and matching breadcrumb JSON-LD', async () => {
    const source = mapPageRecordFixture({ mapId: 'lantern-square' });
    if (source.geography === undefined || source.geography === null) {
      throw new Error('Expected the fixture Map to have geography.');
    }
    const record = {
      ...source,
      geography: {
        ...source.geography,
        areaKey: 'fixture:market',
        areaLabel: 'Lantern Market',
      },
    };
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    mockedLoadMapDetail.mockResolvedValue({ status: 'found', view });

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [view.canonicalPath] }),
    });
    await router.load();

    const html = renderToString(
      <RouterContextProvider router={router}>
        <MantineProvider theme={theme} forceColorScheme="dark">
          <HeadContent />
          <MapDetail view={view} />
        </MantineProvider>
      </RouterContextProvider>,
    );

    expect(html).toContain('<h1');
    expect(html).toContain('Lantern Square');
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/maplestory/maps"');
    expect(html).toContain('Lantern Hills');
    expect(html).toContain('Lantern Market');
    expect(html.replaceAll('<!-- -->', '')).toContain(
      'Part of <strong>Market</strong>',
    );
    expect(html).toContain('aria-label="Map reference"');
    expect(html).toContain('A gathering place beneath paper lanterns.');
    expect(html).toContain('Map information');
    expect(html).toContain('data-columns="1"');
    expect(html).toContain('data-map-fact-icon="music"');
    expect(html).toContain('Floral Life');
    expect(html).toContain('10 min');
    expect(html).toContain('Swimming');
    expect(html).not.toContain('Flying');
    expect(html).toContain(
      `href="/maplestory/maps/practice-grove-${source.information.returnMap.state === 'known' ? source.information.returnMap.value.publicId : ''}"`,
    );
    expect(html).toContain(
      `<title>Lantern Square - MapleStory Map, Monster Spawns &amp; NPCs | Classic World</title>`,
    );
    expect(html).toContain(
      `<link rel="canonical" href="${SITE_ORIGIN}${view.canonicalPath}"/>`,
    );

    const detailMatch = router.state.matches.find(
      (match) => match.routeId === '/maplestory/{-$buildId}/maps/$slugId',
    );
    const breadcrumbScript = detailMatch?.headScripts?.[0]?.children;
    if (typeof breadcrumbScript !== 'string') {
      throw new Error('Expected breadcrumb JSON-LD script content.');
    }
    const jsonLd = JSON.parse(breadcrumbScript) as {
      readonly itemListElement: readonly {
        readonly name: string;
        readonly item?: string;
      }[];
    };
    expect(jsonLd.itemListElement.map(({ name }) => name)).toEqual([
      'Home',
      'Maps',
      'Lantern Hills',
      'Lantern Market',
      'Lantern Square',
    ]);
    expect(jsonLd.itemListElement[2]).not.toHaveProperty('item');
    expect(jsonLd.itemListElement[3]).not.toHaveProperty('item');
  });

  it('marks a focused address noindex and keeps focus off the canonical link', async () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    const focusKey = view.monsters.monsters[0]?.focusKey;
    if (focusKey === undefined) throw new Error('Expected a fixture Monster.');
    mockedLoadMapDetail.mockResolvedValue({ status: 'found', view });

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({
        initialEntries: [`${view.canonicalPath}?focus=${focusKey}`],
      }),
    });
    await router.load();

    const html = renderToString(
      <RouterContextProvider router={router}>
        <MantineProvider theme={theme} forceColorScheme="dark">
          <HeadContent />
          <MapDetail view={view} />
        </MantineProvider>
      </RouterContextProvider>,
    );

    expect(html).toContain('<meta name="robots" content="noindex,follow"');
    expect(html).toContain(
      `<link rel="canonical" href="${SITE_ORIGIN}${view.canonicalPath}"/>`,
    );
    expect(html).not.toContain(`${view.canonicalPath}?focus=`);
  });

  it('renders the Monsters section heading and a linked card in server HTML', async () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    mockedLoadMapDetail.mockResolvedValue({ status: 'found', view });

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [view.canonicalPath] }),
    });
    await router.load();

    const html = renderToString(
      <RouterContextProvider router={router}>
        <MantineProvider theme={theme} forceColorScheme="dark">
          <MapDetail view={view} />
        </MantineProvider>
      </RouterContextProvider>,
    );

    expect(html).toContain('<section aria-labelledby="monsters">');
    expect(html).toContain('id="monsters"');
    expect(html).toContain('Monsters on this map');
    expect(html).not.toContain('aria-label="Record sections"');
    expect(html).toContain('data-testid="map-monster-card"');
    expect(html).toContain('Plain Pebble');
    expect(html).toContain('alt="Practice Grove map"');
    expect(html).toContain(`src="${portalImage}"`);
    expect(html).toMatch(
      /<[a-z]+(?=[^>]*data-marker-ids="[^"]+")(?=[^>]*style="[^"]*left:26\.[0-9]+%;top:65%[^"]*")[^>]*>/u,
    );
    expect(html).toContain(
      `href="/maplestory/monsters/plain-pebble-${record.monsters.items[0]?.publicId}"`,
    );
  });

  it('renders the NPCs section heading and a card in server HTML', async () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'lantern-square' }),
      buildId: 'cw-launch',
    });
    mockedLoadMapDetail.mockResolvedValue({ status: 'found', view });

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [view.canonicalPath] }),
    });
    await router.load();

    const html = renderToString(
      <RouterContextProvider router={router}>
        <MantineProvider theme={theme} forceColorScheme="dark">
          <MapDetail view={view} />
        </MantineProvider>
      </RouterContextProvider>,
    );

    expect(html).toContain('<section aria-labelledby="npcs">');
    expect(html).toContain('id="npcs"');
    expect(html).toContain('NPCs on this map');
    expect(html).toContain('data-testid="map-npc-card"');
    expect(html).toContain('Bellkeeper');
    expect(html).toContain('data-fallback="true"');
  });
});
