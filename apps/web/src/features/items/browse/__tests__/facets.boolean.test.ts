import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import { getItemFacets, ITEM_QUERY_FIELDS } from '../facets';
import type { ItemRow } from '../project';

const coverage: ItemBrowseCoverage = {
  relationships: {
    'cash-shop-listing': 'complete',
    'found-in-container': 'complete',
    'made-by-recipe': 'complete',
    'monster-drop': 'complete',
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
}) {
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
  it('uses boolean state for quest flags and preserves unknown values', () => {
    const rows: readonly ItemRow[] = [
      { key: 'a', sourceId: '1', itemClass: 'etc', questFlag: true },
      { key: 'b', sourceId: '2', itemClass: 'etc', questFlag: false },
      { key: 'c', sourceId: '3', itemClass: 'etc' },
    ];
    const facets = getItemFacets({
      category: { scope: ITEM_SCOPES.etc },
      coverage,
    });
    const questFlag = facets.find((facet) => facet.field === 'questFlag');

    expect(questFlag?.kind).toBe('boolean');
    expect(queryValue({ field: 'questFlag', row: rows[0]! })).toBe(true);
    expect(queryValue({ field: 'questFlag', row: rows[1]! })).toBe(false);
    expect(queryValue({ field: 'questFlag', row: rows[2]! })).toBeUndefined();
  });

  it('uses boolean state for direct scroll targets', () => {
    const rows: readonly ItemRow[] = [
      { key: 'a', sourceId: '1', itemClass: 'consume', directTargetCount: 2 },
      { key: 'b', sourceId: '2', itemClass: 'consume' },
    ];
    const scrolls = ITEM_SCOPES.use.children.find(
      (child) => child.slug === 'scrolls',
    );
    const facets = getItemFacets({
      category: { scope: ITEM_SCOPES.use, child: scrolls },
      coverage,
    });
    const directTargets = facets.find(
      (facet) => facet.field === 'scrollDirect',
    );

    expect(directTargets?.kind).toBe('boolean');
    expect(queryValue({ field: 'scrollDirect', row: rows[0]! })).toBe(true);
    expect(queryValue({ field: 'scrollDirect', row: rows[1]! })).toBe(false);
  });
});
