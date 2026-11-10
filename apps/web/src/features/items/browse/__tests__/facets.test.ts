import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import { ITEM_FACET_CONFIGS } from '../facet-config';
import { getItemFacets } from '../facets';
import { UPGRADE_TARGET_LABELS } from '../labels';
import type { ItemRow } from '../project';
import type { ItemCategorySelection } from '../routing';

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

const categories = [
  { scope: ITEM_SCOPES.all },
  { scope: ITEM_SCOPES.use },
  ...ITEM_SCOPES.use.children.map((child) => ({
    scope: ITEM_SCOPES.use,
    child,
  })),
  { scope: ITEM_SCOPES.etc },
  ...ITEM_SCOPES.etc.children.map((child) => ({
    scope: ITEM_SCOPES.etc,
    child,
  })),
  { scope: ITEM_SCOPES.setup },
  ...ITEM_SCOPES.setup.children.map((child) => ({
    scope: ITEM_SCOPES.setup,
    child,
  })),
  { scope: ITEM_SCOPES.cash },
  ...ITEM_SCOPES.cash.children.map((child) => ({
    scope: ITEM_SCOPES.cash,
    child,
  })),
] satisfies readonly ItemCategorySelection[];

function facetsFor(category: ItemCategorySelection) {
  return getItemFacets({ category, coverage });
}

function facetIds(category: ItemCategorySelection): readonly string[] {
  return facetsFor(category).map(({ id }) => id);
}

function expectedFacetIds(category: ItemCategorySelection): readonly string[] {
  const expected = ['quests', 'crafting', 'sources'];
  const childSlug = category.child?.slug;

  if (category.scope.slug === 'etc') {
    expected.push('noRecordedQuestOrRecipeUse');
  }
  if (category.scope.slug === 'cash' && childSlug !== 'pets') {
    expected.push('cashShop');
  }
  if (category.scope.slug === 'use' && childSlug === 'recovery') {
    expected.push('recoveryRestores', 'hp', 'mp', 'percentageRecovery');
  }
  if (category.scope.slug === 'use' && childSlug === 'scrolls') {
    expected.push(
      'scrollTarget',
      'scrollStat',
      'scrollSuccess',
      'scrollDestructionChance',
    );
  }
  if (
    category.scope.slug === 'use' &&
    ['throwing-stars', 'arrows', 'bullets'].includes(childSlug ?? '')
  ) {
    expected.push('attack');
  }
  if (category.scope.slug === 'setup' && childSlug === 'chairs') {
    expected.push('chairRestores', 'seatHp', 'seatMp');
  }

  return expected;
}

describe('Items Browse facets', () => {
  it('offers the three shared relationship facets on every scope and child', () => {
    for (const category of categories) {
      expect(facetIds(category)).toEqual(expectedFacetIds(category));
    }
  });

  it('labels relationship choices and applies build coverage', () => {
    const all = facetsFor({ scope: ITEM_SCOPES.all });
    expect(all.find(({ id }) => id === 'quests')?.options).toEqual([
      { value: 'needed-for-quest', label: 'Required for a quest' },
      { value: 'quest-reward', label: 'Quest reward' },
    ]);
    expect(all.find(({ id }) => id === 'crafting')?.options).toEqual([
      { value: 'used-in-recipe', label: 'Used as an ingredient' },
      { value: 'made-by-recipe', label: 'Made by recipe' },
    ]);
    expect(all.find(({ id }) => id === 'sources')?.options).toEqual([
      { value: 'found-in-container', label: 'Found in a box' },
    ]);
    expect(
      facetsFor({ scope: ITEM_SCOPES.cash }).find(({ id }) => id === 'cashShop')
        ?.options,
    ).toEqual([
      { value: 'cash-shop-listing', label: 'Listed in the Cash Shop' },
    ]);

    const partialCoverage = {
      ...coverage,
      relationships: {
        ...coverage.relationships,
        'found-in-container': 'partial',
        'quest-reward': 'unsupported',
      },
    } satisfies ItemBrowseCoverage;
    const partial = getItemFacets({
      category: { scope: ITEM_SCOPES.all },
      coverage: partialCoverage,
    });
    expect(partial.find(({ id }) => id === 'sources')?.options).toEqual([
      { value: 'found-in-container', label: 'Found in a box (partial)' },
    ]);
    expect(partial.find(({ id }) => id === 'quests')?.options).toEqual([
      { value: 'needed-for-quest', label: 'Required for a quest' },
    ]);
  });

  it('uses positive relationship counts for the shared choices', () => {
    const row: ItemRow = {
      sourceId: '1',
      itemClass: 'etc',
      neededForQuestCount: 1,
      questRewardCount: 0,
      usedInRecipeCount: 2,
      madeByRecipeCount: 3,
      foundInContainerCount: 4,
      cashShopListingCount: 5,
      monsterDropCount: 6,
    };

    expect(ITEM_FACET_CONFIGS.quests.values(row)).toEqual(['needed-for-quest']);
    expect(ITEM_FACET_CONFIGS.crafting.values(row)).toEqual([
      'used-in-recipe',
      'made-by-recipe',
    ]);
    expect(ITEM_FACET_CONFIGS.sources.values(row)).toEqual([
      'found-in-container',
    ]);
    expect(ITEM_FACET_CONFIGS.cashShop.values(row)).toEqual([
      'cash-shop-listing',
    ]);
  });

  it('configures Scrolls with grouped equipment slots and stat filters', () => {
    const category = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find(({ slug }) => slug === 'scrolls'),
    };
    const facets = facetsFor(category);
    expect(facets.map(({ id }) => id)).toEqual([
      'quests',
      'crafting',
      'sources',
      'scrollTarget',
      'scrollStat',
      'scrollSuccess',
      'scrollDestructionChance',
    ]);

    const slot = facets.find(({ id }) => id === 'scrollTarget');
    expect(slot?.options?.map(({ value }) => value).sort()).toEqual(
      Object.keys(UPGRADE_TARGET_LABELS).sort(),
    );
    expect(slot?.label).toBe('Equipment slot');
    expect(slot?.quick).toBe(true);
    expect(slot?.options?.[0]).toEqual({
      value: 'bow',
      label: 'Bow',
      group: 'Weapons',
    });
    expect(slot?.options?.[16]).toEqual({
      value: 'bottomwear',
      label: 'Bottomwear',
      group: 'Armor',
    });
    expect(slot?.options?.[22]).toEqual({
      value: 'accessory',
      label: 'Accessory',
      group: 'Accessories',
    });
    expect(slot?.options?.slice(-3)).toEqual([
      { value: 'cape', label: 'Cape', group: 'Cape' },
      { value: 'shield', label: 'Shield', group: 'Shield' },
      {
        value: 'pet-equipment',
        label: 'Pet Equipment',
        group: 'Pet Equipment',
      },
    ]);

    expect(facets.find(({ id }) => id === 'scrollStat')).toMatchObject({
      label: 'Stat improved',
      quick: true,
    });
    expect(
      facets
        .find(({ id }) => id === 'scrollSuccess')
        ?.formatOption?.({ value: '60' }),
    ).toBe('60%');
    expect(
      facets
        .find(({ id }) => id === 'scrollDestructionChance')
        ?.formatOption?.({
          value: 'no-listed-chance',
        }),
    ).toBe('No listed chance');
    expect(
      facets
        .find(({ id }) => id === 'scrollDestructionChance')
        ?.formatOption?.({ value: '50' }),
    ).toBe('50% on failure');
  });
});
