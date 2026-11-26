import type {
  ItemBrowseCoverage,
  ItemBrowseRecordV2_2,
} from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { fixtureRelease } from '../release';
import { spriteResponse } from '../sprites';
import {
  FIXTURE_EVIDENCE_KINDS,
  spriteDimensions,
  world,
  type FixtureBuild,
  type FixtureEvidenceKind,
  type FixtureItem,
  type FixtureQuestRole,
  type SpriteCase,
} from '../world';

type BuildId = 'cw-launch' | 'gms-v83';
interface FixtureItemBrowsePack {
  readonly coverage: ItemBrowseCoverage;
  readonly records: Record<string, ItemBrowseRecordV2_2 | undefined>;
  readonly scrollTargetIcons: Readonly<Record<string, string>>;
}

function buildFor(buildId: BuildId): FixtureBuild {
  const build = world.builds.find((candidate) => candidate.buildId === buildId);
  if (build === undefined) throw new Error(`Missing fixture build ${buildId}.`);
  return build;
}

function itemFor(buildId: BuildId, itemId: string): FixtureItem | undefined {
  return buildFor(buildId).items.find(({ id }) => id === itemId);
}

function browsePack(buildId: BuildId): FixtureItemBrowsePack {
  const descriptor = fixtureRelease.builds.get(buildId)?.itemBrowse;
  if (descriptor === undefined) {
    throw new Error(`Missing fixture Items browse pack for ${buildId}.`);
  }
  const bytes = fixtureRelease.files.get(descriptor.path);
  if (bytes === undefined)
    throw new Error(`Missing fixture file ${descriptor.path}.`);
  return JSON.parse(new TextDecoder().decode(bytes)) as FixtureItemBrowsePack;
}

function rowFor(
  buildId: BuildId,
  sourceId: string,
): ItemBrowseRecordV2_2 | undefined {
  return Object.values(browsePack(buildId).records).find(
    (record) => record?.sourceId === sourceId,
  );
}

function itemHasType(item: FixtureItem | undefined, type: string): boolean {
  return (
    item?.types?.includes(type as NonNullable<FixtureItem['types']>[number]) ??
    false
  );
}

function hasFunction(item: FixtureItem | undefined, value: string): boolean {
  return (
    item?.functions?.includes(
      value as NonNullable<FixtureItem['functions']>[number],
    ) ?? false
  );
}

function knownSellPrice(item: FixtureItem | undefined): number | undefined {
  return item?.sellPrice?.state === 'known' ? item.sellPrice.value : undefined;
}

function coversAllCategories(buildId: BuildId): boolean {
  const items = buildFor(buildId).items.filter(
    (item) => item.name !== undefined && item.itemClass.state === 'known',
  );
  const has = (predicate: (item: FixtureItem) => boolean) =>
    items.some(predicate);
  const hasClass = (itemClass: string) =>
    has(
      (item) =>
        item.itemClass.state === 'known' && item.itemClass.value === itemClass,
    );
  const hasType = (type: string): boolean =>
    has((item) => itemHasType(item, type));
  const hasFunctionType = (fn: string) => has((item) => hasFunction(item, fn));

  const useCategories =
    hasType('upgrade-scroll') &&
    (hasType('throwing-star') || hasType('arrow') || hasType('bullet')) &&
    hasFunctionType('monster-card') &&
    hasFunctionType('skill') &&
    hasFunctionType('summon') &&
    hasFunctionType('reward-container') &&
    (hasType('potion') || hasType('food-buff')) &&
    has((item) => {
      if (
        item.itemClass.state !== 'known' ||
        item.itemClass.value !== 'consume'
      ) {
        return false;
      }
      const matchedTypes = [
        'upgrade-scroll',
        'throwing-star',
        'arrow',
        'bullet',
        'pet-food',
        'potion',
        'food-buff',
        'meso-pouch',
      ];
      const matchedFunctions = [
        'recovery',
        'monster-card',
        'skill',
        'summon',
        'reward-container',
      ];
      return (
        !item.types?.some((type) => matchedTypes.includes(type)) &&
        !item.functions?.some((fn) => matchedFunctions.includes(fn))
      );
    });
  const etcCategories =
    (hasType('ore') || hasType('gem') || hasType('refined-material')) &&
    hasType('monster-material') &&
    has(
      (item) =>
        item.itemClass.state === 'known' &&
        item.itemClass.value === 'etc' &&
        item.questFlag === true &&
        !item.types?.includes('monster-material'),
    ) &&
    has(
      (item) =>
        item.itemClass.state === 'known' &&
        item.itemClass.value === 'etc' &&
        item.types === undefined,
    );
  const setupCategories =
    hasType('chair') &&
    (hasType('furniture') || hasType('crafting-station')) &&
    hasType('holiday-ornament') &&
    has(
      (item) =>
        item.itemClass.state === 'known' &&
        item.itemClass.value === 'setup' &&
        item.types === undefined,
    );
  const petsAndCashCategories =
    hasClass('pet') && hasType('pet-food') && hasClass('cash');

  return (
    useCategories && etcCategories && setupCategories && petsAndCashCategories
  );
}

