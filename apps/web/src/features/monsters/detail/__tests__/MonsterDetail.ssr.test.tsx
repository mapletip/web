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
        slug: 'sentinel-shellback',
        name: { state: 'known', value: 'Sentinel Shellback' },
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
        quests: {
          state: 'known',
          entries: [
            {
              questKey: 'fixture:quest:synthetic',
              name: { state: 'known', value: 'Synthetic Hunt' },
              minLevel: { state: 'known', value: 12 },
              jobCodes: { state: 'absent', coverageKey: 'fixture:quest-jobs' },
              repeatable: { state: 'known', value: true },
              killCount: { state: 'unknown' },
              countGroupSize: { state: 'known', value: 2 },
            },
          ],
        },
        summonedByItems: [
          {
            itemRef: { state: 'resolved', key: 'fixture:item:seed' },
            name: { state: 'known', value: 'Synthetic Seed' },
            icon: { state: 'unknown' },
          },
        ],
      }),
      'cw-launch',
    );
    mockedLoadMonsterDetail.mockResolvedValue({ status: 'found', view });

    const history = createMemoryHistory({
      initialEntries: ['/maplestory/monsters/sentinel-shellback-36z2h01p'],
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

    expect(html).toContain('Sentinel Shellback');
    expect(html).toContain('23,000,000');
    expect(html).toContain('href="#drops"');
    expect(html).toContain('href="#quests"');
    expect(html).toContain('href="#summoned-by"');
    const renderedText = html
      .replace(/<!--.*?-->/gu, '')
      .replace(/<[^>]*>/gu, '');
    expect(renderedText).toContain('Drops (1)');
    expect(renderedText).toContain('Usable (1)');
    expect(renderedText).toContain('Quests (1)');
    expect(renderedText).toContain('Summoned by (1)');
    expect(renderedText).toContain('Synthetic Hunt');
    expect(renderedText).toContain('Synthetic Seed');
    expect(renderedText).toContain('Lv. 12+');
    expect(renderedText).toContain('Any job');
    expect(renderedText).toContain('Defeat');
    expect(renderedText).toContain('Repeatable');
    expect(renderedText).toContain('Shared with 1 other monster');
    expect(renderedText).not.toContain('Minimum level:');
    expect(renderedText).not.toContain('Job:');
    expect(html).toContain('Synthetic Tonic');
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/maplestory/monsters"');
    expect(html).toContain(
      `<link rel="canonical" href="${SITE_ORIGIN}/maplestory/monsters/sentinel-shellback-36z2h01p"/>`,
    );
    expect(html).toContain('application/ld+json');
    expect(html).toContain('BreadcrumbList');
    expect(html).toContain(
      'Sentinel Shellback – MapleStory Classic World Monster – MapleTip',
    );
  });
});
