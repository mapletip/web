import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import { getItemFacets } from '../facets';

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
}: {
  readonly scope: 'use' | 'setup';
  readonly childSlug: 'recovery' | 'chairs';
}) {
  const categoryScope = ITEM_SCOPES[scope];
  return getItemFacets({
    category: {
      scope: categoryScope,
      child: categoryScope.children.find(({ slug }) => slug === childSlug),
    },
    coverage,
  });
}

describe('Items Browse fixed range facets', () => {
  it('uses explicit Recovery buckets and quick facets', () => {
    const recovery = facetsFor({ scope: 'use', childSlug: 'recovery' });
    const hp = recovery.find(({ id }) => id === 'hp');
    const mp = recovery.find(({ id }) => id === 'mp');

    expect(recovery.find(({ id }) => id === 'recoveryRestores')).toMatchObject({
      label: 'Restores',
      quick: true,
    });
    expect(hp?.buckets).toEqual([
      { value: '1-99', label: '1–99', min: 1, max: 99 },
      { value: '100-299', label: '100–299', min: 100, max: 299 },
      { value: '300-599', label: '300–599', min: 300, max: 599 },
      { value: '600-999', label: '600–999', min: 600, max: 999 },
      { value: '1000-1999', label: '1000–1999', min: 1000, max: 1999 },
      { value: '2000+', label: '2000+', min: 2000 },
    ]);
    expect(mp?.buckets).toEqual(hp?.buckets);
    expect(hp?.quick).toBe(true);
    expect(mp?.quick).toBeUndefined();
    expect(
      recovery.find(({ id }) => id === 'percentageRecovery'),
    ).toMatchObject({ label: 'Percentage recovery', kind: 'boolean' });
  });

  it('uses explicit chair buckets and exposes only Restores as a quick facet', () => {
    const chairs = facetsFor({ scope: 'setup', childSlug: 'chairs' });
    expect(chairs.find(({ id }) => id === 'chairRestores')).toMatchObject({
      label: 'Restores',
      quick: true,
    });
    expect(chairs.find(({ id }) => id === 'seatHp')?.buckets).toEqual([
      { value: '1-29', label: '1–29', min: 1, max: 29 },
      { value: '30-39', label: '30–39', min: 30, max: 39 },
      { value: '40-49', label: '40–49', min: 40, max: 49 },
      { value: '50-59', label: '50–59', min: 50, max: 59 },
      { value: '60+', label: '60+', min: 60 },
    ]);
    expect(chairs.find(({ id }) => id === 'seatMp')?.buckets).toEqual([
      { value: '1-19', label: '1–19', min: 1, max: 19 },
      { value: '20-29', label: '20–29', min: 20, max: 29 },
      { value: '30-39', label: '30–39', min: 30, max: 39 },
      { value: '40-59', label: '40–59', min: 40, max: 59 },
      { value: '60+', label: '60+', min: 60 },
    ]);
    expect(chairs.find(({ id }) => id === 'seatHp')?.quick).toBeUndefined();
    expect(chairs.find(({ id }) => id === 'seatMp')?.quick).toBeUndefined();
  });

  it('prefixes generated projectile attack ranges once', () => {
    const child = ITEM_SCOPES.use.children.find(
      ({ slug }) => slug === 'throwing-stars',
    );
    expect(child).toBeDefined();
    if (!child) return;

    const attack = getItemFacets({
      category: { scope: ITEM_SCOPES.use, child },
      coverage,
    }).find(({ id }) => id === 'attack');

    expect(attack).toMatchObject({
      label: 'Attack',
      kind: 'range',
      buckets: 'quantile',
      valuePrefix: '+',
    });
  });
});
