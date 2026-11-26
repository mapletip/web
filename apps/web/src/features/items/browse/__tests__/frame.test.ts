import { describe, expect, it } from 'vitest';

import { itemPrimaryFact } from '../frame';
import type { CategorizedItemRow } from '../project';

function makeRow(
  overrides: Partial<CategorizedItemRow> = {},
): CategorizedItemRow {
  return {
    key: 'item:test:1',
    sourceId: 'test-item-1',
    itemClass: 'consume',
    name: 'Test Item',
    kind: 'other-use',
    kindPath: ['all', 'use', 'other-use'],
    ...overrides,
  };
}

describe('itemPrimaryFact', () => {
  it('prefers recovery, buff, and attack effects over secondary facts', () => {
    expect(
      itemPrimaryFact({
        record: makeRow({
          kind: 'potions-and-food',
          hp: 300,
          neededForQuestCount: 2,
          sellPrice: 50,
        }),
      }),
    ).toBe('Restores 300 HP');

    expect(
      itemPrimaryFact({
        record: makeRow({
          kind: 'potions-and-food',
          hpPercent: 50,
        }),
      }),
    ).toBe('Restores 50% HP');

    expect(
      itemPrimaryFact({
        record: makeRow({
          kind: 'potions-and-food',
          buff: {
            durationSeconds: 600,
            effects: [{ stat: 'speed', unit: 'flat', value: 5 }],
          },
        }),
      }),
    ).toBe('+5 speed · Lasts 10 min');

    expect(
      itemPrimaryFact({
        record: makeRow({
          kind: 'stars-and-arrows',
          attack: 27,
          maxStack: 800,
        }),
      }),
    ).toBe('+27 attack');
  });

  it('formats scroll success, chair seating recovery, and pet food fullness', () => {
    expect(
      itemPrimaryFact({
        record: makeRow({ kind: 'scrolls', success: 60 }),
      }),
    ).toBe('60% success');

    expect(
      itemPrimaryFact({
        record: makeRow({ kind: 'chairs', seatHp: 50 }),
      }),
    ).toBe('+50 HP');

    expect(
      itemPrimaryFact({
        record: makeRow({ kind: 'chairs', seatMp: 40 }),
      }),
    ).toBe('+40 MP');

    expect(
      itemPrimaryFact({
        record: makeRow({ kind: 'chairs', seatHp: 50, seatMp: 40 }),
      }),
    ).toBe('+50 HP, +40 MP');

    expect(
      itemPrimaryFact({
        record: makeRow({ kind: 'pet-food', fullness: 30 }),
      }),
    ).toBe('Restores 30 fullness');
  });

  it('formats quest, recipe, and monster counts in plain US English', () => {
    expect(
      itemPrimaryFact({
        record: makeRow({
          kind: 'monster-drops',
          neededForQuestCount: 1,
          sellPrice: 10,
        }),
      }),
    ).toBe('Required by a quest');

    expect(
      itemPrimaryFact({
        record: makeRow({
          kind: 'monster-drops',
          neededForQuestCount: 3,
        }),
      }),
    ).toBe('Required by 3 quests');

    expect(
      itemPrimaryFact({
        record: makeRow({
          kind: 'monster-drops',
          usedInRecipeCount: 1,
        }),
      }),
    ).toBe('Used in a recipe');

    expect(
      itemPrimaryFact({
        record: makeRow({
          kind: 'monster-drops',
          usedInRecipeCount: 4,
        }),
      }),
    ).toBe('Used in 4 recipes');

    expect(
      itemPrimaryFact({
        record: makeRow({
          kind: 'ores-and-gems',
          monsterDropCount: 1,
        }),
      }),
    ).toBe('Dropped by a monster');

    expect(
      itemPrimaryFact({
        record: makeRow({
          kind: 'ores-and-gems',
          monsterDropCount: 2,
        }),
      }),
    ).toBe('Dropped by 2 monsters');
  });

  it('falls back to remaining published facts and returns undefined when none exist', () => {
    expect(
      itemPrimaryFact({
        record: makeRow({ sellPrice: 1 }),
      }),
    ).toBe('Sells for 1 meso');

    expect(
      itemPrimaryFact({
        record: makeRow({ sellPrice: 35 }),
      }),
    ).toBe('Sells for 35 mesos');

    expect(
      itemPrimaryFact({
        record: makeRow({ kind: 'ornaments' }),
      }),
    ).toBeUndefined();
  });
});
