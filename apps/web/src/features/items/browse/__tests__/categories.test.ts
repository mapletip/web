import { describe, expect, it } from 'vitest';

import {
  assignChild,
  getCategoryCounts,
  getCategoryRows,
  isItemScope,
  ITEM_SCOPES,
  matchesCategory,
  type ItemCategoryScope,
} from '../categories';
import type { ItemRow } from '../project';

function makeRow(overrides: Partial<ItemRow> = {}): ItemRow {
  return {
    key: 'item:test:1',
    sourceId: '02000000',
    itemClass: 'consume',
    ...overrides,
  };
}

const findChild = (scope: ItemCategoryScope, slug: string) =>
  scope.children.find((c) => c.slug === slug);

describe('category model and predicates', () => {
  it('validates scopes and child slugs accurately', () => {
    expect(isItemScope('all')).toBe(true);
    expect(isItemScope('use')).toBe(true);
    expect(isItemScope('etc')).toBe(true);
    expect(isItemScope('setup')).toBe(true);
    expect(isItemScope('cash')).toBe(true);
    expect(isItemScope('invalid')).toBe(false);

    expect(ITEM_SCOPES.use.children.some((c) => c.slug === 'scrolls')).toBe(
      true,
    );
    expect(
      ITEM_SCOPES.use.children.some((c) => c.slug === 'upgrade-scrolls'),
    ).toBe(false);
    expect(
      ITEM_SCOPES.use.children.some((c) => c.slug === 'summoning-sacks'),
    ).toBe(true);
    expect(ITEM_SCOPES.use.children.some((c) => c.slug === 'boxes')).toBe(true);
    expect(
      ITEM_SCOPES.use.children.some((c) => c.slug === 'mastery-books'),
    ).toBe(true);
    expect(ITEM_SCOPES.use.children.some((c) => c.slug === 'skill-items')).toBe(
      false,
    );
    expect(
      ITEM_SCOPES.use.children.some((c) => c.slug === 'other-use-items'),
    ).toBe(true);
    expect(ITEM_SCOPES.use.children.some((c) => c.slug === 'chairs')).toBe(
      false,
    );
    expect(
      ITEM_SCOPES.etc.children.some((c) => c.slug === 'refined-ores'),
    ).toBe(true);
    expect(
      ITEM_SCOPES.etc.children.some((c) => c.slug === 'refined-materials'),
    ).toBe(false);
    expect(
      ITEM_SCOPES.etc.children.some((c) => c.slug === 'monster-drops'),
    ).toBe(true);
    expect(
      ITEM_SCOPES.etc.children.some((c) => c.slug === 'monster-materials'),
    ).toBe(false);
    expect(ITEM_SCOPES.etc.children.some((c) => c.slug === 'quest-items')).toBe(
      true,
    );
    expect(
      ITEM_SCOPES.setup.children.some((c) => c.slug === 'event-items'),
    ).toBe(true);
    expect(
      ITEM_SCOPES.setup.children.some((c) => c.slug === 'holiday-ornaments'),
    ).toBe(false);
    expect(ITEM_SCOPES.setup.children.some((c) => c.slug === 'chairs')).toBe(
      true,
    );
    expect(ITEM_SCOPES.cash.children.some((c) => c.slug === 'pets')).toBe(true);
    expect(ITEM_SCOPES.cash.label).toBe('Cash');
    expect(findChild(ITEM_SCOPES.etc, 'gems')?.label).toBe('Gems');
  });

  it('enforces scope-AND-predicate membership', () => {
    const cashHealer = makeRow({
      key: 'item:cash:healer',
      sourceId: '05000001',
      itemClass: 'cash',
      functions: ['recovery'],
    });
    const useHealer = makeRow({
      key: 'item:use:healer',
      sourceId: '02000002',
      itemClass: 'consume',
      functions: ['recovery'],
    });

    const rows = [cashHealer, useHealer];

    // Recovery in Use scope MUST exclude the Cash healer
    const useRecoveryRows = getCategoryRows(
      rows,
      ITEM_SCOPES.use,
      findChild(ITEM_SCOPES.use, 'recovery'),
    );
    expect(useRecoveryRows).toHaveLength(1);
    expect(useRecoveryRows[0]?.key).toBe('item:use:healer');

    // Cash feeder Sprout in Cash scope MUST be excluded from Use Pet Food
    const cashPetFood = makeRow({
      key: 'item:cash:sprout',
      sourceId: '05240018',
      itemClass: 'cash',
      types: ['pet-food'],
    });
    const usePetFood = makeRow({
      key: 'item:use:petfood',
      sourceId: '02120000',
      itemClass: 'consume',
      types: ['pet-food'],
    });

    const petFoodRows = getCategoryRows(
      [cashPetFood, usePetFood],
      ITEM_SCOPES.use,
      findChild(ITEM_SCOPES.use, 'pet-food'),
    );
    expect(petFoodRows).toHaveLength(1);
    expect(petFoodRows[0]?.key).toBe('item:use:petfood');
  });

  it('assigns each item to the first matching positive child in precedence order', () => {
    // 1. Recovery precedes Buffs (item with recovery function and potion type)
    const healingPotion = makeRow({
      key: 'item:healing',
      sourceId: '02000000',
      itemClass: 'consume',
      types: ['potion', 'food-buff'],
      functions: ['recovery'],
    });
    expect(assignChild(healingPotion, ITEM_SCOPES.use)?.slug).toBe('recovery');
    expect(
      matchesCategory(
        healingPotion,
        ITEM_SCOPES.use,
        findChild(ITEM_SCOPES.use, 'recovery'),
      ),
    ).toBe(true);
    expect(
      matchesCategory(
        healingPotion,
        ITEM_SCOPES.use,
        findChild(ITEM_SCOPES.use, 'buffs'),
      ),
    ).toBe(false);

    // 2. Pure buff (potion type without recovery function) is assigned to Buffs
    const buffPotion = makeRow({
      key: 'item:buff',
      sourceId: '02002000',
      itemClass: 'consume',
      types: ['potion'],
    });
    expect(assignChild(buffPotion, ITEM_SCOPES.use)?.slug).toBe('buffs');

    // 3. Types precede Quest Items in ETC: monster material needed for quest -> monster-drops
    const mmQuest = makeRow({
      key: 'item:mm-quest',
      sourceId: '04000010',
      itemClass: 'etc',
      types: ['monster-material'],
      neededForQuestCount: 5,
    });
    expect(assignChild(mmQuest, ITEM_SCOPES.etc)?.slug).toBe('monster-drops');
    expect(
      matchesCategory(
        mmQuest,
        ITEM_SCOPES.etc,
        findChild(ITEM_SCOPES.etc, 'monster-drops'),
      ),
    ).toBe(true);
    expect(
      matchesCategory(
        mmQuest,
        ITEM_SCOPES.etc,
        findChild(ITEM_SCOPES.etc, 'quest-items'),
      ),
    ).toBe(false);

    // 4. Ores precede Quest Items: ore needed for quest -> ores
    const oreQuest = makeRow({
      key: 'item:ore-quest',
      sourceId: '04010000',
      itemClass: 'etc',
      types: ['ore'],
      neededForQuestCount: 2,
    });
    expect(assignChild(oreQuest, ITEM_SCOPES.etc)?.slug).toBe('ores');

    // 5. Ores precede Monster Drops: ore with monster-material type -> ores
    const oreMM = makeRow({
      key: 'item:ore-mm',
      sourceId: '04010099',
      itemClass: 'etc',
      types: ['ore', 'monster-material'],
    });
    expect(assignChild(oreMM, ITEM_SCOPES.etc)?.slug).toBe('ores');

    // 6. Pure quest item (needed-for-quest > 0, no preceding types) -> quest-items
    const pureQuest = makeRow({
      key: 'item:pure-quest',
      sourceId: '04031001',
      itemClass: 'etc',
      neededForQuestCount: 1,
    });
    expect(assignChild(pureQuest, ITEM_SCOPES.etc)?.slug).toBe('quest-items');

    // 7. Non-matching scope returns undefined
    expect(assignChild(healingPotion, ITEM_SCOPES.etc)).toBeUndefined();
  });

  it('assigns a quest-flag-only ETC row to Quest Items', () => {
    const questFlagOnly = makeRow({
      key: 'item:quest-flag-only',
      sourceId: '04031002',
      itemClass: 'etc',
      questFlag: true,
    });
    expect(assignChild(questFlagOnly, ITEM_SCOPES.etc)?.slug).toBe(
      'quest-items',
    );
    expect(
      matchesCategory(
        questFlagOnly,
        ITEM_SCOPES.etc,
        findChild(ITEM_SCOPES.etc, 'quest-items'),
      ),
    ).toBe(true);
  });

  it('keeps a quest-flag monster-material row in Monster Drops', () => {
    const mmQuestFlag = makeRow({
      key: 'item:mm-quest-flag',
      sourceId: '04000011',
      itemClass: 'etc',
      types: ['monster-material'],
      questFlag: true,
      neededForQuestCount: 2,
    });
    expect(assignChild(mmQuestFlag, ITEM_SCOPES.etc)?.slug).toBe(
      'monster-drops',
    );
    expect(
      matchesCategory(
        mmQuestFlag,
        ITEM_SCOPES.etc,
        findChild(ITEM_SCOPES.etc, 'monster-drops'),
      ),
    ).toBe(true);
    expect(
      matchesCategory(
        mmQuestFlag,
        ITEM_SCOPES.etc,
        findChild(ITEM_SCOPES.etc, 'quest-items'),
      ),
    ).toBe(false);
  });

  it('enforces invariant: per-scope child counts sum to the scope total across all overlap cases', () => {
    const fixtureRows: readonly ItemRow[] = [
      // Use: Recovery precedes Buffs
      makeRow({
        key: 'u:rec-buff',
        sourceId: '02000000',
        itemClass: 'consume',
        types: ['potion', 'food-buff'],
        functions: ['recovery'],
      }),
      // Use: Pure Buff
      makeRow({
        key: 'u:pure-buff',
        sourceId: '02002000',
        itemClass: 'consume',
        types: ['potion'],
      }),
      // Use: Scroll
      makeRow({
        key: 'u:scroll',
        sourceId: '02040000',
        itemClass: 'consume',
        types: ['upgrade-scroll'],
      }),
      // Use: Throwing Star
      makeRow({
        key: 'u:star',
        sourceId: '02070000',
        itemClass: 'consume',
        types: ['throwing-star'],
      }),
      // Use: Other Use Item
      makeRow({
        key: 'u:other',
        sourceId: '02999999',
        itemClass: 'consume',
      }),

      // ETC: Ores precede Monster Drops
      makeRow({
        key: 'e:ore-mm',
        sourceId: '04010099',
        itemClass: 'etc',
        types: ['ore', 'monster-material'],
      }),
      // ETC: Ores precede Quest Items
      makeRow({
        key: 'e:ore-quest',
        sourceId: '04010000',
        itemClass: 'etc',
        types: ['ore'],
        neededForQuestCount: 2,
      }),
      // ETC: Gems precede Quest Items
      makeRow({
        key: 'e:gem-quest',
        sourceId: '04020000',
        itemClass: 'etc',
        types: ['gem'],
        neededForQuestCount: 1,
      }),
      // ETC: Refined Ores precede Quest Items
      makeRow({
        key: 'e:refined-quest',
        sourceId: '04010100',
        itemClass: 'etc',
        types: ['refined-material'],
        neededForQuestCount: 3,
      }),
      // ETC: Monster Drops precede Quest Items (with neededForQuestCount)
      makeRow({
        key: 'e:mm-quest',
        sourceId: '04000010',
        itemClass: 'etc',
        types: ['monster-material'],
        neededForQuestCount: 5,
      }),
      // ETC: Monster Drops precede Quest Items (with questFlag)
      makeRow({
        key: 'e:mm-questflag',
        sourceId: '04000012',
        itemClass: 'etc',
        types: ['monster-material'],
        questFlag: true,
      }),
      // ETC: Pure Quest Item (by neededForQuestCount)
      makeRow({
        key: 'e:pure-quest',
        sourceId: '04031001',
        itemClass: 'etc',
        neededForQuestCount: 1,
      }),
      // ETC: Pure Quest Item (by questFlag only)
      makeRow({
        key: 'e:quest-flag-only',
        sourceId: '04031002',
        itemClass: 'etc',
        questFlag: true,
      }),
      // ETC: Other ETC Item
      makeRow({
        key: 'e:other',
        sourceId: '04999999',
        itemClass: 'etc',
      }),

      // Set-up: Chair
      makeRow({
        key: 's:chair',
        sourceId: '03010000',
        itemClass: 'setup',
        types: ['chair'],
      }),
      // Set-up: Event Item
      makeRow({
        key: 's:event',
        sourceId: '03992024',
        itemClass: 'setup',
        types: ['holiday-ornament'],
      }),
      // Set-up: Other Set-up
      makeRow({
        key: 's:other',
        sourceId: '03999999',
        itemClass: 'setup',
      }),

      // Cash: Pet
      makeRow({
        key: 'c:pet',
        sourceId: '5000000',
        itemClass: 'pet',
      }),
      // Cash: Cash
      makeRow({
        key: 'c:cash',
        sourceId: '05070000',
        itemClass: 'cash',
      }),
    ];

    const counts = getCategoryCounts(fixtureRows);

    expect(counts.all.total).toBe(fixtureRows.length);
    expect(Object.keys(counts.all.children)).toHaveLength(0);

    const nonAllScopes = [
      ITEM_SCOPES.use,
      ITEM_SCOPES.etc,
      ITEM_SCOPES.setup,
      ITEM_SCOPES.cash,
    ] as const;

    for (const scope of nonAllScopes) {
      const summary = counts[scope.slug];
      const childSum = Object.values(summary.children).reduce(
        (a, b) => a + b,
        0,
      );
      expect(
        childSum,
        `sum(child counts) for ${scope.slug} must match scope total`,
      ).toBe(summary.total);
      expect(summary.total).toBe(
        fixtureRows.filter((r) => scope.itemClasses.includes(r.itemClass))
          .length,
      );
    }
  });

  it('matches mastery books by the skill function', () => {
    const skillItem = makeRow({
      key: 'item:skill:1',
      sourceId: '02280000',
      itemClass: 'consume',
      functions: ['skill'],
    });
    const child = findChild(ITEM_SCOPES.use, 'mastery-books');
    expect(child).toBeDefined();
    expect(child?.label).toBe('Mastery Books');
    expect(child?.kind === 'positive' && child.matches(skillItem)).toBe(true);
  });

  it('computes Other as the complement of the union of positive children', () => {
    const potion = makeRow({
      key: 'item:potion',
      itemClass: 'consume',
      types: ['potion'],
    });
    const scroll = makeRow({
      key: 'item:scroll',
      itemClass: 'consume',
      types: ['upgrade-scroll'],
    });
    const miscellaneous = makeRow({
      key: 'item:misc',
      itemClass: 'consume',
      types: [],
      functions: [],
    });

    const rows = [potion, scroll, miscellaneous];

    const otherRows = getCategoryRows(
      rows,
      ITEM_SCOPES.use,
      findChild(ITEM_SCOPES.use, 'other-use-items'),
    );
    expect(otherRows).toHaveLength(1);
    expect(otherRows[0]?.key).toBe('item:misc');

    // Every positive child in the scope is disjoint from Other
    const positiveBuffs = getCategoryRows(
      rows,
      ITEM_SCOPES.use,
      findChild(ITEM_SCOPES.use, 'buffs'),
    );
    const positiveScrolls = getCategoryRows(
      rows,
      ITEM_SCOPES.use,
      findChild(ITEM_SCOPES.use, 'scrolls'),
    );

    const otherKeys = new Set(otherRows.map((r) => r.key));
    for (const r of [...positiveBuffs, ...positiveScrolls]) {
      expect(otherKeys.has(r.key)).toBe(false);
    }
  });

  it('verifies single membership predicate matchesCategory handles positive and other children', () => {
    const scope = ITEM_SCOPES.use;
    const potion = makeRow({
      key: 'p1',
      itemClass: 'consume',
      types: ['potion'],
    });
    const misc = makeRow({ key: 'm1', itemClass: 'consume' });
    const nonConsume = makeRow({
      key: 'nc1',
      itemClass: 'etc',
      types: ['potion'],
    });

    const buffChild = findChild(scope, 'buffs');
    const otherChild = findChild(scope, 'other-use-items');

    expect(matchesCategory(potion, scope, buffChild)).toBe(true);
    expect(matchesCategory(potion, scope, otherChild)).toBe(false);

    expect(matchesCategory(misc, scope, buffChild)).toBe(false);
    expect(matchesCategory(misc, scope, otherChild)).toBe(true);

    // Wrong item class never matches
    expect(matchesCategory(nonConsume, scope, buffChild)).toBe(false);
    expect(matchesCategory(nonConsume, scope, otherChild)).toBe(false);
  });

  it('returns an empty array for recognized zero-member children without failing', () => {
    const rows = [
      makeRow({
        key: 'item:potion',
        itemClass: 'consume',
        types: ['potion'],
      }),
    ];

    const bulletsRows = getCategoryRows(
      rows,
      ITEM_SCOPES.use,
      findChild(ITEM_SCOPES.use, 'bullets'),
    );
    expect(bulletsRows).toHaveLength(0);
  });

  it('computes per-category counts accurately', () => {
    const potion = makeRow({
      key: 'item:potion',
      itemClass: 'consume',
      types: ['potion'],
    });
    const otherUse = makeRow({
      key: 'item:other',
      itemClass: 'consume',
    });
    const questItem = makeRow({
      key: 'item:quest',
      itemClass: 'etc',
      neededForQuestCount: 2,
    });
    const pet = makeRow({
      key: 'item:pet',
      itemClass: 'pet',
    });

    const rows = [potion, otherUse, questItem, pet];
    const counts = getCategoryCounts(rows);

    expect(counts.all.total).toBe(4);
    expect(counts.use.total).toBe(2);
    expect(counts.use.children['buffs']).toBe(1);
    expect(counts.use.children['other-use-items']).toBe(1);
    expect(counts.use.children['bullets']).toBe(0);

    expect(counts.etc.total).toBe(1);
    expect(counts.etc.children['quest-items']).toBe(1);
    expect(counts.etc.children['ores']).toBe(0);

    expect(counts.cash.total).toBe(1);
    expect(counts.cash.children['pets']).toBe(1);
    expect(counts.cash.children['cash-items']).toBe(0);
  });

  it('returns scope-specific rows when no child is supplied', () => {
    const consumeRow = makeRow({ key: 'item:consume', itemClass: 'consume' });
    const etcRow = makeRow({ key: 'item:etc', itemClass: 'etc' });

    const rows = [consumeRow, etcRow];
    const scopeRows = getCategoryRows(rows, ITEM_SCOPES.use);

    expect(scopeRows).toHaveLength(1);
    expect(scopeRows[0]?.key).toBe('item:consume');
  });

  it('ensures every listed iconContentId in ITEM_SCOPES is an actual member of its category in a fixture', () => {
    const fixtureRows: readonly ItemRow[] = [
      // Use
      {
        key: '02040000',
        sourceId: '02040000',
        itemClass: 'consume',
        types: ['upgrade-scroll'],
        icon: '3a453e4e40b44d9358f9348abdda896b64ecc046a52e5b07a2388bdbd7dc8601',
      },
      {
        key: '02000004',
        sourceId: '02000004',
        itemClass: 'consume',
        functions: ['recovery'],
        icon: '07c090345b4e437b6204eb7e234119d7709846f6b263712c7df5121add2bdc71',
      },
      {
        key: '02000005',
        sourceId: '02000005',
        itemClass: 'consume',
        functions: ['recovery'],
        icon: '5aae760b2488feb48104655227f9faf80f84691197b940ab44775f8f2a0c3965',
      },
      {
        key: '02012000',
        sourceId: '02012000',
        itemClass: 'consume',
        types: ['potion'],
        icon: '1cb0671554c0cb6eb6a95aca81a1cc52d11b5853a371741cf790463c0dccccb1',
      },
      {
        key: '02070000',
        sourceId: '02070000',
        itemClass: 'consume',
        types: ['throwing-star'],
        icon: 'f77172ea2f08e2e8586c8d2a208c3614cbf112a09796609f9b4fc5c8affb5e0e',
      },
      {
        key: '02060000',
        sourceId: '02060000',
        itemClass: 'consume',
        types: ['arrow'],
        icon: '752f72ebcb3fc70ea7ec797e483280480a569ab2b7cf98330710adb097f51e98',
      },
      {
        key: '02330000',
        sourceId: '02330000',
        itemClass: 'consume',
        types: ['bullet'],
        icon: 'b220c978f7d9a1afbaca42e4e49fbaa682b02abe412e11711ddec6116e6ede4a',
      },
      {
        key: '02120000',
        sourceId: '02120000',
        itemClass: 'consume',
        types: ['pet-food'],
        icon: '48bbbec3311d822c327cfc030c8d5a2d5f0c726a263356c40c02af0f125aac7c',
      },
      {
        key: '02100000',
        sourceId: '02100000',
        itemClass: 'consume',
        functions: ['summon'],
        icon: '6c254da1ae5e2f8294a162a86622807c3c45d1bcb123660e17ebdd1739174357',
      },
      {
        key: '02022428',
        sourceId: '02022428',
        itemClass: 'consume',
        functions: ['reward-container'],
        icon: 'cc78d2418978f78394df682664352ee29cb05c6eab276916eea5bb829fe4a595',
      },
      {
        key: '02380001',
        sourceId: '02380001',
        itemClass: 'consume',
        functions: ['monster-card'],
        icon: 'a8ecbc24e9b7659ec44e8281bd630a7280a35580d5aac3e0ada70ab6718b1735',
      },
      {
        key: '02290053',
        sourceId: '02290053',
        itemClass: 'consume',
        functions: ['skill'],
        icon: '147e22281aa79e799cb16f38bcf9685bede7679e0132fde589b6d8e24185e10b',
      },
      {
        key: '02028000',
        sourceId: '02028000',
        itemClass: 'consume',
        types: ['meso-pouch'],
        icon: '1a1202deec7cf17c8aec33e32c120f44e2cb7d2a1c9c4951ba9aa9f8093fcd24',
      },
      {
        key: '02030000',
        sourceId: '02030000',
        itemClass: 'consume',
        icon: '13e65ab29234619f545b04a1809f6546078fd958b3e37386c52ecb0ae03a2ec4',
      },

      // ETC
      {
        key: '04010006',
        sourceId: '04010006',
        itemClass: 'etc',
        types: ['ore'],
        icon: '9bc102b58369315c30222c8c54107371efd84b875e76d5c83665c42428049cf4',
      },
      {
        key: '04020107',
        sourceId: '04020107',
        itemClass: 'etc',
        types: ['gem'],
        icon: '365ff7564302e01a8ca13a94f63ff05adc0b318a9c44dc8a69506e52300b4874',
      },
      {
        key: '04010101',
        sourceId: '04010101',
        itemClass: 'etc',
        types: ['refined-material'],
        icon: '75d29c88a2df6716e8452fdcd5e2de63a2cfbc587f9537ec3706b02639f5d4aa',
      },
      {
        key: '04000009',
        sourceId: '04000009',
        itemClass: 'etc',
        types: ['monster-material'],
        icon: '752e1848b26d249f7728fa2b290b6077872e79dea71db2d18aea20c8605889e5',
      },
      {
        key: '04000010',
        sourceId: '04000010',
        itemClass: 'etc',
        types: ['monster-material'],
        icon: 'a17e4c3ad5053c275a4f791c71f0707e2e0e6b02b056f0892e4a221df76bd57d',
      },
      {
        key: '04031001',
        sourceId: '04031001',
        itemClass: 'etc',
        neededForQuestCount: 1,
        icon: '63df4ceb3580419b2ae1db57f001573eac4fe068edfe5aeea17c4ce734de0f7a',
      },
      {
        key: '04031083',
        sourceId: '04031083',
        itemClass: 'etc',
        icon: '01a2f55abad4412c067f2ff4bbded0ce3793affe55817e4fc84e70c808289a43',
      },

      // Set-up
      {
        key: '03010007',
        sourceId: '03010007',
        itemClass: 'setup',
        types: ['chair'],
        icon: '15ceb9596a6bdc8f61f8aa1382292f3b428a30281315b83ed0499c5d0492e120',
      },
      {
        key: '03992024',
        sourceId: '03992024',
        itemClass: 'setup',
        types: ['holiday-ornament'],
        icon: '96287ff70fcacc9d152b5e2382d3c7c274cbac08230d0c879c6d760dd8bbb5a8',
      },
      {
        key: '03000005',
        sourceId: '03000005',
        itemClass: 'setup',
        types: ['furniture'],
        icon: '30653202898033325e7bdf8080b52b5b4025df895da27ac1e6e7b213f72e87e1',
      },
      {
        key: '03030000',
        sourceId: '03030000',
        itemClass: 'setup',
        types: ['crafting-station'],
        icon: 'b7d62c62b03503e04609501b97cb8ce7349cfadec38b3e8d01d7eae524355051',
      },

      // Cash
      {
        key: '5000002',
        sourceId: '5000002',
        itemClass: 'pet',
        icon: '7cb4e8cd5e402cc35d7bd6d51dafb1800670816463425b50525f091accdde43e',
      },
      {
        key: '05070001',
        sourceId: '05070001',
        itemClass: 'cash',
        icon: 'e92811536cb6820a65eafaea2452b94161951361e5ed35b16035f0207d8939f0',
      },
    ];

    const fixtureByIcon = new Map(
      fixtureRows.filter((r) => r.icon).map((r) => [r.icon as string, r]),
    );

    let checkedCategories = 0;
    for (const scope of Object.values(ITEM_SCOPES)) {
      for (const child of scope.children) {
        if (!child.iconContentIds) {
          continue;
        }
        checkedCategories++;
        for (const contentId of child.iconContentIds) {
          const row = fixtureByIcon.get(contentId);
          expect(
            row,
            `Row with icon ${contentId} must exist in fixture`,
          ).toBeDefined();
          const isMember = row ? matchesCategory(row, scope, child) : false;
          expect(
            isMember,
            `icon ${contentId} must be carried by a member of category ${scope.slug}/${child.slug}`,
          ).toBe(true);
        }
      }
    }
    // 25 categories define iconContentIds (all except other-setup-items)
    expect(checkedCategories).toBe(25);
  });
});
