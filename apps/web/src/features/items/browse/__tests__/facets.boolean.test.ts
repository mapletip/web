import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import { ITEM_FACET_CONFIGS } from '../facet-config';
import { getItemFacets, ITEM_QUERY_FIELDS } from '../facets';
import type { ItemRow } from '../project';

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

function queryValue({
  field,
  row,
}: {
  readonly field: string;
  readonly row: ItemRow;
}): unknown {
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
  it('offers no recorded use only with complete ETC relationship coverage', () => {
    const questItems = ITEM_SCOPES.etc.children.find(
      ({ slug }) => slug === 'quest-items',
    );
    const category = { scope: ITEM_SCOPES.etc, child: questItems };
    expect(getItemFacets({ category, coverage }).map(({ id }) => id)).toContain(
      'noRecordedQuestOrRecipeUse',
    );

    const incompleteCoverage: ItemBrowseCoverage = {
      ...coverage,
      relationships: {
        ...coverage.relationships,
        'used-in-recipe': 'partial',
      },
    };
    expect(
      getItemFacets({ category, coverage: incompleteCoverage }).map(
        ({ id }) => id,
      ),
    ).not.toContain('noRecordedQuestOrRecipeUse');
  });

  it('treats absent or zero quest and recipe counts as no recorded use', () => {
    expect(
      queryValue({
        field: 'noRecordedQuestOrRecipeUse',
        row: { key: 'a', sourceId: '1', itemClass: 'etc' },
      }),
    ).toBe(true);
    expect(
      queryValue({
        field: 'noRecordedQuestOrRecipeUse',
        row: {
          key: 'b',
          sourceId: '2',
          itemClass: 'etc',
          neededForQuestCount: 0,
          usedInRecipeCount: 0,
        },
      }),
    ).toBe(true);
    expect(
      queryValue({
        field: 'noRecordedQuestOrRecipeUse',
        row: {
          key: 'c',
          sourceId: '3',
          itemClass: 'etc',
          neededForQuestCount: 1,
        },
      }),
    ).toBe(false);
    expect(
      queryValue({
        field: 'noRecordedQuestOrRecipeUse',
        row: {
          key: 'd',
          sourceId: '4',
          itemClass: 'etc',
          usedInRecipeCount: 2,
        },
      }),
    ).toBe(false);
  });

  it('marks percentage recovery when either percentage field is present', () => {
    const query = ITEM_FACET_CONFIGS.percentageRecovery.getValue;
    expect(query({ key: 'a', sourceId: '1', itemClass: 'consume' })).toBe(
      false,
    );
    expect(
      query({ key: 'b', sourceId: '2', itemClass: 'consume', hpPercent: 0 }),
    ).toBe(true);
    expect(
      query({ key: 'c', sourceId: '3', itemClass: 'consume', mpPercent: 25 }),
    ).toBe(true);
  });

  it('derives Recovery and chair Restores choices from positive recorded fields', () => {
    const recovery = ITEM_FACET_CONFIGS.recoveryRestores.values;
    const chairs = ITEM_FACET_CONFIGS.chairRestores.values;

    expect(recovery({ key: 'a', sourceId: '1', itemClass: 'consume' })).toEqual(
      [],
    );
    expect(
      recovery({
        key: 'b',
        sourceId: '2',
        itemClass: 'consume',
        hpPercent: 30,
      }),
    ).toEqual(['hp-only']);
    expect(
      recovery({ key: 'c', sourceId: '3', itemClass: 'consume', mp: 40 }),
    ).toEqual(['mp-only']);
    expect(
      recovery({
        key: 'd',
        sourceId: '4',
        itemClass: 'consume',
        hp: 1,
        mpPercent: 20,
      }),
    ).toEqual(['hp-and-mp']);
    expect(
      recovery({ key: 'e', sourceId: '5', itemClass: 'consume', hp: 0 }),
    ).toEqual([]);

    expect(
      chairs({ key: 'f', sourceId: '6', itemClass: 'setup', seatHp: 50 }),
    ).toEqual(['hp-only']);
    expect(
      chairs({ key: 'g', sourceId: '7', itemClass: 'setup', seatMp: 40 }),
    ).toEqual(['mp-only']);
    expect(
      chairs({
        key: 'h',
        sourceId: '8',
        itemClass: 'setup',
        seatHp: 50,
        seatMp: 40,
      }),
    ).toEqual(['hp-and-mp']);
  });
});
