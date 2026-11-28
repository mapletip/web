import { MantineProvider } from '@mantine/core';
import type {
  ItemBrowseRecordV2_2,
  ItemBrowseRowV2_2,
  ItemRelatedEntityBrowsePack,
} from '@mapletip/data/items';
import { getItemRelatedEntities } from '@mapletip/data/items';
import { openRelease } from '@mapletip/data/release';
import { theme } from '@mapletip/theme';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { gzipSync } from 'node:zlib';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BuildId } from '@/config/maplekit';
import { fixtureRelease } from '@/mocks/release';
import { routeTree } from '@/routeTree.gen';

import { ITEM_KINDS } from '../../kinds';
import { renderItemCard } from '../item-card';
import {
  ITEM_BROWSE_UNAVAILABLE_MESSAGE,
  loadItemBrowse,
  type LoadedItemBrowse,
} from '../load';
import { ITEM_GROUPS, itemPath } from '../page';
import { projectItemBrowseRows } from '../project';

vi.mock('../load', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../load')>();
  return { ...actual, loadItemBrowse: vi.fn() };
});

vi.mock(import('@mapletip/data/items'), async (original) => ({
  ...(await original()),
  getItemRelatedEntities: vi.fn(),
}));

vi.mock(import('@mapletip/data/release'), async (original) => ({
  ...(await original()),
  openRelease: vi.fn(),
}));

const mockedLoad = vi.mocked(loadItemBrowse);
const mockedRelations = vi.mocked(getItemRelatedEntities);
const mockedOpenRelease = vi.mocked(openRelease);

function fixtureRelation(
  buildId: BuildId,
  kind: 'needed-for-quest' | 'used-in-recipe' | 'monster-drop',
): ItemRelatedEntityBrowsePack {
  const descriptor =
    fixtureRelease.builds.get(buildId)?.itemRelatedEntityBrowse[kind];
  if (!descriptor) throw new Error(`Missing quest roster for ${buildId}`);
  const bytes = fixtureRelease.files.get(descriptor.path);
  if (!bytes) throw new Error(`Missing quest roster bytes for ${buildId}`);
  return JSON.parse(
    new TextDecoder().decode(bytes),
  ) as ItemRelatedEntityBrowsePack;
}

function fixtureBrowse(buildId: BuildId): LoadedItemBrowse {
  const descriptor = fixtureRelease.builds.get(buildId)?.itemBrowse;
  if (!descriptor) throw new Error(`Missing browse pack for ${buildId}`);
  const bytes = fixtureRelease.files.get(descriptor.path);
  if (!bytes) throw new Error(`Missing fixture file for ${buildId}`);
  const pack = JSON.parse(new TextDecoder().decode(bytes)) as {
    coverage: LoadedItemBrowse['coverage'];
    scrollTargetIcons: LoadedItemBrowse['scrollTargetIcons'];
    records: Record<string, ItemBrowseRecordV2_2 | undefined>;
  };
  const records = Object.entries(pack.records).flatMap(
    ([key, record]): ItemBrowseRowV2_2[] =>
      record ? [{ ...record, key }] : [],
  );
  return {
    rows: projectItemBrowseRows(records),
    coverage: pack.coverage,
    scrollTargetIcons: pack.scrollTargetIcons,
  };
}

function fixtureDescriptions(
  buildId: BuildId,
): Readonly<Record<string, string>> {
  const descriptor = fixtureRelease.builds.get(buildId)?.itemDescriptions;
  if (!descriptor) throw new Error(`Missing description pack for ${buildId}`);
  const bytes = fixtureRelease.files.get(descriptor.path);
  if (!bytes) throw new Error(`Missing description bytes for ${buildId}`);
  const pack = JSON.parse(new TextDecoder().decode(bytes)) as {
    readonly records: Readonly<Record<string, string>>;
  };
  return pack.records;
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

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;');
}

function mainHtml(html: string): string {
  const match = /<main[^>]*id="main-content"[^>]*>([\s\S]*?)<\/main>/u.exec(
    html,
  );
  if (!match?.[1]) throw new Error('Expected main#main-content in SSR HTML');
  return match[1];
}

function anchorInnerHtml({
  html,
  href,
}: {
  readonly html: string;
  readonly href: string;
}): string | undefined {
  const pattern = new RegExp(
    `<a[^>]*href="${escapeRegExp(href)}"[^>]*>([\\s\\S]*?)</a>`,
    'u',
  );
  return pattern.exec(html.replaceAll('<!-- -->', ''))?.[1];
}

