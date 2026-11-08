import { describe, expect, it } from 'vitest';

import {
  browseStateToUrl,
  ITEM_BROWSE_DEFAULT_SEARCH,
  ITEM_BROWSE_DEFAULT_STATE,
  PAGE_SIZE_OPTIONS,
  urlToBrowseState,
  validateSearch,
} from '../search-params';

describe('Items Browse search params', () => {
  it('validates the four general keys and well-formed facet values', () => {
    expect(
      validateSearch({
        q: 'red potion',
        page: '3',
        pageSize: '75',
        sort: 'name-desc',
        types: ['potion', 'arrow'],
        hp: { min: 50, max: 100 },
        questFlag: true,
        ignored: 'scalar facet value',
      }),
    ).toEqual({
      q: 'red potion',
      page: 3,
      pageSize: 75,
      sort: 'name-desc',
      types: ['potion', 'arrow'],
      hp: { min: 50, max: 100 },
      questFlag: true,
    });
  });

  it('keeps facet URL shapes and coerces finite numeric array values', () => {
    expect(
      validateSearch({
        types: [100],
        empty: [],
        mixed: ['valid', true],
        noBounds: {},
        reversed: { min: 100, max: 50 },
        infinite: { min: Number.POSITIVE_INFINITY },
        extraRangeKey: { min: 1, step: 2 },
        boolean: false,
        scalar: 'drop-me',
        nonPlainObject: new Date(),
      }),
    ).toEqual({
      q: '',
      page: 1,
      pageSize: 50,
      sort: 'name-asc',
      types: ['100'],
      empty: [],
      mixed: ['valid'],
      noBounds: {},
      reversed: { min: 100, max: 50 },
      infinite: { min: Number.POSITIVE_INFINITY },
      extraRangeKey: { min: 1, step: 2 },
      boolean: false,
    });
  });

  it('uses shared defaults for invalid general values', () => {
    expect(
      validateSearch({
        q: 'a'.repeat(201),
        page: 0,
        pageSize: 30,
        sort: 'unsupported-ascending',
      }),
    ).toEqual({ q: '', page: 1, pageSize: 50, sort: 'name-asc' });
    expect(validateSearch({ q: '' })).toEqual({
      q: '',
      page: 1,
      pageSize: 50,
      sort: 'name-asc',
    });
  });

  it('converts finite numeric queries to strings', () => {
    expect(validateSearch({ q: 2000000 })).toMatchObject({ q: '2000000' });
  });

  it('accepts only configured page sizes and name sort options', () => {
    for (const pageSize of PAGE_SIZE_OPTIONS) {
      expect(validateSearch({ pageSize })).toMatchObject({ pageSize });
    }
    expect(validateSearch({ sort: 'name-asc' })).toMatchObject({
      sort: 'name-asc',
    });
    expect(validateSearch({ sort: 'name-desc' })).toMatchObject({
      sort: 'name-desc',
    });
    expect(validateSearch({ sort: 'sourceId-asc' })).toMatchObject({
      sort: 'name-asc',
    });
  });

  it('maps every validated facet key into state and back to the URL', () => {
    const search = validateSearch({
      q: 'potion',
      page: 3,
      pageSize: 25,
      sort: 'name-desc',
      types: ['arrow', 'potion'],
      hp: { min: 75, max: 125 },
      questFlag: false,
    });
    const state = urlToBrowseState({ search });
    expect(state.filters).toEqual({
      types: ['arrow', 'potion'],
      hp: { min: 75, max: 125 },
      questFlag: false,
    });
    expect(browseStateToUrl({ state, includePage: false })).toEqual({
      q: 'potion',
      page: 1,
      pageSize: 25,
      sort: 'name-desc',
      types: ['arrow', 'potion'],
      hp: { min: 75, max: 125 },
      questFlag: false,
    });
  });

  it('omits facet keys for category navigation when given general-only state', () => {
    const state = {
      ...ITEM_BROWSE_DEFAULT_STATE,
      filters: { types: ['potion'] },
    };
    expect(
      browseStateToUrl({
        state: { ...state, filters: {} },
        includePage: false,
      }),
    ).toEqual(ITEM_BROWSE_DEFAULT_SEARCH);
  });

  it('restores the shared default browse state when no facets are active', () => {
    expect(urlToBrowseState({ search: validateSearch({}) })).toEqual(
      ITEM_BROWSE_DEFAULT_STATE,
    );
    expect(ITEM_BROWSE_DEFAULT_SEARCH).toEqual({
      q: '',
      page: 1,
      pageSize: 50,
      sort: 'name-asc',
    });
  });
});
