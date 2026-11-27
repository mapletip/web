import { formatSellPrice } from '../browse/sell-price';

import { dropSourceLine, hasQuestUse, questUseLabel } from './relation-facts';
import { relationFilter, relationQueryField } from './relation-filter';
import type { ItemKind } from './types';

const TYPE_ORDER = ['ore', 'refined-material', 'gem'] as const;

function typeRank({
  types,
}: {
  readonly types: readonly string[] | undefined;
}): number {
  const rank = TYPE_ORDER.findIndex((type) => types?.includes(type));
  return rank < 0 ? TYPE_ORDER.length : rank;
}

export const oresAndGems = {
  id: 'ores-and-gems',
  group: 'etc',
  slug: 'ores-and-gems',
  label: 'Ores & Gems',
  iconContentId:
    '9bc102b58369315c30222c8c54107371efd84b875e76d5c83665c42428049cf4',
  matches: (row) =>
    row.itemClass === 'etc' &&
    row.types?.some(
      (type) => type === 'ore' || type === 'gem' || type === 'refined-material',
    ) === true,
  relations: ['monster-drop', 'needed-for-quest'],
  card: {
    layout: 'quietIdentity',
    lead: (row) => formatSellPrice({ sellPrice: row.sellPrice }),
    inlineLabels: (row, { relations }) =>
      hasQuestUse({
        sourceId: row.sourceId,
        count: row.neededForQuestCount,
        relations,
      })
        ? [questUseLabel]
        : [],
    detailLine: (row, { relations }) =>
      dropSourceLine({ sourceId: row.sourceId, relations }),
    detailFirst: true,
    facets: ({ relations }) => [
      ...relationFilter({ relations, kind: 'monster-drop', label: 'Monster' }),
      ...relationFilter({
        relations,
        kind: 'needed-for-quest',
        label: 'Quest',
      }),
    ],
    queryFields: ({ relations }) => [
      relationQueryField({ relations, kind: 'monster-drop', label: 'Monster' }),
      relationQueryField({
        relations,
        kind: 'needed-for-quest',
        label: 'Quest',
      }),
      { id: 'typeRank', accessor: (row) => typeRank({ types: row.types }) },
    ],
    defaultSort: { label: 'Type', field: 'typeRank', direction: 'asc' },
  },
} satisfies ItemKind;
