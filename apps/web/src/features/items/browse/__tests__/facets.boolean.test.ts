import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import {
  getItemFacets as declareItemFacets,
  ITEM_QUERY_FIELDS,
} from '../facets';
import type { ItemRow } from '../project';

function getItemFacets(
  category: Parameters<typeof declareItemFacets>[0]['category'],
  coverage: ItemBrowseCoverage,
  rows: readonly ItemRow[],
  roster: readonly ItemRow[] = rows,
) {
  return declareItemFacets({ category, coverage, roster });
}

const coverage: ItemBrowseCoverage = {
  relationships: {
    'cash-shop-listing': 'complete',
    'found-in-container': 'complete',
    'made-by-recipe': 'complete',
    'monster-drop': 'partial',
    'needed-for-quest': 'complete',
    'quest-reward': 'complete',
    'used-in-recipe': 'complete',
  },
  scrollTier: 'complete',
};

function queryValue(field: string, row: ItemRow): unknown {
  const queryField = ITEM_QUERY_FIELDS.find(
    (candidate) => typeof candidate === 'object' && candidate.id === field,
  );
  if (
    typeof queryField !== 'object' ||
    typeof queryField.accessor !== 'function'
  ) {
    return undefined;
  }
  return queryField.accessor(row);
}

describe('Items Browse boolean facets', () => {
  it('offers no-recorded-use only when quest and recipe coverage is complete', () => {
    const category = { scope: ITEM_SCOPES.etc };
    const rows: readonly ItemRow[] = [
      {
        key: 'a',
        sourceId: '1',
        itemClass: 'etc',
        neededForQuestCount: 1,
      },
      { key: 'b', sourceId: '2', itemClass: 'etc' },
    ];

    expect(
      getItemFacets(category, coverage, rows, rows).map(({ id }) => id),
    ).toContain('noRecordedQuestOrRecipeUse');

    const incompleteCoverage: ItemBrowseCoverage = {
      ...coverage,
      relationships: {
        ...coverage.relationships,
        'used-in-recipe': 'partial',
      },
    };
    expect(
      getItemFacets(category, incompleteCoverage, rows, rows).map(
        ({ id }) => id,
      ),
    ).not.toContain('noRecordedQuestOrRecipeUse');
  });

  it('treats absent or zero quest and recipe counts as no recorded use', () => {
    expect(
      queryValue('noRecordedQuestOrRecipeUse', {
        key: 'a',
        sourceId: '1',
        itemClass: 'etc',
      }),
    ).toBe(true);
    expect(
      queryValue('noRecordedQuestOrRecipeUse', {
        key: 'b',
        sourceId: '2',
        itemClass: 'etc',
        neededForQuestCount: 0,
        questRewardCount: 0,
        usedInRecipeCount: 0,
        madeByRecipeCount: 0,
      }),
    ).toBe(true);
    expect(
      queryValue('noRecordedQuestOrRecipeUse', {
        key: 'c',
        sourceId: '3',
        itemClass: 'etc',
        neededForQuestCount: 1,
      }),
    ).toBe(false);
    expect(
      queryValue('noRecordedQuestOrRecipeUse', {
        key: 'd',
        sourceId: '4',
        itemClass: 'etc',
        madeByRecipeCount: 2,
      }),
    ).toBe(true);
    expect(
      queryValue('noRecordedQuestOrRecipeUse', {
        key: 'e',
        sourceId: '5',
        itemClass: 'etc',
        questRewardCount: 2,
      }),
    ).toBe(true);
  });

  it('marks percentage recovery when either percentage field is present', () => {
    expect(
      queryValue('percentageRecovery', {
        key: 'a',
        sourceId: '1',
        itemClass: 'consume',
      }),
    ).toBe(false);
    expect(
      queryValue('percentageRecovery', {
        key: 'b',
        sourceId: '2',
        itemClass: 'consume',
        hpPercent: 0,
      }),
    ).toBe(true);
    expect(
      queryValue('percentageRecovery', {
        key: 'c',
        sourceId: '3',
        itemClass: 'consume',
        mpPercent: 25,
      }),
    ).toBe(true);
  });
});
