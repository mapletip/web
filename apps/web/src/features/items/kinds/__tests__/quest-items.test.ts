import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import type { CategorizedItemRow } from '../../browse/project';
import type { ProjectedRelation } from '../../browse/relation-projection';
import { questItems } from '../quest-items';

const relation: ProjectedRelation = {
  targets: [
    { publicId: 'quest-a', name: 'Amber Errand' },
    { publicId: 'quest-b', name: 'Zinc Errand' },
  ],
  byItem: { 'item:one': [0], 'item:many': [0, 1] },
};

const complete = {
  relationships: { 'needed-for-quest': 'complete' },
} as ItemBrowseCoverage;
const partial = {
  relationships: { 'needed-for-quest': 'partial' },
} as ItemBrowseCoverage;

function row(options: { key: string; count?: number }): CategorizedItemRow {
  return {
    key: options.key,
    sourceId: options.key,
    name: 'Practice Token',
    itemClass: 'etc',
    kind: 'quest-items',
    kindPath: ['all', 'etc', 'quest-items'],
    ...(options.count === undefined
      ? {}
      : { neededForQuestCount: options.count }),
  };
}

describe('Quest Items card', () => {
  it('names one quest and uses row counts for several or when the roster failed', () => {
    const context = {
      coverage: complete,
      relations: { 'needed-for-quest': relation },
    };
    expect(
      questItems.card.lead(row({ key: 'item:one', count: 1 }), context),
    ).toBe('Required by Amber Errand');
    expect(
      questItems.card.lead(row({ key: 'item:one', count: 3 }), context),
    ).toBe('Required by Amber Errand');
    expect(
      questItems.card.lead(row({ key: 'item:many', count: 3 }), context),
    ).toBe('Required by 3 quests');
    expect(
      questItems.card.lead(row({ key: 'item:one', count: 1 }), {
        coverage: complete,
        relations: {},
      }),
    ).toBe('Required by 1 quest');
  });

  it('shows a zero lead and pill only with complete coverage', () => {
    const empty = row({ key: 'item:empty', count: 0 });
    expect(
      questItems.card.lead(empty, { coverage: complete, relations: {} }),
    ).toBe('No known quest');
    expect(
      questItems.card.lead(empty, { coverage: partial, relations: {} }),
    ).toBeUndefined();
    expect(
      questItems.card
        .facets({ rows: [empty], coverage: complete, relations: {} })[0]
        ?.options?.map((option) => option.label),
    ).toEqual(['Required by a quest', 'No known quest']);
    expect(
      questItems.card
        .facets({ rows: [empty], coverage: partial, relations: {} })[0]
        ?.options?.map((option) => option.label),
    ).toEqual(['Required by a quest']);
  });

  it('offers the Quest picker only with published names', () => {
    const rows = [row({ key: 'item:one', count: 1 })];
    expect(
      questItems.card
        .facets({ rows, coverage: complete, relations: {} })
        .map((facet) => facet.id),
    ).toEqual(['quest-status']);
    expect(
      questItems.card
        .facets({
          rows,
          coverage: complete,
          relations: { 'needed-for-quest': relation },
        })
        .map((facet) => facet.id),
    ).toEqual(['quest-status', 'quest']);
    const fields = questItems.card.queryFields({
      coverage: complete,
      relations: { 'needed-for-quest': relation },
    });
    expect(fields.find((field) => field.id === 'quest')).toBeDefined();
  });
});
