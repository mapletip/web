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
  });

  it('enforces scope-AND-predicate membership', () => {
    const cashHealer = makeRow({
      sourceId: '05000001',
      itemClass: 'cash',
      functions: ['recovery'],
    });
    const useHealer = makeRow({
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
    expect(useRecoveryRows[0]?.sourceId).toBe('02000002');

    // Cash feeder Sprout in Cash scope MUST be excluded from Use Pet Food
    const cashPetFood = makeRow({
      sourceId: '05240018',
      itemClass: 'cash',
      types: ['pet-food'],
    });
    const usePetFood = makeRow({
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
    expect(petFoodRows[0]?.sourceId).toBe('02120000');
  });

  it('allows items to legitimately overlap across positive children in the same scope', () => {
    const dualItem = makeRow({
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
      sourceId: '02000010',
      itemClass: 'consume',
      types: ['potion'],
    });
    const scroll = makeRow({
      sourceId: '02040010',
      itemClass: 'consume',
      types: ['upgrade-scroll'],
    });
    const miscellaneous = makeRow({
      sourceId: '02990000',
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
    expect(otherRows[0]?.sourceId).toBe('02990000');

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

    const otherSourceIds = new Set(otherRows.map((r) => r.sourceId));
    for (const r of [...positivePotions, ...positiveScrolls]) {
      expect(otherSourceIds.has(r.sourceId)).toBe(false);
    }
  });

  it('verifies single membership predicate matchesCategory handles positive and other children', () => {
    const scope = ITEM_SCOPES.use;
    const potion = makeRow({
      sourceId: '02000020',
      itemClass: 'consume',
      types: ['potion'],
    });
    const misc = makeRow({ sourceId: '02990020', itemClass: 'consume' });
    const nonConsume = makeRow({
      sourceId: '04000020',
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
        sourceId: '02000001',
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
      sourceId: '02000030',
      itemClass: 'consume',
      types: ['potion'],
    });
    const otherUse = makeRow({
      sourceId: '02990030',
      itemClass: 'consume',
    });
    const questItem = makeRow({
      sourceId: '04000030',
      itemClass: 'etc',
      neededForQuestCount: 2,
    });
    const pet = makeRow({
      sourceId: '05000030',
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
    const consumeRow = makeRow({ sourceId: '02000040', itemClass: 'consume' });
    const etcRow = makeRow({ sourceId: '04000040', itemClass: 'etc' });

    const rows = [consumeRow, etcRow];
    const scopeRows = getCategoryRows(rows, ITEM_SCOPES.use);

    expect(scopeRows).toHaveLength(1);
    expect(scopeRows[0]?.sourceId).toBe('02000040');
  });
});
