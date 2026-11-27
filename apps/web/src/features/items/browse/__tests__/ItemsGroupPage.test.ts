import { describe, expect, it } from 'vitest';

import { buildGroupShelves } from '../ItemsGroupPage';
import type { CategorizedItemRow } from '../project';

function makeRow({
  sourceId,
  name,
  group = 'etc',
  kind,
  types,
}: {
  readonly sourceId: string;
  readonly name: string;
  readonly group?: 'use' | 'etc' | 'setup' | 'cash';
  readonly kind: string;
  readonly types?: CategorizedItemRow['types'];
}): CategorizedItemRow {
  return {
    key: `item:test:${sourceId}`,
    sourceId,
    itemClass: 'etc',
    name,
    kind,
    ...(types === undefined ? {} : { types }),
    kindPath: ['all', group, kind],
  };
}

describe('buildGroupShelves', () => {
  it('orders shelves in rail order, omits empty categories, sorts by default order, and caps to one widest row', () => {
    const rows: CategorizedItemRow[] = [
      // Unrelated group row should be ignored.
      makeRow({
        sourceId: 'use-1',
        name: 'Alpha Potion',
        group: 'use',
        kind: 'potions-and-food',
      }),
      // Out of rail order and out of alphabetical order.
      makeRow({ sourceId: 'etc-q1', name: 'Quest Token', kind: 'quest-items' }),
      makeRow({
        sourceId: 'etc-d6',
        name: 'Drop 06',
        kind: 'monster-drops',
      }),
      makeRow({
        sourceId: 'etc-d2',
        name: 'Drop 02',
        kind: 'monster-drops',
      }),
      makeRow({
        sourceId: 'etc-d4',
        name: 'Drop 04',
        kind: 'monster-drops',
      }),
      makeRow({
        sourceId: 'etc-d1',
        name: 'Drop 01',
        kind: 'monster-drops',
      }),
      makeRow({
        sourceId: 'etc-d5',
        name: 'Drop 05',
        kind: 'monster-drops',
      }),
      makeRow({
        sourceId: 'etc-d3',
        name: 'Drop 03',
        kind: 'monster-drops',
      }),
      makeRow({
        sourceId: 'etc-o2',
        name: 'Zinc Ore',
        kind: 'ores-and-gems',
        types: ['ore'],
      }),
      makeRow({
        sourceId: 'etc-o1',
        name: 'Amber Ore',
        kind: 'ores-and-gems',
        types: ['ore'],
      }),
      makeRow({
        sourceId: 'etc-g1',
        name: 'A Gem',
        kind: 'ores-and-gems',
        types: ['gem'],
      }),
      makeRow({
        sourceId: 'etc-i1',
        name: 'A Refined Piece',
        kind: 'ores-and-gems',
        types: ['refined-material'],
      }),
    ];

    const shelves = buildGroupShelves({ group: 'etc', rows });

    // Rail order for ETC: Ores & Gems, Monster Drops, Quest Items (Other ETC omitted because empty).
    expect(shelves.map((shelf) => shelf.kind.id)).toEqual([
      'ores-and-gems',
      'monster-drops',
      'quest-items',
    ]);

    expect(shelves[0]?.totalCount).toBe(4);
    expect(shelves[0]?.previewRows.map((row) => row.name)).toEqual([
      'Amber Ore',
      'Zinc Ore',
      'A Refined Piece',
    ]);

    expect(shelves[1]?.totalCount).toBe(6);
    // Ores & Gems and Monster Drops use identity cards, three to the widest row.
    expect(shelves[1]?.previewRows.map((row) => row.name)).toEqual([
      'Drop 01',
      'Drop 02',
      'Drop 03',
    ]);

    expect(shelves[2]?.totalCount).toBe(1);
    expect(shelves[2]?.previewRows.map((row) => row.name)).toEqual([
      'Quest Token',
    ]);
  });
});
