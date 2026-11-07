import { describe, expect, it } from 'vitest';

import {
  getCategoryCounts,
  getCategoryRows,
  getScopeRows,
  isItemScope,
  isItemScopeChild,
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

describe('category model and predicates', () => {
  it('validates scopes and child slugs accurately', () => {
    expect(isItemScope('all')).toBe(true);
    expect(isItemScope('use')).toBe(true);
    expect(isItemScope('etc')).toBe(true);
    expect(isItemScope('setup')).toBe(true);
    expect(isItemScope('cash')).toBe(true);
    expect(isItemScope('invalid')).toBe(false);

    expect(isItemScopeChild('use', 'upgrade-scrolls')).toBe(true);
    expect(isItemScopeChild('use', 'other-use-items')).toBe(true);
    expect(isItemScopeChild('use', 'chairs')).toBe(false);
    expect(isItemScopeChild('etc', 'quest-items')).toBe(true);
    expect(isItemScopeChild('setup', 'chairs')).toBe(true);
    expect(isItemScopeChild('cash', 'pets')).toBe(true);
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
    const useRecoveryRows = getCategoryRows(rows, 'use', 'recovery');
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

    const petFoodRows = getCategoryRows([cashPetFood, usePetFood], 'use', 'pet-food');
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

    const potionRows = getCategoryRows(rows, 'use', 'potions');
    const foodBuffRows = getCategoryRows(rows, 'use', 'food-buffs');
    const recoveryRows = getCategoryRows(rows, 'use', 'recovery');

    expect(potionRows).toHaveLength(1);
    expect(foodBuffRows).toHaveLength(1);
    expect(recoveryRows).toHaveLength(1);
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

    const otherRows = getCategoryRows(rows, 'use', 'other-use-items');
    expect(otherRows).toHaveLength(1);
    expect(otherRows[0]?.key).toBe('item:misc');

    // Every positive child in the scope is disjoint from Other
    const positivePotions = getCategoryRows(rows, 'use', 'potions');
    const positiveScrolls = getCategoryRows(rows, 'use', 'upgrade-scrolls');

    const otherKeys = new Set(otherRows.map((r) => r.key));
    for (const r of [...positivePotions, ...positiveScrolls]) {
      expect(otherKeys.has(r.key)).toBe(false);
    }
  });

  it('returns an empty array for recognized zero-member children without failing', () => {
    const rows = [
      makeRow({
        key: 'item:potion',
        itemClass: 'consume',
        types: ['potion'],
      }),
    ];

    const bulletsRows = getCategoryRows(rows, 'use', 'bullets');
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

  it('returns scope-specific rows when no childSlug is supplied', () => {
    const consumeRow = makeRow({ key: 'item:consume', itemClass: 'consume' });
    const etcRow = makeRow({ key: 'item:etc', itemClass: 'etc' });

    const rows = [consumeRow, etcRow];
    const scopeRows = getScopeRows(rows, 'use');

    expect(scopeRows).toHaveLength(1);
    expect(scopeRows[0]?.key).toBe('item:consume');
  });
});
