import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import {
  getDropCoverageNotice,
  getItemFacets,
  getItemRelationships,
} from '../facets';
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
  ];

  describe('getItemRelationships', () => {
    it('derives relationships from counts > 0', () => {
      const rels = getItemRelationships(dummyRows[0]!);
      expect(rels).toEqual(['monster-drop', 'needed-for-quest']);
    });

    it('returns empty array when no relationship counts are positive', () => {
      const rels = getItemRelationships({
        key: '3',
        sourceId: '02000001',
        itemClass: 'consume',
        monsterDropCount: 0,
      });
      expect(rels).toEqual([]);
    });
  });

  describe('getItemFacets', () => {
    it('limits facet options to values present in the category population', () => {
      const facets = getItemFacets(
        { scope: ITEM_SCOPES.use },
        dummyCoverage,
        dummyRows,
      );

      const typeFacet = facets.find((f) => f.id === 'types');
      expect(typeFacet).toBeDefined();
      expect(typeFacet?.options).toEqual([
        { value: 'arrow', label: 'Arrow' },
        { value: 'potion', label: 'Potion' },
      ]);

      const fnFacet = facets.find((f) => f.id === 'functions');
      expect(fnFacet).toBeDefined();
      expect(fnFacet?.options).toEqual([
        { value: 'recovery', label: 'Recovery' },
      ]);
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
      const facetsPartial = getItemFacets(
        { scope: ITEM_SCOPES.use },
        dummyCoverage,
        dummyRows,
      );
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
      const facetsUnsupported = getItemFacets(
        { scope: ITEM_SCOPES.use },
        unsupportedCoverage,
        dummyRows,
      );
      const relFacetUnsup = facetsUnsupported.find((f) => f.id === 'rel');
      expect(
        relFacetUnsup?.options?.some((opt) => opt.value === 'monster-drop'),
      ).toBe(false);
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
