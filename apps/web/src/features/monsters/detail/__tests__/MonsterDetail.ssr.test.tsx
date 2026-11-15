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

import { SITE_ORIGIN } from '@/config/site';
import { routeTree } from '@/routeTree.gen';

import { loadMonsterDetail } from '../load';
import { MonsterDetail } from '../MonsterDetail';
import { projectMonsterDetail } from '../project';

import { monsterPageFixture } from './monsterPageFixture';

vi.mock('../load', () => ({
  loadMonsterDetail: vi.fn(),
}));

const mockedLoadMonsterDetail = vi.mocked(loadMonsterDetail);

describe('MonsterDetail server rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders identity, breadcrumbs, canonical link, and BreadcrumbList JSON-LD in SSR HTML', async () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        publicId: '36z2h01p',
        slug: 'sentinel-snail',
        name: { state: 'known', value: 'Sentinel Snail' },
        stats: {
          ...monsterPageFixture().stats,
          hp: { state: 'known', value: 23_000_000 },
        },
        drops: {
          entries: [
            {
              itemRef: { state: 'resolved', key: 'fixture:item:tonic' },
              name: { state: 'known', value: 'Synthetic Tonic' },
              category: { kind: 'item-class', value: 'consume' },
              icon: { state: 'unknown' },
              assertion: { kind: 'native' },
            },
          ],
          summary: {
            native: { state: 'known', count: 1, lowerBound: true },
          },
        },
      }),
      'cw-launch',
    );
    mockedLoadMonsterDetail.mockResolvedValue({ status: 'found', view });

    const history = createMemoryHistory({
      initialEntries: ['/maplestory/monsters/sentinel-snail-36z2h01p'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const html = renderToString(
      <RouterContextProvider router={router}>
        <MantineProvider theme={theme} forceColorScheme="dark">
          <HeadContent />
          <MonsterDetail view={view} />
        </MantineProvider>
      </RouterContextProvider>,
    );

    expect(html).toContain('Sentinel Snail');
    expect(html).toContain('23,000,000');
    expect(html).toContain('href="#drops"');
    const renderedText = html
      .replace(/<!--.*?-->/gu, '')
      .replace(/<[^>]*>/gu, '');
    expect(renderedText).toContain('Drops (1)');
    expect(renderedText).toContain('Usable (1)');
    expect(html).toContain('Synthetic Tonic');
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/maplestory/monsters"');
    expect(html).toContain(
      `<link rel="canonical" href="${SITE_ORIGIN}/maplestory/monsters/sentinel-snail-36z2h01p"/>`,
    );
    expect(html).toContain('application/ld+json');
    expect(html).toContain('BreadcrumbList');
    expect(html).toContain(
      'Sentinel Snail – MapleStory Classic World Monster – MapleTip',
    );
  });
});
