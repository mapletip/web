import { describe, expect, it } from 'vitest';

import type { CategorizedItemRow, ItemRow } from '../../browse/project';
import { starsAndArrows } from '../stars-and-arrows';

const baseRow: ItemRow = {
  key: 'projectile',
  sourceId: 'projectile',
  itemClass: 'consume',
  name: 'Practice Projectile',
};

function categorized(
  overrides: Partial<CategorizedItemRow>,
): CategorizedItemRow {
  return {
    ...baseRow,
    kind: 'stars-and-arrows',
    kindPath: ['all', 'use', 'stars-and-arrows'],
    ...overrides,
  };
}

describe('Stars & Arrows card', () => {
  it.each([
    [
      { attack: 27, maxStack: 800 },
      [{ id: 'attack', text: '+27 attack', tone: 'accent' }],
      '800 per stack',
    ],
    [
      { attack: 27 },
      [{ id: 'attack', text: '+27 attack', tone: 'accent' }],
      undefined,
    ],
    [{ maxStack: 2000 }, undefined, '2,000 per stack'],
    [{}, undefined, undefined],
  ] as const)(
    'formats headline attack and quiet stack size from published facts',
    (facts, expectedValue, expectedLead) => {
      expect(starsAndArrows.card.value({ ...baseRow, ...facts })).toEqual(
        expectedValue,
      );
      expect(starsAndArrows.card.lead({ ...baseRow, ...facts })).toBe(
        expectedLead,
      );
    },
  );

  it('offers type pills only for types present in the category rows', () => {
    const withoutBullets = starsAndArrows.card.facets({
      rows: [
        categorized({ types: ['throwing-star'] }),
        categorized({ types: ['arrow'] }),
      ],
      coverage: undefined,
      relations: {},
    });
    expect(withoutBullets).toHaveLength(1);
    expect(withoutBullets[0]).toMatchObject({
      id: 'projectile-type',
      placement: 'results',
      options: [
        { value: 'throwing-star', label: 'Throwing stars' },
        { value: 'arrow', label: 'Arrows' },
      ],
    });

    const withBullets = starsAndArrows.card.facets({
      rows: [
        categorized({ types: ['throwing-star'] }),
        categorized({ types: ['arrow'] }),
        categorized({ types: ['bullet'] }),
      ],
      coverage: undefined,
      relations: {},
    });
    expect(withBullets[0]?.options).toEqual([
      { value: 'throwing-star', label: 'Throwing stars' },
      { value: 'arrow', label: 'Arrows' },
      { value: 'bullet', label: 'Bullets' },
    ]);

    expect(
      starsAndArrows.card.facets({
        rows: [],
        coverage: undefined,
        relations: {},
      }),
    ).toEqual([]);
  });

  it('extracts projectile types and sorts by attack', () => {
    const field = starsAndArrows.card
      .queryFields()
      .find(
        (entry) => typeof entry !== 'string' && entry.id === 'projectileTypes',
      );
    expect(field).toBeDefined();
    if (
      field === undefined ||
      typeof field === 'string' ||
      typeof field.accessor !== 'function'
    ) {
      return;
    }
    expect(
      field.accessor(categorized({ types: ['throwing-star', 'potion'] })),
    ).toEqual(['throwing-star']);
    expect(starsAndArrows.card.sortOptions).toEqual([
      { label: 'Attack (high to low)', field: 'attack', direction: 'desc' },
      { label: 'Attack (low to high)', field: 'attack', direction: 'asc' },
    ]);
  });
});
