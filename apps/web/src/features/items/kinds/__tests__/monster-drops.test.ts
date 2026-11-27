import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import type { CategorizedItemRow } from '../../browse/project';
import type { ProjectedRelations } from '../../browse/relation-projection';
import { countNotRequiredDrops, monsterDrops } from '../monster-drops';

const complete = {
  relationships: {
    'needed-for-quest': 'complete',
    'used-in-recipe': 'complete',
  },
} as ItemBrowseCoverage;
const partial = {
  relationships: {
    'needed-for-quest': 'partial',
    'used-in-recipe': 'complete',
  },
} as ItemBrowseCoverage;

function row(options: {
  key?: string;
  quests?: number;
  recipes?: number;
  monsters?: number;
  sellPrice?: number;
}): CategorizedItemRow {
  return {
    key: options.key ?? 'item:one',
    sourceId: (options.key ?? 'item:one').replace('item:', ''),
    name: 'Practice Token',
    itemClass: 'etc',
    kind: 'monster-drops',
    kindPath: ['all', 'etc', 'monster-drops'],
    ...(options.quests === undefined
      ? {}
      : { neededForQuestCount: options.quests }),
    ...(options.recipes === undefined
      ? {}
      : { usedInRecipeCount: options.recipes }),
    ...(options.monsters === undefined
      ? {}
      : { monsterDropCount: options.monsters }),
    ...(options.sellPrice === undefined
      ? {}
      : { sellPrice: options.sellPrice }),
  };
}

const relations: ProjectedRelations = {
  'needed-for-quest': {
    targets: [{ publicId: 'quest:a', name: 'Amber Errand' }],
    byItem: { one: [0] },
    unestablished: ['unknown'],
  },
  'used-in-recipe': {
    targets: [{ publicId: 'recipe:a', name: 'Amber Mixture' }],
    byItem: { one: [0] },
  },
  'monster-drop': {
    targets: [{ publicId: 'monster:a', name: 'Amber Beast' }],
    byItem: { one: [0] },
  },
};

function labels(options: {
  row: CategorizedItemRow;
  coverage?: ItemBrowseCoverage;
  relations?: ProjectedRelations;
}): readonly string[] {
  return monsterDrops.card
    .facts(options.row, {
      coverage: options.coverage,
      relations: options.relations ?? {},
    })
    .map((fact) => fact.label);
}

describe('Monster Drops card', () => {
  it('shows named single relationships and the published sell price', () => {
    const item = row({ quests: 1, recipes: 1, monsters: 1, sellPrice: 35 });
    expect(monsterDrops.card.lead(item)).toBe('Sells for 35 mesos');
    expect(labels({ row: item, coverage: complete, relations })).toEqual([
      'Required by Amber Errand',
      'Used in Amber Mixture',
      'Dropped by Amber Beast',
    ]);
  });

  it('uses row counts for many relationships and absent names', () => {
    expect(
      labels({
        row: row({ quests: 6, recipes: 4, monsters: 3 }),
        coverage: complete,
        relations,
      }),
    ).toEqual([
      'Required by 6 quests',
      'Used in 4 recipes',
      'Dropped by 3 monsters',
    ]);
    expect(
      labels({
        row: row({ quests: 1, recipes: 1, monsters: 1 }),
        relations: {},
      }),
    ).toEqual([
      'Required by 1 quest',
      'Used in 1 recipe',
      'Dropped by 1 monster',
    ]);
    expect(
      labels({ row: row({ quests: 1, recipes: 1 }), relations: {} }),
    ).toEqual(['Required by 1 quest', 'Used in 1 recipe']);
  });

  it('shows Not required only with complete coverage and established meaning', () => {
    const unused = row({ key: 'item:empty', quests: 0, recipes: 0 });
    expect(labels({ row: unused, coverage: complete, relations })).toEqual([
      'Not required',
    ]);
    expect(labels({ row: unused, coverage: partial, relations })).toEqual([]);
    expect(
      labels({
        row: row({ key: 'item:unknown', quests: 0, recipes: 0 }),
        coverage: complete,
        relations,
      }),
    ).toEqual([]);
    expect(
      monsterDrops.card.facts(unused, { coverage: complete, relations })[0]
        ?.detail,
    ).toBe('No quest or recipe uses it');
  });

  it('does not say Not required when the quest roster is missing', () => {
    const item = row({ key: 'item:unlisted', quests: 0, recipes: 0 });
    expect(labels({ row: item, coverage: complete, relations: {} })).toEqual(
      [],
    );
    expect(
      countNotRequiredDrops({
        rows: [item],
        coverage: complete,
        relations: {},
      }),
    ).toBe(0);
    const fields = monsterDrops.card.queryFields({
      coverage: complete,
      relations: {},
    });
    const uses = fields.find(
      (field) => typeof field !== 'string' && field.id === 'dropUses',
    );
    expect(
      uses && typeof uses !== 'string' && typeof uses.accessor === 'function'
        ? uses.accessor(item)
        : undefined,
    ).toEqual([]);
    expect(
      monsterDrops.card.facets({
        rows: [item],
        coverage: complete,
        relations: {},
      })[0]?.options,
    ).not.toContainEqual({ value: 'not-required', label: 'Not required' });
  });

  it('offers overlapping pills, published filters, and both sort orders', () => {
    const item = row({ quests: 2, recipes: 1, monsters: 1, sellPrice: 35 });
    const fields = monsterDrops.card.queryFields({
      coverage: complete,
      relations,
    });
    const uses = fields.find(
      (field) => typeof field !== 'string' && field.id === 'dropUses',
    );
    expect(
      uses && typeof uses !== 'string' && typeof uses.accessor === 'function'
        ? uses.accessor(item)
        : undefined,
    ).toEqual(['quests', 'recipes']);
    expect(
      monsterDrops.card
        .facets({ rows: [item], coverage: complete, relations })
        .map((facet) => facet.label),
    ).toEqual(['Uses', 'Monster', 'Quest', 'Sell price']);
    expect(monsterDrops.card.sortOptions.map((option) => option.field)).toEqual(
      ['neededForQuestCount', 'sellPrice'],
    );
  });
});