interface ItemCase {
  readonly name: string;
  readonly matches: () => boolean;
}

const roles: readonly FixtureQuestRole[] = [
  'turned-in',
  'held-to-complete',
  'held-to-start',
  'must-not-be-held',
  'pet',
  'monster-card',
  'not-established',
];

const iconCases: readonly {
  readonly itemId: string;
  readonly sprite: SpriteCase;
}[] = [
  { itemId: 'pebble-token', sprite: 'missing' },
  { itemId: 'practice-tonic-a', sprite: 'small' },
  { itemId: 'practice-tonic-b', sprite: 'exact' },
  { itemId: 'sample-draught', sprite: 'large' },
  { itemId: 'practice-lantern', sprite: 'wide' },
  { itemId: 'training-banner', sprite: 'tall' },
];

const itemCases: readonly ItemCase[] = [
  {
    name: 'an unnamed item that is never listed',
    matches: () => {
      const unnamed = buildFor('cw-launch').items.find(
        ({ name }) => name === undefined,
      );
      const pack = browsePack('cw-launch');
      return (
        unnamed !== undefined &&
        !Object.values(pack.records).some(
          (record) => record?.sourceId === unnamed.id,
        ) &&
        Object.keys(pack.records).length ===
          buildFor('cw-launch').items.filter(
            (item) =>
              item.name !== undefined &&
              item.category.kind === 'item-class' &&
              item.itemClass.state === 'known',
          ).length
      );
    },
  },
  {
    name: 'two items with the same name',
    matches: () =>
      buildFor('cw-launch').items.filter(({ name }) => name === 'Sample Charm')
        .length === 2,
  },
  {
    name: 'a name long enough to wrap on every card',
    matches: () =>
      buildFor('cw-launch').items.some(
        ({ name }) => name !== undefined && name.length >= 55,
      ),
  },
  {
    name: 'icons that are missing, smaller than, equal to and larger than their box, wide, and tall',
    matches: () =>
      iconCases.every(({ itemId, sprite }) => {
        const item = itemFor('cw-launch', itemId);
        const row = rowFor('cw-launch', itemId);
        if (item?.sprite !== sprite || row?.icon.state !== 'known')
          return false;
        const response = spriteResponse(row.icon.value);
        if (sprite === 'missing') return response.status === 404;
        const [width, height] = spriteDimensions[sprite];
        return (
          response.status === 200 &&
          response.body.includes(`width="${width}" height="${height}"`)
        );
      }),
  },
  {
    name: 'a family with every tier',
    matches: () => {
      const tiers = buildFor('cw-launch')
        .items.filter(({ family }) => family === 'practice-sword-scrolls')
        .map(({ scroll }) => scroll?.tier)
        .sort();
      return tiers.join(',') === 'chaos,greater,intermediate,lesser';
    },
  },
  {
    name: 'a family with two stats',
    matches: () =>
      buildFor('cw-launch').items.some(
        ({ family, scroll }) =>
          family === 'practice-shield-scrolls' &&
          scroll?.deltas?.weaponDefense === 2 &&
          scroll.deltas.magicDefense === 3,
      ),
  },
  {
    name: 'a tier that can destroy the item',
    matches: () =>
      buildFor('cw-launch').items.some(
        ({ scroll }) => scroll?.tier !== undefined && (scroll.cursed ?? 0) > 0,
      ),
  },
  {
    name: 'a scroll without a published equipment type',
    matches: () =>
      buildFor('cw-launch').items.some(
        ({ types, scroll }) =>
          types?.includes('upgrade-scroll') &&
          scroll?.targetLabel === undefined,
      ),
  },
  {
    name: 'in the second build, scrolls without tiers',
    matches: () => {
      const items = buildFor('gms-v83').items.filter(({ types }) =>
        types?.includes('upgrade-scroll'),
      );
      return (
        items.length > 0 &&
        items.every(({ scroll }) => scroll?.tier === undefined) &&
        browsePack('gms-v83').coverage.scrollTier === 'unsupported'
      );
    },
  },
  {
    name: 'flat HP',
    matches: () =>
      buildFor('cw-launch').items.some(
        ({ recovery }) => (recovery?.hp ?? 0) > 0,
      ),
  },
  {
    name: 'flat MP',
    matches: () =>
      buildFor('cw-launch').items.some(
        ({ recovery }) => (recovery?.mp ?? 0) > 0,
      ),
  },
  {
    name: 'both HP and MP',
    matches: () =>
      buildFor('cw-launch').items.some(
        ({ recovery }) => (recovery?.hp ?? 0) > 0 && (recovery?.mp ?? 0) > 0,
      ),
  },
  {
    name: 'percentages',
    matches: () =>
      buildFor('cw-launch').items.some(
        ({ recovery }) =>
          (recovery?.hpPercent ?? 0) > 0 || (recovery?.mpPercent ?? 0) > 0,
      ),
  },
  {
    name: 'a buff with a duration',
    matches: () =>
      buildFor('cw-launch').items.some(
        ({ buff }) =>
          buff !== undefined &&
          (buff.durationSeconds ?? 0) > 0 &&
          buff.effects.length > 0,
      ),
  },
  {
    name: 'a projectile with and without attack',
    matches: () => {
      const projectiles = buildFor('cw-launch').items.filter(({ types }) =>
        types?.some((type) =>
          ['throwing-star', 'arrow', 'bullet'].includes(type),
        ),
      );
      return (
        projectiles.some(
          ({ projectileAttack }) => projectileAttack?.state === 'known',
        ) &&
        projectiles.some(
          ({ projectileAttack }) => projectileAttack?.state !== 'known',
        )
      );
    },
  },
  {
    name: 'a potion with no published effect',
    matches: () =>
      buildFor('cw-launch').items.some(
        ({ types, recovery, buff }) =>
          types?.includes('potion') &&
          recovery === undefined &&
          buff === undefined,
      ),
  },
  {
    name: 'an item required by one quest',
    matches: () =>
      rowFor('cw-launch', 'turn-in-stamp')?.relationships?.[
        'needed-for-quest'
      ] === 1,
  },
  {
    name: 'an item required by many quests',
    matches: () =>
      rowFor('cw-launch', 'many-quest-token')?.relationships?.[
        'needed-for-quest'
      ] === 2,
  },
  {
    name: 'an item used in recipes',
    matches: () =>
      rowFor('cw-launch', 'sample-charm-a')?.relationships?.[
        'used-in-recipe'
      ] === 2,
  },
  {
    name: 'an item used by both a quest and a recipe',
    matches: () => {
      const relationships = rowFor('cw-launch', 'woven-thread')?.relationships;
      return (
        relationships?.['needed-for-quest'] === 1 &&
        relationships['used-in-recipe'] === 1
      );
    },
  },
  {
    name: 'an item used by neither a quest nor a recipe',
    matches: () => {
      const relationships = rowFor('cw-launch', 'warden-token')?.relationships;
      return (
        relationships?.['needed-for-quest'] === undefined &&
        relationships?.['used-in-recipe'] === undefined
      );
    },
  },
  {
    name: 'dropped by one monster',
    matches: () => {
      const drops = buildFor('gms-v83').drops;
      return (
        Object.values(drops)
          .flat()
          .filter(({ itemId }) => itemId === 'native-flake').length === 1
      );
    },
  },
  {
    name: 'dropped by more than the drawer first shows',
    matches: () =>
      Object.values(buildFor('cw-launch').drops).filter((drops) =>
        drops.some(({ itemId }) => itemId === 'pebble-shard-01'),
      ).length > 6,
  },
  {
    name: 'dropped by none',
    matches: () =>
      !Object.values(buildFor('cw-launch').drops)
        .flat()
        .some(({ itemId }) => itemId === 'plain-use-item'),
  },
  {
    name: 'drops with native evidence only',
    matches: () => {
      const drop = buildFor('gms-v83').drops['native-alpha']?.find(
        ({ itemId }) => itemId === 'native-flake',
      );
      return drop?.evidence.length === 1 && drop.evidence[0]?.kind === 'native';
    },
  },
  {
    name: "drops with another build's files",
    matches: () =>
      buildFor('cw-launch').drops['crowned-warden']?.some((drop) =>
        drop.evidence.some(
          ({ kind, build }) =>
            kind === 'historical-overlay' && build === 'gms-v83',
        ),
      ) ?? false,
  },
  {
    name: 'a VOD with a URL and start time',
    matches: () =>
      world.builds.some((build) =>
        Object.values(build.drops)
          .flat()
          .some((drop) =>
            drop.evidence.some(
              ({ kind, url, startSeconds }) =>
                kind === 'vod' &&
                url !== undefined &&
                startSeconds !== undefined,
            ),
          ),
      ),
  },
  {
    name: 'a VOD without a URL',
    matches: () =>
      buildFor('cw-launch').drops['crowned-revenant']?.some((drop) =>
        drop.evidence.some(
          ({ kind, url }) => kind === 'vod' && url === undefined,
        ),
      ) ?? false,
  },
  {
    name: 'two kinds on one item',
    matches: () => {
      const drop = buildFor('gms-v83').drops['native-alpha']?.find(
        ({ itemId }) => itemId === 'native-bloom',
      );
      return new Set(drop?.evidence.map(({ kind }) => kind)).size === 2;
    },
  },
  {
    name: 'a kind the app does not know',
    matches: () => {
      const appKinds: readonly Exclude<FixtureEvidenceKind, 'screenshot'>[] = [
        'native',
        'historical-overlay',
        'vod',
      ];
      const unknownKind: string = 'screenshot';
      return (
        !appKinds.some((kind) => kind === unknownKind) &&
        FIXTURE_EVIDENCE_KINDS['screenshot'].label === 'Screenshot' &&
        Boolean(
          buildFor('gms-v83').drops['native-alpha']?.some((drop) =>
            drop.evidence.some(({ kind }) => kind === 'screenshot'),
          ),
        )
      );
    },
  },
  {
    name: 'given by a quest',
    matches: () =>
      (rowFor('cw-launch', 'only-given')?.relationships?.['quest-reward'] ??
        0) > 0,
  },
  {
    name: 'only taken by a quest',
    matches: () => {
      const relationships = rowFor('cw-launch', 'only-taken')?.relationships;
      return (
        (relationships?.['needed-for-quest'] ?? 0) > 0 &&
        relationships?.['quest-reward'] === undefined
      );
    },
  },
  {
    name: 'both given and taken by a quest',
    matches: () => {
      const relationships = rowFor(
        'cw-launch',
        'given-and-taken',
      )?.relationships;
      return (
        (relationships?.['needed-for-quest'] ?? 0) > 0 &&
        (relationships?.['quest-reward'] ?? 0) > 0
      );
    },
  },
  {
    name: 'a requirement that is not established',
    matches: () => {
      const relationships = rowFor(
        'cw-launch',
        'multi-role-relic',
      )?.relationships;
      return (
        relationships?.['needed-for-quest'] === 1 &&
        relationships?.['needed-for-quest-not-established'] === 1
      );
    },
  },
  {
    name: 'turned in, held to complete, held to start, must not be held, pet, monster card, and not established quest roles',
    matches: () => {
      const publishedRoles = new Set(
        buildFor('cw-launch').items.flatMap((item) =>
          (item.questUses ?? []).flatMap((use) =>
            use.roles.map(({ role }) => role),
          ),
        ),
      );
      return roles.every((role) => publishedRoles.has(role));
    },
  },
  {
    name: 'a relationship whose coverage is not complete',
    matches: () =>
      browsePack('cw-launch').coverage.relationships['used-in-recipe'] !==
      'complete',
  },
  {
    name: 'a build that does not publish which monsters drop items',
    matches: () => {
      const pack = browsePack('gms-v83');
      const artifacts = fixtureRelease.builds.get('gms-v83');
      return (
        artifacts?.itemRelatedEntityBrowse['monster-drop'] === undefined &&
        pack.coverage.relationships['monster-drop'] === 'unsupported' &&
        Object.values(pack.records).every(
          (record) => record?.relationships?.['monster-drop'] === undefined,
        )
      );
    },
  },
  {
    name: 'a sell price of zero',
    matches: () =>
      knownSellPrice(itemFor('cw-launch', 'practice-tonic-a')) === 0,
  },
  {
    name: 'a sell price of one',
    matches: () =>
      knownSellPrice(itemFor('cw-launch', 'practice-tonic-b')) === 1,
  },
  {
    name: 'a sell price greater than one thousand',
    matches: () =>
      (knownSellPrice(itemFor('cw-launch', 'sample-draught')) ?? 0) > 1_000,
  },
  {
    name: 'an unknown sell price',
    matches: () =>
      itemFor('cw-launch', 'training-snack')?.sellPrice?.state === 'unknown' &&
      rowFor('cw-launch', 'training-snack')?.sellPrice === undefined,
  },
  {
    name: 'Cash Shop sale states of permanent, days, and not on sale',
    matches: () => {
      const permanent = rowFor('cw-launch', 'pixel-pin')?.cashShopSale;
      const days = rowFor('cw-launch', 'star-badge')?.cashShopSale;
      const notOnSale = rowFor('cw-launch', 'toy-cape')?.cashShopSale;
      return (
        permanent?.state === 'on-sale' &&
        permanent.duration.kind === 'permanent' &&
        days?.state === 'on-sale' &&
        days.duration.kind === 'days' &&
        notOnSale?.state === 'not-on-sale'
      );
    },
  },
  {
    name: 'a category with more items than one page shows',
    matches: () =>
      Object.values(browsePack('cw-launch').records).filter((record) =>
        record?.types?.includes('monster-material'),
      ).length > 50,
  },
  {
    name: 'every category in Use, ETC, Set-up, and Pets & Cash is represented in cw-launch',
    matches: () => coversAllCategories('cw-launch'),
  },
  {
    name: 'every category in Use, ETC, Set-up, and Pets & Cash is represented in gms-v83',
    matches: () => coversAllCategories('gms-v83'),
  },
  {
    name: 'scroll target icon digests are answered with generated shapes',
    matches: () =>
      (['cw-launch', 'gms-v83'] as const).every((buildId) =>
        Object.values(browsePack(buildId).scrollTargetIcons).every(
          (contentId) => {
            const response = spriteResponse(contentId);
            return response.status === 200 && response.body.startsWith('<svg');
          },
        ),
      ),
  },
];

describe('Items fixture cases', () => {
  it.each(itemCases)('$name', ({ matches }) => {
    expect(matches()).toBe(true);
  });
});
