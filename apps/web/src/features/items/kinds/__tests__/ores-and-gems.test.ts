import { describe, expect, it } from 'vitest';

import type { CategorizedItemRow } from '../../browse/project';
import type { ProjectedRelations } from '../../browse/relation-projection';
import { oresAndGems } from '../ores-and-gems';

function row({
  types = ['ore'],
  monsters,
  quests,
  recipes,
}: {
  readonly types?: CategorizedItemRow['types'];
  readonly monsters?: number;
  readonly quests?: number;
  readonly recipes?: number;
} = {}): CategorizedItemRow {
  return {
    key: 'item:ore',
    sourceId: 'ore',
    itemClass: 'etc',
    name: 'Amber Ore',
    kind: 'ores-and-gems',
    kindPath: ['all', 'etc', 'ores-and-gems'],
    types,
    sellPrice: 35,
    ...(monsters === undefined ? {} : { monsterDropCount: monsters }),
    ...(quests === undefined ? {} : { neededForQuestCount: quests }),
    ...(recipes === undefined ? {} : { usedInRecipeCount: recipes }),
  };
}

const relations: ProjectedRelations = {
  'monster-drop': {
    targets: [{ publicId: 'monster:one', name: 'Paper Beast' }],
    byItem: { ore: [0] },
  },
  'needed-for-quest': {
    targets: [{ publicId: 'quest:one', name: 'Amber Errand' }],
    byItem: { ore: [0] },
  },
  'used-in-recipe': {
    targets: [{ name: 'Amber Mixture' }],
    byItem: { ore: [0] },
  },
};

describe('Ores & Gems card', () => {
  it('shows monsters then quests, without recipe or refining facts', () => {
    const item = row({ monsters: 1, quests: 1, recipes: 3 });
    expect(oresAndGems.relations).toEqual(['monster-drop', 'needed-for-quest']);
    expect(oresAndGems.card.lead(item)).toBe('Sells for 35 mesos');
    expect(
      oresAndGems.card
        .facts(item, { coverage: undefined, relations })
        .map((fact) => fact.label),
    ).toEqual(['Dropped by Paper Beast', 'Required by Amber Errand']);
  });

  it('shows only the identity header when no monster or quest is published', () => {
    expect(
      oresAndGems.card.facts(row({ recipes: 1 }), {
        coverage: undefined,
        relations: {},
      }),
    ).toEqual([]);
  });

  it('hides quest requirements whose role is unestablished', () => {
    expect(
      oresAndGems.card.facts(row({ quests: 1 }), {
        coverage: undefined,
        relations: {
          'needed-for-quest': {
            targets: [],
            byItem: {},
            unestablished: ['ore'],
          },
        },
      }),
    ).toEqual([]);
  });

  it('orders published types and offers only named relation filters', () => {
    const fields = oresAndGems.card.queryFields({
      coverage: undefined,
      relations,
    });
    const rank = fields.find(
      (field) => typeof field !== 'string' && field.id === 'typeRank',
    );
    const accessor =
      rank && typeof rank !== 'string' ? rank.accessor : undefined;
    expect(
      typeof accessor === 'function'
        ? [
            accessor(row({ types: ['ore'] })),
            accessor(row({ types: ['refined-material'] })),
            accessor(row({ types: ['gem'] })),
          ]
        : undefined,
    ).toEqual([0, 1, 2]);
    expect(oresAndGems.card.defaultSort).toEqual({
      label: 'Type',
      field: 'typeRank',
      direction: 'asc',
    });
    expect(
      oresAndGems.card
        .facets({ rows: [row()], coverage: undefined, relations })
        .map((facet) => facet.label),
    ).toEqual(['Monster', 'Quest']);
    expect(
      oresAndGems.card.facets({
        rows: [row()],
        coverage: undefined,
        relations: {
          'monster-drop': {
            targets: [{ name: 'Unnamed Beast' }],
            byItem: {},
          },
        },
      }),
    ).toEqual([]);
  });
});
