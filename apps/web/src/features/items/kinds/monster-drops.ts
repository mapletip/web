import type { RecordCardInlineLabel } from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import type { CategorizedItemRow } from '../browse/project';
import type { ProjectedRelations } from '../browse/relation-projection';
import { formatSellPrice } from '../browse/sell-price';

import {
  dropSourceLine,
  hasQuestUse,
  notRequiredLabel,
  questUseLabel,
  recipeUseLabel,
} from './relation-facts';
import { relationFilter, relationQueryField } from './relation-filter';
import type { ItemKind } from './types';

function hasNoUses({
  row,
  coverage,
  relations,
}: {
  readonly row: {
    readonly sourceId: string;
    readonly neededForQuestCount?: number;
    readonly usedInRecipeCount?: number;
  };
  readonly coverage: ItemBrowseCoverage | undefined;
  readonly relations: ProjectedRelations;
}): boolean {
  return (
    coverage?.relationships['needed-for-quest'] === 'complete' &&
    relations['needed-for-quest'] !== undefined &&
    coverage.relationships['used-in-recipe'] === 'complete' &&
    (row.neededForQuestCount ?? 0) === 0 &&
    (row.usedInRecipeCount ?? 0) === 0 &&
    !relations['needed-for-quest']?.unestablished?.includes(row.sourceId)
  );
}

/** How many Monster Drops no quest or recipe uses, for the landing lookup. */
export function countNotRequiredDrops({
  rows,
  coverage,
  relations,
}: {
  readonly rows: readonly CategorizedItemRow[];
  readonly coverage: ItemBrowseCoverage;
  readonly relations: ProjectedRelations;
}): number {
  return rows.filter(
    (row) =>
      row.kind === 'monster-drops' && hasNoUses({ row, coverage, relations }),
  ).length;
}

export const monsterDrops = {
  id: 'monster-drops',
  group: 'etc',
  slug: 'monster-drops',
  label: 'Monster Drops',
  iconContentId:
    '752e1848b26d249f7728fa2b290b6077872e79dea71db2d18aea20c8605889e5',
  matches: (row) =>
    row.itemClass === 'etc' && row.types?.includes('monster-material') === true,
  relations: ['needed-for-quest', 'used-in-recipe', 'monster-drop'],
  card: {
    layout: 'quietIdentity',
    lead: (row) => formatSellPrice({ sellPrice: row.sellPrice }),
    inlineLabels: (
      row,
      { coverage, relations },
    ): readonly RecordCardInlineLabel[] => {
      if (hasNoUses({ row, coverage, relations })) return [notRequiredLabel];
      return [
        ...(hasQuestUse({
          sourceId: row.sourceId,
          count: row.neededForQuestCount,
          relations,
        })
          ? [questUseLabel]
          : []),
        ...((row.usedInRecipeCount ?? 0) > 0 ? [recipeUseLabel] : []),
      ];
    },
    detailLine: (row, { relations }) =>
      dropSourceLine({ sourceId: row.sourceId, relations }),
    facets: ({ coverage, relations, rows }) => [
      {
        id: 'drop-use',
        field: 'dropUses',
        label: 'Uses',
        kind: 'multi-select',
        placement: 'results',
        options: [
          { value: 'quests', label: 'Required by quests' },
          { value: 'recipes', label: 'Used in recipes' },
          ...(coverage?.relationships['needed-for-quest'] === 'complete' &&
          relations['needed-for-quest'] !== undefined &&
          coverage.relationships['used-in-recipe'] === 'complete'
            ? [{ value: 'not-required', label: 'Not required' }]
            : []),
        ],
      },
      ...relationFilter({ relations, kind: 'monster-drop', label: 'Monster' }),
      ...relationFilter({
        relations,
        kind: 'needed-for-quest',
        label: 'Quest',
      }),
      ...(rows.some((row) => row.sellPrice !== undefined)
        ? [
            {
              id: 'sell-price',
              field: 'sellPrice',
              label: 'Sell price',
              kind: 'range' as const,
            },
          ]
        : []),
    ],
    queryFields: ({ coverage, relations }) => [
      {
        id: 'dropUses',
        accessor: (row) => [
          ...((row.neededForQuestCount ?? 0) > 0 &&
          relations['needed-for-quest']?.unestablished?.includes(
            row.sourceId,
          ) !== true
            ? ['quests']
            : []),
          ...((row.usedInRecipeCount ?? 0) > 0 ? ['recipes'] : []),
          ...(hasNoUses({ row, coverage, relations }) ? ['not-required'] : []),
        ],
        sortable: false,
      },
      relationQueryField({ relations, kind: 'monster-drop', label: 'Monster' }),
      relationQueryField({
        relations,
        kind: 'needed-for-quest',
        label: 'Quest',
      }),
      { id: 'sellPrice', accessor: 'sellPrice' },
      {
        id: 'neededForQuestCount',
        accessor: (row) => row.neededForQuestCount ?? 0,
        firstSortDirection: 'desc',
      },
    ],
    sortOptions: [
      {
        label: 'Most requiring quests',
        field: 'neededForQuestCount',
        direction: 'desc',
      },
      { label: 'Highest sell price', field: 'sellPrice', direction: 'desc' },
    ],
    defaultSort: { label: 'Name', field: 'name', direction: 'asc' },
  },
} satisfies ItemKind;
