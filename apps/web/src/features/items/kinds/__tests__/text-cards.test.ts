import { describe, expect, it } from 'vitest';

import { itemCardColumns } from '../../browse/item-card';
import type { CategorizedItemRow, ItemRow } from '../../browse/project';
import { otherEtc } from '../other-etc';
import { otherUse } from '../other-use';
import { petFood } from '../pet-food';
import { summoningSacks } from '../summoning-sacks';

const baseRow: ItemRow = {
  key: 'practice-item',
  sourceId: 'practice-item',
  itemClass: 'consume',
  name: 'Practice Item',
};

const context = {
  coverage: undefined,
  relations: {},
  descriptions: {},
} as const;

function categorized(
  overrides: Partial<CategorizedItemRow>,
): CategorizedItemRow {
  return {
    ...baseRow,
    kind: 'other-use',
    kindPath: ['all', 'use', 'other-use'],
    ...overrides,
  };
}

describe('text category cards', () => {
  it('uses the compact media-aside card and limits descriptions to two lines', () => {
    for (const kind of [summoningSacks, petFood, otherUse, otherEtc]) {
      expect(kind.card?.layout).toBe('short');
      expect(kind.card?.secondaryLineClamp).toBe(2);
      expect(itemCardColumns({ kind })).toEqual({ base: 1, md: 2, lg: 2 });
      expect(kind.descriptions).toBe(true);
    }
  });

  it.each([
    ['A short published note.', 'A short published note.'],
    [
      'A long published note that continues beyond the space shown on its card.',
      'A long published note that continues beyond the space shown on its card.',
    ],
  ])('leads with the published description: %s', (description, expected) => {
    expect(
      otherUse.card?.lead(baseRow, {
        ...context,
        descriptions: { [baseRow.sourceId]: description },
      }),
    ).toBe(expected);
  });

  it('uses the sell price when a description is missing', () => {
    expect(otherUse.card?.lead({ ...baseRow, sellPrice: 10 }, context)).toBe(
      'Sells for 10 mesos',
    );
  });

  it.each([
    [{ sellPrice: 10 }, 'Sells for 10 mesos'],
    [{ sellPrice: 0 }, 'Sells for 0 mesos'],
    [{}, undefined],
  ] as const)(
    'shows known sell price and omits an unknown price',
    (facts, expected) => {
      expect(otherUse.card?.lead({ ...baseRow, ...facts }, context)).toBe(
        expected,
      );
    },
  );

  it('shows the published fullness on Pet Food cards', () => {
    expect(
      petFood.card?.footer?.(
        categorized({ kind: 'pet-food', fullness: 30 }),
        context,
      ),
    ).toBe('Restores 30 fullness');
    expect(
      petFood.card?.footer?.(categorized({ kind: 'pet-food' }), context),
    ).toBeUndefined();
  });

  it('offers pills only for published types and leaves untyped rows under All', () => {
    const returnScroll = categorized({ types: ['return-scroll'] });
    const transformation = categorized({ types: ['transformation'] });
    const untyped = categorized({});
    const useRows = [returnScroll, transformation, untyped];
    const useFacets = otherUse.card?.facets?.({
      rows: useRows,
      coverage: undefined,
      relations: {},
    });
    expect(useFacets?.[0]).toMatchObject({
      placement: 'results',
      options: [
        { value: 'return-scroll', label: 'Return scrolls' },
        { value: 'transformation', label: 'Transformations' },
      ],
    });

    const etcRows = [
      categorized({ kind: 'other-etc', types: ['crafting-catalyst'] }),
      categorized({ kind: 'other-etc' }),
    ];
    expect(
      otherEtc.card?.facets?.({
        rows: etcRows,
        coverage: undefined,
        relations: {},
      })?.[0]?.options,
    ).toEqual([{ value: 'crafting-catalyst', label: 'Crafting catalysts' }]);

    const field = otherUse.card
      ?.queryFields?.()
      .find((entry) => typeof entry !== 'string' && entry.id === 'itemTypes');
    expect(field).toBeDefined();
    if (
      field === undefined ||
      typeof field === 'string' ||
      typeof field.accessor !== 'function'
    )
      return;
    expect(field.accessor(returnScroll)).toEqual(['return-scroll']);
    expect(field.accessor(untyped)).toEqual([]);
    expect(
      otherUse.card?.facets?.({ rows: [], coverage: undefined, relations: {} }),
    ).toEqual([]);
  });
});
