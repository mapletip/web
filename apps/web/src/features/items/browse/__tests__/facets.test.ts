import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { getItemRelationships } from '../categorical-facet-config';
import { ITEM_SCOPES } from '../categories';
import { getItemFacets, ITEM_QUERY_FIELDS } from '../facets';
import type { ItemRow } from '../project';

describe('facets', () => {
  const dummyCoverage: ItemBrowseCoverage = {
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

  const dummyRows: readonly ItemRow[] = [
    {
      key: '1',
      sourceId: '02000000',
      name: 'Red Potion',
      itemClass: 'consume',
      types: ['potion'],
      functions: ['recovery'],
      monsterDropCount: 5,
      neededForQuestCount: 1,
    },
    {
      key: '2',
      sourceId: '02060000',
      name: 'Arrow for Bow',
      itemClass: 'consume',
      types: ['arrow'],
      functions: [],
      monsterDropCount: 2,
    },
    {
      key: '3',
      sourceId: '02000001',
      name: 'Blue Potion',
      itemClass: 'consume',
      types: ['potion'],
      functions: ['recovery'],
    },
  ];

  describe('getItemRelationships', () => {
    it('derives relationships from counts > 0', () => {
      const rels = getItemRelationships({ row: dummyRows[0]! });
      expect(rels).toEqual(['monster-drop', 'needed-for-quest']);
    });

    it('returns empty array when no relationship counts are positive', () => {
      const rels = getItemRelationships({
        row: {
          key: '4',
          sourceId: '02000002',
          itemClass: 'consume',
          monsterDropCount: 0,
        },
      });
      expect(rels).toEqual([]);
    });
  });

  describe('getItemFacets', () => {
    it('declares labelled options in the label map order', () => {
      const facets = getItemFacets({
        category: { scope: ITEM_SCOPES.use },
        coverage: dummyCoverage,
      });

      const typeFacet = facets.find((f) => f.id === 'types');
      expect(typeFacet).toBeDefined();
      expect(typeFacet?.options?.slice(0, 2)).toEqual([
        { value: 'upgrade-scroll', label: 'Upgrade Scroll' },
        { value: 'arrow', label: 'Arrow' },
      ]);

      const fnFacet = facets.find((f) => f.id === 'functions');
      expect(fnFacet).toBeDefined();
      expect(fnFacet?.options?.[0]).toEqual({
        value: 'upgrade',
        label: 'Upgrade',
      });
    });

    it('separates potion and food buffs in the Buffs category', () => {
      const buffsCategory = {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find((child) => child.slug === 'buffs'),
      };

      const facets = getItemFacets({
        category: buffsCategory,
        coverage: dummyCoverage,
      });

      expect(facets).toContainEqual(
        expect.objectContaining({
          id: 'buffType',
          label: 'Buff type',
          options: [
            { value: 'potion', label: 'Potion' },
            { value: 'food-buff', label: 'Food & Buff' },
          ],
        }),
      );
      expect(facets.some((facet) => facet.id === 'buffEffect')).toBe(false);
    });

    it('drops pet option from Effect facet', () => {
      const rowsWithPetFn: readonly ItemRow[] = [
        {
          key: 'p1',
          sourceId: '02000000',
          itemClass: 'consume',
          types: ['potion'],
          functions: ['pet', 'recovery'],
        },
        {
          key: 'p2',
          sourceId: '02000001',
          itemClass: 'consume',
          types: ['potion'],
          functions: ['recovery'],
        },
        {
          key: 'p3',
          sourceId: '02060000',
          itemClass: 'consume',
          types: ['arrow'],
          functions: [],
        },
      ];

      const functionField = ITEM_QUERY_FIELDS.find(
        (field) => typeof field === 'object' && field.id === 'functions',
      );
      const functionValues =
        typeof functionField === 'object' &&
        typeof functionField.accessor === 'function'
          ? functionField.accessor(rowsWithPetFn[0]!)
          : [];
      expect(functionValues).toEqual(['recovery']);
    });

    it('labels partial relationship coverage as partial and omits unsupported kinds', () => {
      const unsupportedCoverage: ItemBrowseCoverage = {
        relationships: {
          ...dummyCoverage.relationships,
          'monster-drop': 'unsupported',
        },
        scrollTier: 'complete',
      };

      // With partial coverage:
      const facetsPartial = getItemFacets({
        category: { scope: ITEM_SCOPES.use },
        coverage: dummyCoverage,
      });
      const relFacet = facetsPartial.find((f) => f.id === 'rel');
      expect(relFacet).toBeDefined();
      expect(relFacet?.options).toContainEqual({
        value: 'monster-drop',
        label: 'Monster Drop (partial)',
      });
      expect(relFacet?.options).toContainEqual({
        value: 'needed-for-quest',
        label: 'Needed for Quest',
      });

      // With unsupported coverage:
      const facetsUnsupported = getItemFacets({
        category: { scope: ITEM_SCOPES.use },
        coverage: unsupportedCoverage,
      });
      const relFacetUnsup = facetsUnsupported.find((f) => f.id === 'rel');
      expect(
        relFacetUnsup?.options?.some((opt) => opt.value === 'monster-drop'),
      ).toBe(false);
    });

    it('orders scroll stats with attacks first and uses player labels', () => {
      const scrollsCategory = {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find((c) => c.slug === 'scrolls'),
      };

      const facets = getItemFacets({
        category: scrollsCategory,
        coverage: dummyCoverage,
      });
      const statFacet = facets.find((f) => f.id === 'scrollStat');
      expect(statFacet).toBeDefined();

      const optionValues = statFacet?.options?.map((opt) => opt.value);
      expect(optionValues?.slice(0, 6)).toEqual([
        'weaponAttack',
        'magicAttack',
        'strength',
        'dexterity',
        'intelligence',
        'luck',
      ]);

      const optionLabels = statFacet?.options?.map((opt) => opt.label);
      expect(optionLabels?.slice(0, 6)).toEqual([
        'Weapon ATT',
        'Magic ATT',
        'STR',
        'DEX',
        'INT',
        'LUK',
      ]);
    });

    it('declares scrollRisk values for library-derived options', () => {
      const scrollsCategory = {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find((c) => c.slug === 'scrolls'),
      };

      const facets = getItemFacets({
        category: scrollsCategory,
        coverage: dummyCoverage,
      });
      const riskFacet = facets.find((f) => f.id === 'scrollRisk');
      expect(riskFacet).toBeDefined();
      expect(riskFacet?.options).toBeUndefined();
      expect(riskFacet?.formatOption?.({ value: 'none' })).toBe(
        'No recorded risk',
      );
      expect(riskFacet?.formatOption?.({ value: '0' })).toBe('0% on failure');
    });

    it('declares no scrollTier options when coverage is unsupported', () => {
      const scrollsCategory = {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find((c) => c.slug === 'scrolls'),
      };

      const unsupportedCov: ItemBrowseCoverage = {
        ...dummyCoverage,
        scrollTier: 'unsupported',
      };
      const facetsUnsup = getItemFacets({
        category: scrollsCategory,
        coverage: unsupportedCov,
      });
      expect(facetsUnsup.find((f) => f.id === 'scrollTier')?.options).toEqual(
        [],
      );

      const supportedCov: ItemBrowseCoverage = {
        ...dummyCoverage,
        scrollTier: 'complete',
      };
      const facetsSup = getItemFacets({
        category: scrollsCategory,
        coverage: supportedCov,
      });
      expect(facetsSup.find((f) => f.id === 'scrollTier')).toBeDefined();
    });

    it('keeps chair seat recovery values absent from Recovery child', () => {
      const recoveryCategory = {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find((c) => c.slug === 'recovery'),
      };
      const chairsCategory = {
        scope: ITEM_SCOPES.setup,
        child: ITEM_SCOPES.setup.children.find((c) => c.slug === 'chairs'),
      };

      const recoveryFacets = getItemFacets({
        category: recoveryCategory,
        coverage: dummyCoverage,
      });
      expect(recoveryFacets.find((f) => f.id === 'seatHp')).toBeUndefined();
      expect(recoveryFacets.find((f) => f.id === 'seatMp')).toBeUndefined();
      expect(recoveryFacets.find((f) => f.id === 'hp')).toBeDefined();

      const chairFacets = getItemFacets({
        category: chairsCategory,
        coverage: dummyCoverage,
      });
      expect(chairFacets.find((f) => f.id === 'seatHp')).toBeDefined();
      expect(chairFacets.find((f) => f.id === 'seatMp')).toBeDefined();
      expect(chairFacets.find((f) => f.id === 'hp')).toBeUndefined();
    });

    it('uses player-facing pet names as filter values', () => {
      const petFoodCategory = {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find((c) => c.slug === 'pet-food'),
      };
      const foodRows: readonly ItemRow[] = [
        {
          key: 'f1',
          sourceId: '02120000',
          name: 'Dragon Food',
          itemClass: 'consume',
          petTargets: [
            { key: 'pet:dragon-red', name: 'Baby Dragon' },
            { key: 'pet:dragon-blue', name: 'Baby Dragon' },
          ],
          unresolvedPetTargets: ['5000046'],
        },
        {
          key: 'f2',
          sourceId: '02120001',
          name: 'Dog Food',
          itemClass: 'consume',
          petTargets: [
            { key: 'pet:husky', name: 'Husky' },
            { key: 'pet:unnamed' },
          ],
        },
      ];

      const facets = getItemFacets({
        category: petFoodCategory,
        coverage: dummyCoverage,
      });
      const petFacet = facets.find((f) => f.id === 'pet');
      expect(petFacet).toBeDefined();
      expect(petFacet?.options).toBeUndefined();
      expect(petFacet?.formatOption).toBeUndefined();

      const petQueryField = ITEM_QUERY_FIELDS.find(
        (field) => typeof field === 'object' && field.id === 'pet',
      );
      const petValues =
        typeof petQueryField === 'object' &&
        typeof petQueryField.accessor === 'function'
          ? petQueryField.accessor(foodRows[0]!)
          : [];
      expect(petValues).toEqual([
        'Baby Dragon',
        'Baby Dragon',
        'Unresolved pet',
      ]);
    });
  });

  describe('query fields & filtering semantics', () => {
    function getNumericValue(
      fieldId: string,
      row: ItemRow,
    ): number | undefined {
      const field = ITEM_QUERY_FIELDS.find(
        (f) => typeof f === 'object' && f !== null && f.id === fieldId,
      );
      if (typeof field === 'object' && field !== null) {
        const accessor = field.accessor;
        if (typeof accessor === 'function') {
          const val: unknown = accessor(row);
          if (typeof val === 'number') {
            return val;
          }
        }
      }
      return undefined;
    }

    function getStringListValue(
      fieldId: string,
      row: ItemRow,
    ): readonly string[] {
      const field = ITEM_QUERY_FIELDS.find(
        (f) => typeof f === 'object' && f !== null && f.id === fieldId,
      );
      if (typeof field === 'object' && field !== null) {
        const accessor = field.accessor;
        if (typeof accessor === 'function') {
          const val: unknown = accessor(row);
          if (Array.isArray(val)) {
            return val.filter(
              (item): item is string => typeof item === 'string',
            );
          }
        }
      }
      return [];
    }

    it('does not match percent-only item against flat hp range and never sums units', () => {
      const elixir: ItemRow = {
        key: 'elixir',
        sourceId: '02000004',
        name: 'Elixir',
        itemClass: 'consume',
        hpPercent: 50,
        mpPercent: 50,
      };
      const potion: ItemRow = {
        key: 'potion',
        sourceId: '02000000',
        name: 'Red Potion',
        itemClass: 'consume',
        hp: 50,
      };

      // Accessors return honest undefined, never 0
      expect(getNumericValue('hp', elixir)).toBeUndefined();
      expect(getNumericValue('hp', potion)).toBe(50);
      expect(getNumericValue('hpPercent', elixir)).toBe(50);
      expect(getNumericValue('hpPercent', potion)).toBeUndefined();
    });

    it('keeps attack-less arrow in population and only excludes it when attack range is active', () => {
      const basicArrow: ItemRow = {
        key: 'arrow:basic',
        sourceId: '02060000',
        name: 'Arrow for Bow',
        itemClass: 'consume',
      };
      const bronzeArrow: ItemRow = {
        key: 'arrow:bronze',
        sourceId: '02060001',
        name: 'Bronze Arrow for Bow',
        itemClass: 'consume',
        attack: 1,
      };

      expect(getNumericValue('attack', basicArrow)).toBeUndefined();
      expect(getNumericValue('attack', bronzeArrow)).toBe(1);
    });

    it('evaluates OR within multi-select and AND across independent facets', () => {
      const scrollStrength: ItemRow = {
        key: 's1',
        sourceId: '02040001',
        itemClass: 'consume',
        stats: { strength: 2 },
        success: 60,
      };
      const scrollLuck: ItemRow = {
        key: 's2',
        sourceId: '02040002',
        itemClass: 'consume',
        stats: { luck: 2 },
        success: 60,
      };
      const scrollDex: ItemRow = {
        key: 's3',
        sourceId: '02040003',
        itemClass: 'consume',
        stats: { dexterity: 2 },
        success: 100,
      };

      // OR within: selecting ['strength', 'luck']
      const filterStats = ['strength', 'luck'];
      const matchesOr = (row: ItemRow) => {
        const rowStats = getStringListValue('scrollStat', row);
        return rowStats.some((s) => filterStats.includes(s));
      };

      expect(matchesOr(scrollStrength)).toBe(true);
      expect(matchesOr(scrollLuck)).toBe(true);
      expect(matchesOr(scrollDex)).toBe(false);

      // AND across: combining with success === 60
      const matchesBoth = (row: ItemRow) => {
        const matchesStat = matchesOr(row);
        const rowSuccess = getStringListValue('scrollSuccess', row);
        const matchesSuccess = rowSuccess.includes('60');
        return matchesStat && matchesSuccess;
      };

      expect(matchesBoth(scrollStrength)).toBe(true);
      expect(matchesBoth(scrollLuck)).toBe(true);
      expect(matchesBoth(scrollDex)).toBe(false);
    });
  });
});
