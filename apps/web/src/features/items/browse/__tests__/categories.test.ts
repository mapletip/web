import { describe, expect, it } from 'vitest';

import {
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

    expect(
      ITEM_SCOPES.use.children.some((c) => c.slug === 'upgrade-scrolls'),
    ).toBe(true);
    expect(ITEM_SCOPES.use.children.some((c) => c.slug === 'skill-items')).toBe(
      true,
    );
    expect(
      ITEM_SCOPES.use.children.some((c) => c.slug === 'other-use-items'),
    ).toBe(true);
    expect(ITEM_SCOPES.use.children.some((c) => c.slug === 'chairs')).toBe(
      false,
    );
    expect(ITEM_SCOPES.etc.children.some((c) => c.slug === 'quest-items')).toBe(
      true,
    );
    expect(ITEM_SCOPES.setup.children.some((c) => c.slug === 'chairs')).toBe(
      true,
    );
    expect(ITEM_SCOPES.cash.children.some((c) => c.slug === 'pets')).toBe(true);
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

  it('allows items to legitimately overlap across positive children in the same scope', () => {
    const dualItem = makeRow({
      key: 'item:dual',
      sourceId: '02000003',
      itemClass: 'consume',
      types: ['potion', 'food-buff'],
      functions: ['recovery'],
    });

    const rows = [dualItem];

    const potionRows = getCategoryRows(
      rows,
      ITEM_SCOPES.use,
      findChild(ITEM_SCOPES.use, 'potions'),
    );
    const foodBuffRows = getCategoryRows(
      rows,
      ITEM_SCOPES.use,
      findChild(ITEM_SCOPES.use, 'food-buffs'),
    );
    const recoveryRows = getCategoryRows(
      rows,
      ITEM_SCOPES.use,
      findChild(ITEM_SCOPES.use, 'recovery'),
    );

    expect(potionRows).toHaveLength(1);
    expect(foodBuffRows).toHaveLength(1);
    expect(recoveryRows).toHaveLength(1);
  });

  it('matches skill items by the skill function', () => {
    const skillItem = makeRow({
      key: 'item:skill:1',
      sourceId: '02280000',
      itemClass: 'consume',
      functions: ['skill'],
    });
    const child = findChild(ITEM_SCOPES.use, 'skill-items');
    expect(child).toBeDefined();
    expect(child?.label).toBe('Skill Items');
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
    const positivePotions = getCategoryRows(
      rows,
      ITEM_SCOPES.use,
      findChild(ITEM_SCOPES.use, 'potions'),
    );
    const positiveScrolls = getCategoryRows(
      rows,
      ITEM_SCOPES.use,
      findChild(ITEM_SCOPES.use, 'upgrade-scrolls'),
    );

    const otherKeys = new Set(otherRows.map((r) => r.key));
    for (const r of [...positivePotions, ...positiveScrolls]) {
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

    const potionChild = findChild(scope, 'potions');
    const otherChild = findChild(scope, 'other-use-items');

    expect(matchesCategory(potion, scope, potionChild)).toBe(true);
    expect(matchesCategory(potion, scope, otherChild)).toBe(false);

    expect(matchesCategory(misc, scope, potionChild)).toBe(false);
    expect(matchesCategory(misc, scope, otherChild)).toBe(true);

    // Wrong item class never matches
    expect(matchesCategory(nonConsume, scope, potionChild)).toBe(false);
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
    expect(counts.use.children['potions']).toBe(1);
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

  it('ensures every listed iconSourceId in ITEM_SCOPES is an actual member of its category in a fixture', () => {
    const fixtureRows: readonly ItemRow[] = [
      // Use
      {
        key: '02040000',
        sourceId: '02040000',
        itemClass: 'consume',
        types: ['upgrade-scroll'],
      },
      {
        key: '02040001',
        sourceId: '02040001',
        itemClass: 'consume',
        types: ['upgrade-scroll'],
      },
      {
        key: '02000000',
        sourceId: '02000000',
        itemClass: 'consume',
        functions: ['recovery'],
        types: ['potion'],
      },
      {
        key: '02000002',
        sourceId: '02000002',
        itemClass: 'consume',
        functions: ['recovery'],
        types: ['potion'],
      },
      {
        key: '02000001',
        sourceId: '02000001',
        itemClass: 'consume',
        functions: ['recovery'],
        types: ['potion'],
      },
      {
        key: '02070000',
        sourceId: '02070000',
        itemClass: 'consume',
        types: ['throwing-star'],
      },
      {
        key: '02070006',
        sourceId: '02070006',
        itemClass: 'consume',
        types: ['throwing-star'],
      },
      {
        key: '02070005',
        sourceId: '02070005',
        itemClass: 'consume',
        types: ['throwing-star'],
      },
      {
        key: '02060000',
        sourceId: '02060000',
        itemClass: 'consume',
        types: ['arrow'],
      },
      {
        key: '02061000',
        sourceId: '02061000',
        itemClass: 'consume',
        types: ['arrow'],
      },
      {
        key: '02060001',
        sourceId: '02060001',
        itemClass: 'consume',
        types: ['arrow'],
      },
      {
        key: '02330000',
        sourceId: '02330000',
        itemClass: 'consume',
        types: ['bullet'],
      },
      {
        key: '02330001',
        sourceId: '02330001',
        itemClass: 'consume',
        types: ['bullet'],
      },
      {
        key: '02330002',
        sourceId: '02330002',
        itemClass: 'consume',
        types: ['bullet'],
      },
      {
        key: '02120000',
        sourceId: '02120000',
        itemClass: 'consume',
        types: ['pet-food'],
      },
      {
        key: '02100000',
        sourceId: '02100000',
        itemClass: 'consume',
        functions: ['summon'],
      },
      {
        key: '02100007',
        sourceId: '02100007',
        itemClass: 'consume',
        functions: ['summon'],
      },
      {
        key: '02022428',
        sourceId: '02022428',
        itemClass: 'consume',
        functions: ['reward-container'],
      },
      {
        key: '02022336',
        sourceId: '02022336',
        itemClass: 'consume',
        functions: ['reward-container'],
      },
      {
        key: '02000003',
        sourceId: '02000003',
        itemClass: 'consume',
        types: ['potion'],
      },
      {
        key: '02000006',
        sourceId: '02000006',
        itemClass: 'consume',
        types: ['potion'],
      },
      {
        key: '02022002',
        sourceId: '02022002',
        itemClass: 'consume',
        types: ['food-buff'],
      },
      {
        key: '02012000',
        sourceId: '02012000',
        itemClass: 'consume',
        types: ['food-buff'],
      },
      {
        key: '02020006',
        sourceId: '02020006',
        itemClass: 'consume',
        types: ['food-buff'],
      },
      {
        key: '02380001',
        sourceId: '02380001',
        itemClass: 'consume',
        functions: ['monster-card'],
      },
      {
        key: '02380007',
        sourceId: '02380007',
        itemClass: 'consume',
        functions: ['monster-card'],
      },
      {
        key: '02380005',
        sourceId: '02380005',
        itemClass: 'consume',
        functions: ['monster-card'],
      },
      {
        key: '02290053',
        sourceId: '02290053',
        itemClass: 'consume',
        functions: ['skill'],
      },
      {
        key: '02290084',
        sourceId: '02290084',
        itemClass: 'consume',
        functions: ['skill'],
      },
      {
        key: '02280010',
        sourceId: '02280010',
        itemClass: 'consume',
        functions: ['skill'],
      },
      {
        key: '02028000',
        sourceId: '02028000',
        itemClass: 'consume',
        types: ['meso-pouch'],
      },
      {
        key: '02028001',
        sourceId: '02028001',
        itemClass: 'consume',
        types: ['meso-pouch'],
      },
      { key: '02030000', sourceId: '02030000', itemClass: 'consume' },
      { key: '02030004', sourceId: '02030004', itemClass: 'consume' },

      // ETC
      {
        key: '04031039',
        sourceId: '04031039',
        itemClass: 'etc',
        neededForQuestCount: 1,
      },
      {
        key: '04031040',
        sourceId: '04031040',
        itemClass: 'etc',
        neededForQuestCount: 1,
      },
      {
        key: '04031041',
        sourceId: '04031041',
        itemClass: 'etc',
        neededForQuestCount: 1,
      },
      {
        key: '04020000',
        sourceId: '04020000',
        itemClass: 'etc',
        usedInRecipeCount: 1,
        types: ['ore'],
      },
      {
        key: '04020007',
        sourceId: '04020007',
        itemClass: 'etc',
        usedInRecipeCount: 1,
        types: ['ore'],
      },
      {
        key: '04010006',
        sourceId: '04010006',
        itemClass: 'etc',
        types: ['ore'],
      },
      {
        key: '04010001',
        sourceId: '04010001',
        itemClass: 'etc',
        types: ['ore'],
      },
      {
        key: '04010000',
        sourceId: '04010000',
        itemClass: 'etc',
        types: ['ore'],
      },
      {
        key: '04020107',
        sourceId: '04020107',
        itemClass: 'etc',
        types: ['gem'],
      },
      {
        key: '04021007',
        sourceId: '04021007',
        itemClass: 'etc',
        types: ['gem'],
      },
      {
        key: '04010101',
        sourceId: '04010101',
        itemClass: 'etc',
        types: ['refined-material'],
      },
      {
        key: '04011001',
        sourceId: '04011001',
        itemClass: 'etc',
        types: ['refined-material'],
      },
      {
        key: '04000009',
        sourceId: '04000009',
        itemClass: 'etc',
        types: ['monster-material'],
      },

      // Set-up
      {
        key: '03010000',
        sourceId: '03010000',
        itemClass: 'setup',
        types: ['chair'],
      },
      {
        key: '03010008',
        sourceId: '03010008',
        itemClass: 'setup',
        types: ['chair'],
      },
      {
        key: '03010007',
        sourceId: '03010007',
        itemClass: 'setup',
        types: ['chair'],
      },
      {
        key: '03992024',
        sourceId: '03992024',
        itemClass: 'setup',
        types: ['holiday-ornament'],
      },
      {
        key: '03992021',
        sourceId: '03992021',
        itemClass: 'setup',
        types: ['holiday-ornament'],
      },
      {
        key: '03992026',
        sourceId: '03992026',
        itemClass: 'setup',
        types: ['holiday-ornament'],
      },
      {
        key: '03000005',
        sourceId: '03000005',
        itemClass: 'setup',
        types: ['furniture'],
      },
      {
        key: '03000006',
        sourceId: '03000006',
        itemClass: 'setup',
        types: ['furniture'],
      },
      {
        key: '03030000',
        sourceId: '03030000',
        itemClass: 'setup',
        types: ['crafting-station'],
      },
      {
        key: '03030001',
        sourceId: '03030001',
        itemClass: 'setup',
        types: ['crafting-station'],
      },

      // Cash/Pet
      { key: '5000000', sourceId: '5000000', itemClass: 'pet' },
      { key: '5000001', sourceId: '5000001', itemClass: 'pet' },
      { key: '5000002', sourceId: '5000002', itemClass: 'pet' },
      { key: '05120002', sourceId: '05120002', itemClass: 'cash' },
      { key: '05010000', sourceId: '05010000', itemClass: 'cash' },
      { key: '05010002', sourceId: '05010002', itemClass: 'cash' },
    ];

    const fixtureBySourceId = new Map(fixtureRows.map((r) => [r.sourceId, r]));

    let checkedCategories = 0;
    for (const scope of Object.values(ITEM_SCOPES)) {
      for (const child of scope.children) {
        if (!child.iconSourceIds) {
          continue;
        }
        checkedCategories++;
        for (const sourceId of child.iconSourceIds) {
          const row = fixtureBySourceId.get(sourceId);
          expect(
            row,
            `Row with sourceId ${sourceId} must exist in fixture`,
          ).toBeDefined();
          const isMember = row ? matchesCategory(row, scope, child) : false;
          expect(
            isMember,
            `sourceId ${sourceId} must be a member of category ${scope.slug}/${child.slug}`,
          ).toBe(true);
        }
      }
    }
    // 26 categories define iconSourceIds (all except other-etc-items and other-setup-items)
    expect(checkedCategories).toBe(26);
  });
});
