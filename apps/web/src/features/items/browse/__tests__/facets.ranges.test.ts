import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import { getItemFacets } from '../facets';
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

function facetsFor({
  scope,
  childSlug,
  rows,
}: {
  readonly scope: 'use' | 'setup';
  readonly childSlug: 'recovery' | 'chairs';
  readonly rows: readonly ItemRow[];
}) {
  const categoryScope = ITEM_SCOPES[scope];
  const child = categoryScope.children.find(({ slug }) => slug === childSlug);
  if (!child) throw new Error(`Missing ${scope}/${childSlug} category`);
  return getItemFacets({
    category: { scope: categoryScope, child },
    coverage,
    roster: rows,
  });
}

describe('Items Browse numeric facets', () => {
  it('delegates Recovery buckets to the shared facet resolver', () => {
    const rows: readonly ItemRow[] = [
      { key: 'a', sourceId: '1', itemClass: 'consume', hp: 50, hpPercent: 10 },
      { key: 'b', sourceId: '2', itemClass: 'consume', hp: 150, mp: 20 },
      {
        key: 'c',
        sourceId: '3',
        itemClass: 'consume',
        hp: 450,
        mp: 40,
        mpPercent: 25,
      },
    ];
    const recovery = facetsFor({ scope: 'use', childSlug: 'recovery', rows });
    const hp = recovery.find(({ id }) => id === 'hp');
    const mp = recovery.find(({ id }) => id === 'mp');

    expect(recovery.find(({ id }) => id === 'recoveryRestores')).toMatchObject({
      label: 'Restores',
      quick: true,
    });
    expect(hp?.buckets).toBe('quantile');
    expect(mp?.buckets).toBe('quantile');
    expect(hp?.quick).toBe(true);
    expect(mp?.quick).toBeUndefined();
    expect(
      recovery.find(({ id }) => id === 'percentageRecovery'),
    ).toMatchObject({ label: 'Percentage recovery', kind: 'boolean' });
  });

  it('delegates chair buckets to the shared resolver and keeps Restores quick', () => {
    const rows: readonly ItemRow[] = [
      { key: 'a', sourceId: '1', itemClass: 'setup', seatHp: 20 },
      { key: 'b', sourceId: '2', itemClass: 'setup', seatHp: 50, seatMp: 40 },
      { key: 'c', sourceId: '3', itemClass: 'setup', seatMp: 10 },
    ];
    const chairs = facetsFor({ scope: 'setup', childSlug: 'chairs', rows });
    expect(chairs.find(({ id }) => id === 'chairRestores')).toMatchObject({
      label: 'Restores',
      quick: true,
    });
    expect(chairs.find(({ id }) => id === 'seatHp')?.buckets).toBe('quantile');
    expect(chairs.find(({ id }) => id === 'seatMp')?.buckets).toBe('quantile');
    expect(chairs.find(({ id }) => id === 'seatHp')?.label).toBe(
      'HP Recovered / 10s',
    );
    expect(chairs.find(({ id }) => id === 'seatMp')?.label).toBe(
      'MP Recovered / 10s',
    );
    expect(chairs.find(({ id }) => id === 'seatHp')?.quick).toBeUndefined();
    expect(chairs.find(({ id }) => id === 'seatMp')?.quick).toBeUndefined();
  });
});
