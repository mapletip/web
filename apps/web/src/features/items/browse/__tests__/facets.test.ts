import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import {
  getDropCoverageNotice,
  getItemFacets as declareItemFacets,
  getItemRelationships,
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
      const rels = getItemRelationships(dummyRows[0]!);
      expect(rels).toEqual(['monster-drop', 'needed-for-quest']);
    });

    it('returns empty array when no relationship counts are positive', () => {
      const rels = getItemRelationships({
        key: '4',
        sourceId: '02000002',
        itemClass: 'consume',
        monsterDropCount: 0,
      });
      expect(rels).toEqual([]);
    });
  });

  describe('getItemFacets', () => {
    it('omits the redundant item type facet and declares Effect choices', () => {
      const facets = getItemFacets(
        { scope: ITEM_SCOPES.use },
        dummyCoverage,
        dummyRows,
        dummyRows,
      );

      const typeFacet = facets.find((f) => f.id === 'types');
      expect(typeFacet).toBeUndefined();

      const fnFacet = facets.find((f) => f.id === 'functions');
      expect(fnFacet).toBeDefined();
      expect(fnFacet?.options).toContainEqual({
        value: 'recovery',
        label: 'Recovery',
      });
    });

    it('omits pet-only functions from Effect values', () => {
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

      const facets = getItemFacets(
        { scope: ITEM_SCOPES.use },
        dummyCoverage,
        rowsWithPetFn,
        rowsWithPetFn,
      );
      const fnFacet = facets.find((f) => f.id === 'functions');
      expect(fnFacet).toBeDefined();
      const accessor = ITEM_QUERY_FIELDS.find(
        (field) => typeof field === 'object' && field.id === 'functions',
      );
      expect(
        typeof accessor === 'object' && typeof accessor.accessor === 'function'
          ? accessor.accessor(rowsWithPetFn[0]!)
          : [],
      ).toEqual(['recovery']);
    });

    it('labels partial grouped relationship coverage and omits unsupported groups', () => {
      const unsupportedCoverage: ItemBrowseCoverage = {
        relationships: {
          ...dummyCoverage.relationships,
          'found-in-container': 'unsupported',
        },
        scrollTier: 'complete',
      };

      const partialCoverage: ItemBrowseCoverage = {
        ...dummyCoverage,
        relationships: {
          ...dummyCoverage.relationships,
          'found-in-container': 'partial',
        },
      };

      // With partial coverage:
      const facetsPartial = getItemFacets(
        { scope: ITEM_SCOPES.use },
        partialCoverage,
        dummyRows,
        dummyRows,
      );
      const sourcesFacet = facetsPartial.find((f) => f.id === 'sources');
      expect(sourcesFacet?.options).toContainEqual({
        value: 'found-in-container',
        label: 'Found in a box (partial)',
      });

      // With unsupported coverage:
      const facetsUnsupported = getItemFacets(
        { scope: ITEM_SCOPES.use },
        unsupportedCoverage,
        dummyRows,
        dummyRows,
      );
      const sourcesFacetUnsup = facetsUnsupported.find(
        (f) => f.id === 'sources',
      );
      expect(
        sourcesFacetUnsup?.options?.some(
          (option) => option.value === 'found-in-container',
        ),
      ).toBe(false);
    });

    it('declares scroll value labels while the shared resolver prunes no-op choices', () => {
      const scrollsCategory = {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find(
          (c) => c.slug === 'upgrade-scrolls',
        ),
      };
      const scrollRows: readonly ItemRow[] = [
        {
          key: 's1',
          sourceId: '02040001',
          name: 'Scroll for Helmet DEF 60%',
          itemClass: 'consume',
          types: ['upgrade-scroll'],
          targetLabel: 'hat',
          stats: { weaponDefense: 2 },
          success: 60,
        },
        {
          key: 's2',
          sourceId: '02040002',
          name: 'Scroll for Shoes Jump 60%',
          itemClass: 'consume',
          types: ['upgrade-scroll'],
          targetLabel: 'shoes',
          stats: { jump: 2 },
          success: 60,
        },
      ];

      const facets = getItemFacets(
        scrollsCategory,
        dummyCoverage,
        scrollRows,
        scrollRows,
      );

      // Item Type is represented by the category drill down.
      const typeFacet = facets.find((f) => f.id === 'types');
      expect(typeFacet).toBeUndefined();

      const successFacet = facets.find((f) => f.id === 'scrollSuccess');
      expect(successFacet?.formatOption?.({ value: '60' })).toBe('60%');

      const targetFacet = facets.find((f) => f.id === 'scrollTarget');
      expect(targetFacet).toBeDefined();
      expect(targetFacet?.options).toContainEqual({
        value: 'hat',
        label: 'Hat',
        group: 'Armor',
      });
    });

    it('orders scroll stats with attacks first and uses player labels', () => {
      const scrollsCategory = {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find(
          (c) => c.slug === 'upgrade-scrolls',
        ),
      };
      const scrollRows: readonly ItemRow[] = [
        {
          key: 's1',
          sourceId: '02040001',
          itemClass: 'consume',
          stats: { strength: 2, weaponAttack: 1 },
        },
        {
          key: 's2',
          sourceId: '02040002',
          itemClass: 'consume',
          stats: { magicAttack: 2, dexterity: 1 },
        },
        {
          key: 's3',
          sourceId: '02040003',
          itemClass: 'consume',
          stats: { luck: 2 },
        },
      ];

      const facets = getItemFacets(
        scrollsCategory,
        dummyCoverage,
        scrollRows,
        scrollRows,
      );
      const statFacet = facets.find((f) => f.id === 'scrollStat');
      expect(statFacet).toBeDefined();

      const optionValues = statFacet?.options?.map((opt) => opt.value);
      // Attacks come first, followed by STR, DEX, INT, LUK
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

    it('scrollRisk keeps known 0 as a distinct value and undefined as none', () => {
      const scrollsCategory = {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find(
          (c) => c.slug === 'upgrade-scrolls',
        ),
      };
      const scrollRows: readonly ItemRow[] = [
        {
          key: 's1',
          sourceId: '02040001',
          itemClass: 'consume',
          cursed: 0,
        },
        {
          key: 's2',
          sourceId: '02040002',
          itemClass: 'consume',
          cursed: 50,
        },
        {
          key: 's3',
          sourceId: '02040003',
          itemClass: 'consume',
        },
      ];

      const facets = getItemFacets(
        scrollsCategory,
        dummyCoverage,
        scrollRows,
        scrollRows,
      );
      const riskFacet = facets.find((f) => f.id === 'scrollRisk');
      expect(riskFacet).toBeDefined();

      expect(riskFacet?.formatOption?.({ value: 'none' })).toBe('-');
      expect(riskFacet?.formatOption?.({ value: '0' })).toBe('0% on failure');
      expect(riskFacet?.formatOption?.({ value: '50' })).toBe('50% on failure');
    });

    it('hides scrollTier when coverage is unsupported', () => {
      const scrollsCategory = {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find(
          (c) => c.slug === 'upgrade-scrolls',
        ),
      };
      const rowsWithTier: readonly ItemRow[] = [
        {
          key: 's1',
          sourceId: '02040001',
          name: 'Scroll 1',
          itemClass: 'consume',
          types: ['upgrade-scroll'],
          tier: 'lesser',
        },
        {
          key: 's2',
          sourceId: '02040002',
          name: 'Scroll 2',
          itemClass: 'consume',
          types: ['upgrade-scroll'],
          tier: 'intermediate',
        },
      ];

      const unsupportedCov: ItemBrowseCoverage = {
        ...dummyCoverage,
        scrollTier: 'unsupported',
      };
      const facetsUnsup = getItemFacets(
        scrollsCategory,
        unsupportedCov,
        rowsWithTier,
        rowsWithTier,
      );
      expect(facetsUnsup.find((f) => f.id === 'scrollTier')).toBeUndefined();

      const supportedCov: ItemBrowseCoverage = {
        ...dummyCoverage,
        scrollTier: 'complete',
      };
      const facetsSup = getItemFacets(
        scrollsCategory,
        supportedCov,
        rowsWithTier,
        rowsWithTier,
      );
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

      const recoveryRows: readonly ItemRow[] = [
        {
          key: 'r1',
          sourceId: '02000000',
          name: 'Red Potion',
          itemClass: 'consume',
          hp: 50,
        },
        {
          key: 'r2',
          sourceId: '02000001',
          name: 'Orange Potion',
          itemClass: 'consume',
          hp: 150,
        },
      ];

      const chairRows: readonly ItemRow[] = [
        {
          key: 'c1',
          sourceId: '03010000',
          name: 'Relaxer',
          itemClass: 'setup',
          seatHp: 50,
          seatMp: 10,
        },
        {
          key: 'c2',
          sourceId: '03010001',
          name: 'Yellow Chair',
          itemClass: 'setup',
          seatHp: 100,
          seatMp: 20,
        },
      ];

      const recoveryFacets = getItemFacets(
        recoveryCategory,
        dummyCoverage,
        recoveryRows,
        recoveryRows,
      );
      expect(recoveryFacets.find((f) => f.id === 'seatHp')).toBeUndefined();
      expect(recoveryFacets.find((f) => f.id === 'seatMp')).toBeUndefined();
      expect(recoveryFacets.find((f) => f.id === 'hp')).toBeDefined();

      const chairFacets = getItemFacets(
        chairsCategory,
        dummyCoverage,
        chairRows,
        chairRows,
      );
      expect(chairFacets.find((f) => f.id === 'seatHp')).toBeDefined();
      expect(chairFacets.find((f) => f.id === 'seatMp')).toBeDefined();
      expect(chairFacets.find((f) => f.id === 'hp')).toBeUndefined();
    });

    it('disambiguates duplicate pet names and handles unresolved and unnamed targets', () => {
      const petFoodCategory = {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find((c) => c.slug === 'pet-food'),
      };

      const roster: readonly ItemRow[] = [
        {
          key: 'pet:dragon-red',
          sourceId: '5000020',
          name: 'Baby Dragon',
          itemClass: 'pet',
        },
        {
          key: 'pet:dragon-blue',
          sourceId: '5000021',
          name: 'Baby Dragon',
          itemClass: 'pet',
        },
        {
          key: 'pet:husky',
          sourceId: '5000010',
          name: 'Husky',
          itemClass: 'pet',
        },
        {
          key: 'pet:unnamed',
          sourceId: '5000099',
          itemClass: 'pet',
        },
      ];

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

      const facets = getItemFacets(
        petFoodCategory,
        dummyCoverage,
        foodRows,
        roster,
      );
      const petFacet = facets.find((f) => f.id === 'pet');
      expect(petFacet).toBeDefined();

      const formatOption = petFacet?.formatOption;
      // Colliding names have sourceId appended
      expect(formatOption?.({ value: 'pet:dragon-red' })).toBe(
        'Baby Dragon (5000020)',
      );
      expect(formatOption?.({ value: 'pet:dragon-blue' })).toBe(
        'Baby Dragon (5000021)',
      );

      // Unique name stays clean
      expect(formatOption?.({ value: 'pet:husky' })).toBe('Husky');

      // Unnamed pet gets "Unnamed pet (<source id>)"
      expect(formatOption?.({ value: 'pet:unnamed' })).toBe(
        'Unnamed pet (5000099)',
      );

      // Unresolved target gets prefixed "unresolved:<id>" value and "Unresolved target <id>" label
      expect(formatOption?.({ value: 'unresolved:5000046' })).toBe(
        'Unresolved target 5000046',
      );
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

  describe('getDropCoverageNotice', () => {
    it('derives truthful drop coverage note on All Items page only', () => {
      const unsupportedCoverage: ItemBrowseCoverage = {
        relationships: {
          ...dummyCoverage.relationships,
          'monster-drop': 'unsupported',
        },
        scrollTier: 'complete',
      };

      expect(
        getDropCoverageNotice(unsupportedCoverage, { scope: ITEM_SCOPES.all }),
      ).toBe('Classic World has no monster drop data.');
      expect(
        getDropCoverageNotice(dummyCoverage, { scope: ITEM_SCOPES.all }),
      ).toBe(
        'GMS monster-book evidence is incomplete and a missing record does not mean an item cannot drop.',
      );
      expect(
        getDropCoverageNotice(dummyCoverage, { scope: ITEM_SCOPES.use }),
      ).toBeUndefined();
      expect(
        getDropCoverageNotice(dummyCoverage, {
          scope: ITEM_SCOPES.use,
          child: ITEM_SCOPES.use.children[0],
        }),
      ).toBeUndefined();
    });
  });
});