describe('Items Browse server rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedLoad.mockImplementation((buildId) =>
      Promise.resolve(fixtureBrowse(buildId)),
    );
    mockedRelations.mockImplementation(({ buildId, kind }) =>
      Promise.resolve(
        fixtureRelation(
          buildId === 'gms-v83' ? 'gms-v83' : 'cw-launch',
          kind as 'needed-for-quest' | 'used-in-recipe' | 'monster-drop',
        ),
      ),
    );
    mockedOpenRelease.mockResolvedValue({
      openItemBuild: vi.fn((buildId: BuildId) =>
        Promise.resolve({
          loadDescriptions: vi.fn(() =>
            Promise.resolve(fixtureDescriptions(buildId)),
          ),
        }),
      ),
    } as never);
  });

  it('renders Quest Items with a named quest in the first response', async () => {
    const { html } = await renderPath('/maplestory/items/etc/quest-items');
    expect(mainHtml(html).replaceAll('<!-- -->', '')).toContain(
      'For the quest ',
    );
    expect(mainHtml(html)).toContain('Thread Trial');
    expect(mainHtml(html)).toContain('Search quests');
  });

  it('renders Monster Drops labels and the complete-coverage lookup in the first response', async () => {
    const category = await renderPath('/maplestory/items/etc/monster-drops');
    expect(mainHtml(category.html)).toContain(
      'data-record-card-layout="quietIdentity"',
    );
    expect(mainHtml(category.html)).toContain('Sells for');
    expect(mainHtml(category.html)).toContain('Not required');
    expect(mainHtml(category.html)).toContain('Required by quests');
    expect(mainHtml(category.html)).toContain('Used in recipes');
    expect(mainHtml(category.html)).not.toMatch(/Required by \d+ quests/u);
    expect(mainHtml(category.html)).not.toMatch(/Used in \d+ recipes/u);

    const landing = await renderPath('/maplestory/items');
    const lookup =
      /<a[^>]*href="[^"]*dropUses[^"]*"[^>]*>[\s\S]*?Drops no quest or recipe uses[\s\S]*?<span[^>]*>(\d+)<\/span>[\s\S]*?<\/a>/u.exec(
        mainHtml(landing.html),
      );
    expect(lookup?.[1]).toBeDefined();
    expect(Number(lookup?.[1])).toBeGreaterThan(0);
  });

  it('renders identical items as one card in the first response', async () => {
    const { html } = await renderPath(
      '/maplestory/items/use/potions-and-food?q=Silverleaf%20Draught',
    );
    const main = mainHtml(html).replaceAll('<!-- -->', '');
    expect(main).toContain('1 Item');
    expect(main).toContain('2 versions');
    expect(main.match(/>Silverleaf Draught<\/button>/gu)).toHaveLength(1);
  });

  it('renders both published relationship lookups and all-items filters', async () => {
    const landing = await renderPath('/maplestory/items');
    const landingMain = mainHtml(landing.html);
    expect(landingMain).toContain('Items a quest requires');
    expect(landingMain).toContain('Items a monster drops');

    const all = await renderPath('/maplestory/items/all');
    const allMain = mainHtml(all.html);
    expect(allMain).toContain('Search quests');
    expect(allMain).toContain('Search monsters');
  });

  it('hides the Monster lookup and filter when the build does not publish drops', async () => {
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const landing = await renderPath('/maplestory/gms-v83/items');
    expect(mainHtml(landing.html)).not.toContain('Items a monster drops');

    const all = await renderPath('/maplestory/gms-v83/items/all');
    expect(mainHtml(all.html)).not.toContain('Search monsters');
    errorSpy.mockRestore();
  });

  it('keeps the Monster lookup when the quest roster fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedRelations.mockImplementation(({ buildId, kind }) => {
      if (kind === 'needed-for-quest')
        return Promise.reject(new Error('Fixture roster unavailable'));
      if (kind === 'monster-drop')
        return Promise.resolve(
          fixtureRelation(
            buildId === 'gms-v83' ? 'gms-v83' : 'cw-launch',
            'monster-drop',
          ),
        );
      return Promise.reject(new Error('Unexpected fixture relationship kind'));
    });

    const { html } = await renderPath('/maplestory/items');
    const main = mainHtml(html);
    expect(main).not.toContain('Items a quest requires');
    expect(main).toContain('Items a monster drops');
    expect(main).toContain('Crafting ingredients');
  });

  it('filters cross-category results by a published quest', async () => {
    const questRoster = fixtureRelation('cw-launch', 'needed-for-quest');
    if (questRoster.relationshipKind !== 'needed-for-quest')
      throw new Error('Expected the quest requirement roster');
    const questTarget = questRoster.targets.find(
      ({ displayName }) => displayName === 'Thread Trial',
    );
    if (
      questTarget === undefined ||
      !('publicId' in questTarget) ||
      typeof questTarget.publicId !== 'string'
    )
      throw new Error('Missing the fixture quest public id');
    const questPublicId = questTarget.publicId;
    const questFilter = encodeURIComponent(JSON.stringify([questPublicId]));
    const { router, html } = await renderPath(
      `/maplestory/items/all?quest=${questFilter}`,
    );
    expect(router.state.location.search).toMatchObject({
      quest: [questPublicId],
    });
    const main = mainHtml(html);
    expect(main).toContain('Many Quest Token');
    expect(main).not.toContain('Practice Cap');
    expect(main).toContain('Remove Quest: Thread Trial');
  });

  it.each([
    ['cw-launch', '/maplestory/items/etc/monster-drops'],
    ['gms-v83', '/maplestory/gms-v83/items/etc/monster-drops'],
  ] as const)(
    'keeps %s Monster Drops below 650 KB gzipped',
    async (_buildId, path) => {
      const { html } = await renderPath(path);
      const bytes = gzipSync(html).byteLength;
      expect(bytes).toBeLessThan(650 * 1024);
    },
  );

  it('keeps Quest Items counts when the roster fails and removes the Quest picker', async () => {
    mockedRelations.mockRejectedValue(new Error('Fixture roster unavailable'));
    const { html } = await renderPath('/maplestory/items/etc/quest-items');
    expect(mainHtml(html)).toContain('For 2 quests');
    expect(mainHtml(html)).not.toContain('Search quests');
  });

  it('renders a category with its heading, cards, drill-down rail and indexable metadata', async () => {
    const { router, html } = await renderPath('/maplestory/items/use/scrolls');
    const rail = railHtml(html);

    expect(mainHtml(html)).toContain('data-record-card-layout="identity"');
    expect(html).toMatch(/<h1[^>]*>MapleStory Classic World Scrolls<\/h1>/u);
    expect(html).toContain('Unsorted Practice Scroll');
    expect(mainHtml(html)).toContain('One Handed Sword');
    expect(mainHtml(html)).toContain('can destroy item');
    expect(mainHtml(html)).toContain('+3 magic defense');
    expect(mainHtml(html)).toContain('+2 weapon defense');
    expect(mainHtml(html)).toContain('5 Items');
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
    expect(mainHtml(html)).toContain('+1 dexterity');
    expect(mainHtml(html)).toContain('2 Items');
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

  it('renders chair recovery in the first response', async () => {
    const { html } = await renderPath('/maplestory/items/setup/chairs');
    expect(mainHtml(html)).toContain(
      'data-record-card-layout="compactMediaAside"',
    );
    expect(mainHtml(html)).toContain('Amber Seat');
    expect(mainHtml(html)).toContain('+50 HP');
    expect(mainHtml(html)).toContain('Recovers HP');
  });

  it('renders potion effects and pills in the first response', async () => {
    const { html } = await renderPath('/maplestory/items/use/potions-and-food');
    const main = mainHtml(html);
    expect(main).toContain('Practice Tonic A');
    expect(main).toContain('+300 HP');
    expect(main).toContain('Restores HP');
    expect(main).toContain('Restores MP');
    expect(main).toContain('Buff stat');
    expect(main).toContain('data-record-card-layout="compactMediaAside"');
  });

  it('renders an Other Use description in the first response', async () => {
    const { html } = await renderPath('/maplestory/items/use/other-use');
    const main = mainHtml(html);
    expect(main).toContain('Plain Use Item');
    expect(main).toMatch(/<span[^>]*>Double-click<\/span>/u);
    expect(main).toMatch(
      /<span[^>]*font-weight:600[^>]*>Double-click<\/span>/u,
    );
    expect(main).toContain(
      'to open the practice box. A small surprise waits inside.',
    );
    expect(main).not.toContain('#c');
    expect(main).not.toContain('\\n');
    expect(main).toContain('data-record-card-layout="compactMediaAside"');
  });

  it('renders Ores & Gems identity cards and ore-first order in the first response', async () => {
    const { html } = await renderPath('/maplestory/items/etc/ores-and-gems');
    const main = mainHtml(html);
    expect(main).toContain('data-record-card-layout="quietIdentity"');
    expect(main).toContain('Lamplight Ore');
    expect(main.indexOf('Lamplight Ore')).toBeLessThan(
      main.indexOf('Woven Thread'),
    );
    expect(main).toContain('Required by quests');
  });

  it('renders each projectile category and its class description', async () => {
    const cw = await renderPath('/maplestory/items/use/throwing-stars');
    const cwMain = mainHtml(cw.html);
    expect(cwMain).toContain('Practice Stars');
    expect(cwMain).toContain('+27 attack');
    expect(cwMain).toContain('800 per stack');
    expect(cwMain).not.toContain('Silent Arrow');
    expect(cwMain).toContain('Used by Thieves with a claw.');
    expect(cwMain).toContain('data-record-card-layout="compactMediaAside"');

    const gms = await renderPath('/maplestory/gms-v83/items/use/bullets');
    const gmsMain = mainHtml(gms.html);
    expect(gmsMain).toContain('GMS Practice Bullet');
    expect(gmsMain).toContain('Used by Pirates with a gun.');

    const arrows = mainHtml(
      (await renderPath('/maplestory/items/use/arrows')).html,
    );
    expect(arrows).toContain('Silent Arrow');
    expect(arrows).toContain('2,000 per stack');
    expect(arrows).toContain(
      'Used by Bowmen. Bows and crossbows each take their own arrows.',
    );
    expect(arrows).not.toContain('Practice Stars');

    const desc = await renderPath(
      '/maplestory/items/use/throwing-stars?sort=attack-desc',
    );
    const descMain = mainHtml(desc.html);
    expect(descMain.indexOf('Practice Stars')).toBeLessThan(
      descMain.indexOf('Training Stars'),
    );

    const asc = await renderPath(
      '/maplestory/items/use/throwing-stars?sort=attack-asc',
    );
    const ascMain = mainHtml(asc.html);
    expect(ascMain.indexOf('Training Stars')).toBeLessThan(
      ascMain.indexOf('Practice Stars'),
    );
  });

  it('renders Monster Cards with their buff in the second fixture build', async () => {
    const { html } = await renderPath(
      '/maplestory/gms-v83/items/use/monster-cards',
    );
    const main = mainHtml(html);
    expect(main).toContain('GMS Native Alpha Card');
    expect(main).toContain('+5 weapon attack');
    expect(main).toContain('Lasts 30 minutes');
    expect(main).toContain('data-record-card-layout="compactMediaAside"');
  });

  it.each(['hp', 'mp'] as const)(
    'sorts flat %s amounts before percentage and absent values in both directions',
    async (field) => {
      for (const direction of ['asc', 'desc'] as const) {
        const { html } = await renderPath(
          `/maplestory/items/use/potions-and-food?sort=${field}-${direction}`,
        );
        const main = mainHtml(html);
        const flatNames =
          field === 'hp'
            ? ['Practice Tonic A', 'Sample Draught']
            : ['Practice Tonic B', 'Sample Draught'];
        for (const name of flatNames) {
          expect(main.indexOf(name)).toBeGreaterThan(-1);
          expect(main.indexOf(name)).toBeLessThan(
            main.indexOf('Percentage Recovery Tonic'),
          );
          expect(main.indexOf(name)).toBeLessThan(main.indexOf('Quiet Potion'));
        }
      }
    },
  );

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

  it('renders /items/all with category pills, quest filters, primary facts and noindex', async () => {
    const { router, html } = await renderPath('/maplestory/items/all');
    const text = html.replaceAll('<!-- -->', '');

    expect(html).toMatch(/<h1[^>]*>MapleStory Classic World Items<\/h1>/u);
    expect(text).toContain('Category choices');
    expect(text).toContain('Required by quests');
    expect(text).toContain('Used in recipes');
    expect(text).toContain('Quest reward');
    expect(text).toContain('Scrolls (');
    expect(text).toContain('Monster Drops (');
    // Cross-category results use a short card with category and fact in one line.
    expect(html).toContain('data-record-card-layout="compactMediaAside"');
    expect(html).not.toMatch(
      /data-record-card-layout="(identity|quietIdentity|picture)"/u,
    );
    expect(text).toMatch(/Quest Items · For \d+ quests/u);
    expect(headMeta(router)).toContainEqual({
      name: 'robots',
      content: 'noindex,follow',
    });
    expect(canonical(router)).toEqual({
      rel: 'canonical',
      href: 'https://mapletip.com/maplestory/items/all',
    });
  });

  it('shows only the category in the cross-category quiet line when no fact is published', () => {
    const chair = fixtureBrowse('cw-launch').rows.find(
      (row) => row.kind === 'chairs',
    );
    if (chair === undefined) throw new Error('Missing chair fixture');
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        {renderItemCard({ record: chair, crossCategory: true })}
      </MantineProvider>,
    );
    expect(html).toContain('data-record-card-layout="compactMediaAside"');
    expect(html).toMatch(/>Chairs<\/p>/u);
    expect(html).not.toContain(' · ');
  });

  it('matches exact source id on /items/all without showing it on the card and updates rail counts', async () => {
    const { router, html } = await renderPath(
      '/maplestory/items/all?q=only-given',
    );

    expect(html).toContain('Only Given Pebble');
    expect(html).not.toContain('Pebble Shard 01');
    expect(headMeta(router)).toContainEqual({
      name: 'robots',
      content: 'noindex,follow',
    });
  });

  it.each([
    ['cw-launch', '/maplestory/items', 'MapleStory Classic World Items', 1],
    ['gms-v83', '/maplestory/gms-v83/items', 'MapleStory GMS v83 Items', 0],
  ] as const)(
    'renders the %s landing directory with every non-empty category link, counts and no item list',
    async (buildId, path, expectedHeading, minCraftingCount) => {
      const browse = fixtureBrowse(buildId);
      const { html } = await renderPath(path);
      const main = mainHtml(html);

      expect(main).toMatch(
        new RegExp(`<h1[^>]*>${escapeRegExp(expectedHeading)}</h1>`, 'u'),
      );
      expect(anchorInnerHtml({ html: main, href: '/' })).toContain('Home');

      const countsByKind = new Map<string, number>();
      const countsByGroup = new Map<string, number>();
      for (const row of browse.rows) {
        countsByKind.set(row.kind, (countsByKind.get(row.kind) ?? 0) + 1);
        const groupId = row.kindPath[1];
        countsByGroup.set(groupId, (countsByGroup.get(groupId) ?? 0) + 1);
      }

      for (const group of ITEM_GROUPS) {
        const groupHref = itemPath({ buildId, group: group.id });
        const inner = anchorInnerHtml({ html: main, href: groupHref });
        expect(inner).toBeDefined();
        expect(inner).toContain(escapeHtml(group.label));
        expect(inner).toContain(String(countsByGroup.get(group.id) ?? 0));
      }

      const nonEmptyKinds = ITEM_KINDS.filter(
        (kind) => (countsByKind.get(kind.id) ?? 0) > 0,
      );
      expect(nonEmptyKinds.length).toBeGreaterThan(0);

      for (const kind of nonEmptyKinds) {
        const count = countsByKind.get(kind.id) ?? 0;
        const kindHref = itemPath({
          buildId,
          group: kind.group,
          kind: kind.slug,
        });
        const inner = anchorInnerHtml({ html: main, href: kindHref });
        expect(inner).toBeDefined();
        expect(inner).toContain(escapeHtml(kind.label));
        expect(inner).toContain(String(count));
        expect(inner).toContain('<img');
      }

      const emptyKinds = ITEM_KINDS.filter(
        (kind) => (countsByKind.get(kind.id) ?? 0) === 0,
      );
      for (const kind of emptyKinds) {
        const kindHref = itemPath({
          buildId,
          group: kind.group,
          kind: kind.slug,
        });
        expect(anchorInnerHtml({ html: main, href: kindHref })).toBeUndefined();
      }

      for (const row of browse.rows) {
        expect(main).not.toContain(row.name);
      }

      const craftingCount = browse.rows.filter(
        (row) => (row.usedInRecipeCount ?? 0) > 0,
      ).length;
      expect(craftingCount).toBeGreaterThanOrEqual(minCraftingCount);
      const craftingHref = `${itemPath({ buildId })}/all?usedInRecipes=true`;
      const craftingInner = anchorInnerHtml({ html: main, href: craftingHref });
      expect(craftingInner).toBeDefined();
      expect(craftingInner).toContain('Crafting ingredients');
      expect(craftingInner).toContain(String(craftingCount));
    },
  );

  it('hides the Crafting ingredients lookup and Used in recipes filter when used-in-recipe is unsupported', async () => {
    const base = fixtureBrowse('cw-launch');
    mockedLoad.mockResolvedValue({
      ...base,
      coverage: {
        ...base.coverage,
        relationships: {
          ...base.coverage.relationships,
          'used-in-recipe': 'unsupported',
        },
      },
    });

    const landing = await renderPath('/maplestory/items');
    expect(mainHtml(landing.html)).not.toContain('Crafting ingredients');

    const all = await renderPath('/maplestory/items/all');
    expect(mainHtml(all.html)).not.toContain('Used in recipes');
  });

  it('filters /items/all to items used in recipes when usedInRecipes=true', async () => {
    const { html } = await renderPath(
      '/maplestory/items/all?usedInRecipes=true',
    );
    const main = mainHtml(html);

    expect(main).toContain('Woven Thread');
    expect(main).not.toContain('Sample Draught');
  });

  it.each([
    ['cw-launch', '/maplestory/items'],
    ['gms-v83', '/maplestory/gms-v83/items'],
  ] as const)(
    'omits empty categories from the %s landing directory',
    async (buildId, path) => {
      const base = fixtureBrowse(buildId);
      const filteredRows = base.rows.filter(
        (row) => row.kind !== 'monster-cards' && row.kind !== 'boxes',
      );
      mockedLoad.mockResolvedValue({ ...base, rows: filteredRows });

      const { html } = await renderPath(path);
      const main = mainHtml(html);

      expect(
        anchorInnerHtml({
          html: main,
          href: itemPath({ buildId, group: 'use', kind: 'monster-cards' }),
        }),
      ).toBeUndefined();
      expect(
        anchorInnerHtml({
          html: main,
          href: itemPath({ buildId, group: 'use', kind: 'boxes' }),
        }),
      ).toBeUndefined();
      expect(main).not.toContain('Monster Cards');
      expect(main).not.toContain('Boxes');

      const useCount = filteredRows.filter(
        (row) => row.kindPath[1] === 'use',
      ).length;
      expect(
        anchorInnerHtml({
          html: main,
          href: itemPath({ buildId, group: 'use' }),
        }),
      ).toContain(String(useCount));
    },
  );

  it.each(
    (['cw-launch', 'gms-v83'] as const).flatMap((buildId) =>
      ITEM_GROUPS.map((group) => [buildId, group.id, group.label] as const),
    ),
  )(
    'renders %s group page %s with scoped category pills and cross-category cards',
    async (buildId, groupId, groupLabel) => {
      const { router, html } = await renderPath(
        itemPath({ buildId, group: groupId }),
      );
      const main = mainHtml(html).replaceAll('<!-- -->', '');
      const availableKinds = new Set(
        fixtureBrowse(buildId).rows.map((row) => row.kind),
      );
      const groupKinds = ITEM_KINDS.filter(
        (kind) => kind.group === groupId && availableKinds.has(kind.id),
      );
      const otherKinds = ITEM_KINDS.filter((kind) => kind.group !== groupId);

      expect(isNotFound(router)).toBe(false);
      expect(main).toContain(escapeHtml(groupLabel));
      expect(main).toContain('Category choices');
      expect(main).toContain('data-record-card-layout="compactMediaAside"');
      for (const kind of groupKinds) {
        expect(main).toContain(`${escapeHtml(kind.label)} (`);
      }
      for (const kind of otherKinds) {
        expect(main).not.toContain(`${escapeHtml(kind.label)} (`);
      }
      expect(main).not.toContain('items-shelf-');
    },
  );

  it('shows items from multiple ETC categories and omits empty category pills', async () => {
    const base = fixtureBrowse('cw-launch');
    const { html } = await renderPath('/maplestory/items/etc');
    const main = mainHtml(html);
    expect(main).toContain('Lamplight Ore');
    expect(main).toContain('Only Given Pebble');

    mockedLoad.mockResolvedValue({
      ...base,
      rows: base.rows.filter((row) => row.kind !== 'quest-items'),
    });
    const filtered = mainHtml((await renderPath('/maplestory/items/etc')).html);
    expect(filtered).not.toContain('Quest Items (');
    expect(filtered).not.toContain('/maplestory/items/etc/quest-items');
  });

  it('shows the generic unavailable state when item data fails to load', async () => {
    mockedLoad.mockRejectedValue(new Error(ITEM_BROWSE_UNAVAILABLE_MESSAGE));

    const { html } = await renderPath('/maplestory/items/use/scrolls');

    expect(html).toContain('Something went wrong');
    expect(html).toContain('Try again');
    expect(html).not.toContain('v2/items');
  });
});
