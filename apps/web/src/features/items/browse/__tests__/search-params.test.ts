import { describe, expect, it } from 'vitest';

import {
  browseStateToUrl,
  urlToBrowseState,
  validateSearch,
  type BrowseContext,
} from '../search-params';

describe('search-params', () => {
  const dummyContext: BrowseContext = {
    facets: [
      {
        id: 'types',
        field: 'types',
        label: 'Item type',
        kind: 'multi-select',
        options: [
          { value: 'potion', label: 'Potion' },
          { value: 'arrow', label: 'Arrow' },
        ],
      },
      {
        id: 'rel',
        field: 'rel',
        label: 'Relationship',
        kind: 'multi-select',
        options: [
          { value: 'monster-drop', label: 'Monster Drop' },
          { value: 'needed-for-quest', label: 'Needed for Quest' },
        ],
      },
      {
        id: 'attack',
        field: 'attack',
        label: 'Attack',
        kind: 'range',
      },
      {
        id: 'hpPercent',
        field: 'hpPercent',
        label: 'HP %',
        kind: 'range',
        buckets: [
          { value: '35', label: '35%', min: 35, max: 35 },
          { value: '50', label: '50%', min: 50, max: 50 },
        ],
      },
      {
        id: 'scrollSuccess',
        field: 'scrollSuccess',
        label: 'Success rate',
        kind: 'multi-select',
        options: [
          { value: '60', label: '60%' },
          { value: '100', label: '100%' },
        ],
      },
      {
        id: 'pet',
        field: 'pet',
        label: 'Compatible pets',
        kind: 'multi-select',
      },
      {
        id: 'dynamicAttack',
        field: 'dynamicAttack',
        label: 'Attack',
        kind: 'range',
        buckets: 'quantile',
      },
      {
        id: 'percentageRecovery',
        field: 'percentageRecovery',
        label: 'Percentage recovery',
        kind: 'boolean',
      },
    ],
    sortOptions: [
      { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
      { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
      { label: 'ID', field: 'sourceId', direction: 'asc' },
      { label: 'ID (Z–A)', field: 'sourceId', direction: 'desc' },
    ],
  };

  describe('validateSearch', () => {
    it('is tolerant and never throws on empty or garbage input', () => {
      expect(validateSearch({})).toEqual({});
      expect(
        validateSearch({
          foo: null,
          bar: undefined,
          baz: () => {},
          obj: { nested: 123 },
        }),
      ).toEqual({});
    });

    it('validates search query q within 200 UTF-8 bytes and drops oversize', () => {
      expect(validateSearch({ q: 'red potion' })).toEqual({ q: 'red potion' });

      // Exactly 200 ASCII bytes
      const q200 = 'a'.repeat(200);
      expect(validateSearch({ q: q200 })).toEqual({ q: q200 });

      // 201 ASCII bytes -> dropped
      const q201 = 'a'.repeat(201);
      expect(validateSearch({ q: q201 })).toEqual({});

      // UTF-8 multibyte characters exceeding 200 bytes
      const qMaple = '🍁'.repeat(51);
      expect(validateSearch({ q: qMaple })).toEqual({});

      // Empty string is dropped
      expect(validateSearch({ q: '' })).toEqual({});
    });

    it('validates page as integer 1..9999 and drops invalid', () => {
      expect(validateSearch({ page: 1 })).toEqual({ page: 1 });
      expect(validateSearch({ page: 42 })).toEqual({ page: 42 });
      expect(validateSearch({ page: '5' })).toEqual({ page: 5 });
      expect(validateSearch({ page: 9999 })).toEqual({ page: 9999 });

      expect(validateSearch({ page: 0 })).toEqual({});
      expect(validateSearch({ page: -1 })).toEqual({});
      expect(validateSearch({ page: 10000 })).toEqual({});
      expect(validateSearch({ page: 1.5 })).toEqual({});
      expect(validateSearch({ page: 'abc' })).toEqual({});
      expect(validateSearch({ page: NaN })).toEqual({});
    });

    it('validates pageSize to one of 25, 50, 75, 100 and drops others', () => {
      expect(validateSearch({ pageSize: 25 })).toEqual({ pageSize: 25 });
      expect(validateSearch({ pageSize: '50' })).toEqual({ pageSize: 50 });
      expect(validateSearch({ pageSize: 75 })).toEqual({ pageSize: 75 });
      expect(validateSearch({ pageSize: 100 })).toEqual({ pageSize: 100 });

      expect(validateSearch({ pageSize: 10 })).toEqual({});
      expect(validateSearch({ pageSize: 30 })).toEqual({});
      expect(validateSearch({ pageSize: 200 })).toEqual({});
      expect(validateSearch({ pageSize: 'foo' })).toEqual({});
    });

    it('validates sort as <field>-<asc|desc> and drops malformed', () => {
      expect(validateSearch({ sort: 'name-asc' })).toEqual({
        sort: 'name-asc',
      });
      expect(validateSearch({ sort: 'sourceId-desc' })).toEqual({
        sort: 'sourceId-desc',
      });

      expect(validateSearch({ sort: 'name' })).toEqual({});
      expect(validateSearch({ sort: 'name-ascending' })).toEqual({});
      expect(validateSearch({ sort: 'name-asc-extra' })).toEqual({});
      expect(validateSearch({ sort: '-asc' })).toEqual({});
    });

    it('accepts multi-select values as comma-separated strings or arrays, normalising to comma string', () => {
      expect(
        validateSearch({
          types: 'potion,arrow',
          rel: ['monster-drop', 'needed-for-quest'],
        }),
      ).toEqual({
        types: 'potion,arrow',
        rel: 'monster-drop,needed-for-quest',
      });
    });

    it('preserves single numeric URL values as numbers in validateSearch', () => {
      expect(
        validateSearch({
          scrollSuccess: 100,
          hpPercent: 35,
        }),
      ).toEqual({
        scrollSuccess: 100,
        hpPercent: 35,
      });
    });

    it('preserves open-ended range parameters as numbers', () => {
      expect(
        validateSearch({
          attackMin: '10',
          attackMax: 50,
        }),
      ).toEqual({
        attackMin: 10,
        attackMax: 50,
      });

      expect(validateSearch({ attackMin: 'invalid' })).toEqual({});
    });
  });

  describe('urlToBrowseState', () => {
    it('returns default browse state for clean/empty search', () => {
      const state = urlToBrowseState({}, dummyContext);
      expect(state).toEqual({
        search: '',
        page: 1,
        pageSize: 50,
        sort: { field: 'name', direction: 'asc' },
        filters: {},
        hiddenColumns: [],
      });
    });

    it('drops sort options not valid for the current context', () => {
      const state = urlToBrowseState(
        { sort: 'invalidField-asc' },
        dummyContext,
      );
      expect(state.sort).toEqual({ field: 'name', direction: 'asc' });

      const validState = urlToBrowseState(
        { sort: 'sourceId-asc' },
        dummyContext,
      );
      expect(validState.sort).toEqual({ field: 'sourceId', direction: 'asc' });
    });

    it('parses single numeric values for both multi-select and bucket', () => {
      const state = urlToBrowseState(
        {
          scrollSuccess: 100,
          hpPercent: 35,
        },
        dummyContext,
      );
      expect(state.filters).toEqual({
        scrollSuccess: ['100'],
        hpPercent: ['35'],
      });
    });

    it('drops facet options not present in the facet definition', () => {
      const state = urlToBrowseState(
        {
          types: ['potion', 'not-a-type'],
          unrelatedFacet: ['some-value'],
        },
        dummyContext,
      );

      expect(state.filters).toEqual({
        types: ['potion'],
      });
      expect(state.filters['unrelatedFacet']).toBeUndefined();
    });

    it('parses values from dynamic facets and boolean controls', () => {
      const state = urlToBrowseState(
        {
          pet: 'pet:husky',
          dynamicAttack: '10-20',
          percentageRecovery: 'true',
        },
        dummyContext,
      );

      expect(state.filters).toEqual({
        pet: ['pet:husky'],
        dynamicAttack: ['10-20'],
        percentageRecovery: true,
      });
    });

    it('parses open-ended ranges and drops invalid ranges where min > max', () => {
      const minOnly = urlToBrowseState({ attackMin: 10 }, dummyContext);
      expect(minOnly.filters['attack']).toEqual({ min: 10 });

      const maxOnly = urlToBrowseState({ attackMax: 50 }, dummyContext);
      expect(maxOnly.filters['attack']).toEqual({ max: 50 });

      const bothValid = urlToBrowseState(
        { attackMin: 10, attackMax: 50 },
        dummyContext,
      );
      expect(bothValid.filters['attack']).toEqual({ min: 10, max: 50 });

      const invalid = urlToBrowseState(
        { attackMin: 50, attackMax: 10 },
        dummyContext,
      );
      expect(invalid.filters['attack']).toBeUndefined();
    });
  });

  describe('browseStateToUrl', () => {
    it('omits defaults so a clean page has a clean empty URL object', () => {
      const state = urlToBrowseState({}, dummyContext);
      const url = browseStateToUrl(state, dummyContext);
      expect(url).toEqual({});
    });

    it('serializes multi-select values comma-joined', () => {
      const url = browseStateToUrl(
        {
          search: 'snail',
          page: 3,
          pageSize: 25,
          sort: { field: 'sourceId', direction: 'asc' },
          filters: { types: ['arrow', 'potion'] },
          hiddenColumns: ['sourceId'],
        },
        dummyContext,
      );

      expect(url).toEqual({
        q: 'snail',
        page: 3,
        pageSize: 25,
        sort: 'sourceId-asc',
        types: 'arrow,potion',
      });
    });

    it('round-trips dynamic range and boolean facet values', () => {
      const state = {
        ...urlToBrowseState({}, dummyContext),
        filters: {
          pet: ['pet:husky'],
          dynamicAttack: ['10-20'],
          percentageRecovery: false,
        },
      };
      const serialized = browseStateToUrl(state, dummyContext);

      expect(serialized).toEqual({
        pet: 'pet:husky',
        dynamicAttack: '10-20',
        percentageRecovery: false,
      });
      expect(urlToBrowseState(serialized, dummyContext).filters).toEqual(
        state.filters,
      );
    });

    it('serializes open-ended inclusive ranges and round trips safely', () => {
      const minOnlyUrl = browseStateToUrl(
        {
          search: '',
          page: 1,
          pageSize: 50,
          filters: { attack: { min: 10 } },
          hiddenColumns: [],
        },
        dummyContext,
      );
      expect(minOnlyUrl).toEqual({ attackMin: 10 });

      const maxOnlyUrl = browseStateToUrl(
        {
          search: '',
          page: 1,
          pageSize: 50,
          filters: { attack: { max: 50 } },
          hiddenColumns: [],
        },
        dummyContext,
      );
      expect(maxOnlyUrl).toEqual({ attackMax: 50 });

      const original = {
        q: 'shield',
        page: 2,
        pageSize: 75,
        sort: 'name-desc',
        types: 'potion',
        attackMin: 15,
      };
      const validated = validateSearch(original);
      const state = urlToBrowseState(validated, dummyContext);
      const output = browseStateToUrl(state, dummyContext);

      expect(output).toEqual(original);
    });
  });
});
