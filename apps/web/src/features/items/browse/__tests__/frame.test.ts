import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { cashShop } from '../../kinds/cash-shop';
import { chairs } from '../../kinds/chairs';
import { categoryFacets, itemPrimaryFact } from '../frame';
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
    ).toBe('+50 HP · +40 MP');

    expect(chairs.card.lead(makeRow({ kind: 'chairs' }))).toBeUndefined();

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

describe('visual category cards', () => {
  it.each([
    [{ seatHp: 50 }, '+50 HP', ['hp']],
    [{ seatMp: 40 }, '+40 MP', ['mp']],
    [{ seatHp: 50, seatMp: 40 }, '+50 HP · +40 MP', ['hp', 'mp']],
    [{}, undefined, []],
  ] as const)('describes chair recovery', (facts, lead, types) => {
    const row = makeRow({ kind: 'chairs', ...facts });
    expect(chairs.card.lead(row)).toBe(lead);
    const field = chairs.card.queryFields.find(
      (entry) => typeof entry !== 'string' && entry.id === 'recoveryTypes',
    );
    expect(
      typeof field === 'string' ? undefined : field?.accessor?.(row),
    ).toEqual(types);
  });

  it('offers recovery pills and a descending recovery sort', () => {
    expect(chairs.card.pills()?.options).toEqual([
      { value: 'hp', label: 'Recovers HP' },
      { value: 'mp', label: 'Recovers MP' },
    ]);
    expect(chairs.card.sortOptions).toEqual([
      { label: 'Recovery', field: 'recovery', direction: 'desc' },
    ]);
  });

  it('uses the published NX price and only offers listing pills with complete coverage', () => {
    expect(cashShop.card.lead(makeRow({ nxPrice: 2400 }))).toBe('2,400 NX');
    expect(cashShop.card.lead(makeRow())).toBeUndefined();
    const coverage = {
      relationships: { 'cash-shop-listing': 'complete' },
    } as ItemBrowseCoverage;
    expect(cashShop.card.pills(coverage)?.options).toEqual([
      { value: 'listed', label: 'Listed' },
      { value: 'not-listed', label: 'Not listed' },
    ]);
    expect(
      cashShop.card.pills({
        ...coverage,
        relationships: {
          ...coverage.relationships,
          'cash-shop-listing': 'partial',
        },
      }),
    ).toBeUndefined();
  });

  it('offers Quest reward only when a category has a grant', () => {
    const row = makeRow({ kind: 'chairs' });
    expect(
      categoryFacets({
        rows: [row, makeRow({ kind: 'boxes', questRewardCount: 1 })],
        kind: chairs,
        coverage: undefined,
      }).map((facet) => facet.id),
    ).toEqual(['recovery-type']);
    expect(
      categoryFacets({
        rows: [{ ...row, questRewardCount: 1 }],
        kind: chairs,
        coverage: undefined,
      }).map((facet) => facet.id),
    ).toEqual(['recovery-type', 'quest-reward']);
  });
});
