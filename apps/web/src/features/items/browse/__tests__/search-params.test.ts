import type { FacetDefinition } from '@mapletip/component-library';
import { describe, expect, it } from 'vitest';

import type { ItemRow } from '../project';
import {
  browseStateToUrl,
  ITEM_BROWSE_DEFAULT_SEARCH,
  ITEM_BROWSE_DEFAULT_STATE,
  PAGE_SIZE_OPTIONS,
  urlToBrowseState,
  validateSearch,
} from '../search-params';

const facets: readonly FacetDefinition<ItemRow>[] = [
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
    id: 'hp',
    field: 'hp',
    label: 'HP',
    kind: 'range',
    buckets: [
      { value: '50', label: '50', min: 50, max: 50 },
      { value: '100', label: '100', min: 100, max: 100 },
    ],
  },
];

describe('Items Browse search params', () => {
  it('validates the four general keys and keeps well-formed facet values', () => {
    expect(
      validateSearch({
        q: 'red potion',
        page: '3',
        pageSize: '75',
        sort: 'name-desc',
        types: ['potion', 'arrow'],
        hp: { min: 50, max: 100 },
        ignored: 'scalar facet value',
      }),
    ).toEqual({
      q: 'red potion',
      page: 3,
      pageSize: 75,
      sort: 'name-desc',
      types: ['potion', 'arrow'],
      hp: { min: 50, max: 100 },
    });
  });

  it('coerces numeric array values and rejects malformed facet values', () => {
    expect(
      validateSearch({
        types: [100],
        empty: [],
        mixed: ['valid', true],
        noBounds: {},
        reversed: { min: 100, max: 50 },
        infinite: { min: Number.POSITIVE_INFINITY },
        extraRangeKey: { min: 1, step: 2 },
      }),
    ).toEqual({
      q: '',
      page: 1,
      pageSize: 50,
      sort: 'name-asc',
      types: ['100'],
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

  it('filters URL selections against current options and buckets', () => {
    const state = urlToBrowseState({
      search: validateSearch({
        types: ['potion', 'invalid'],
        hp: ['50', 'invalid'],
        unknown: ['potion'],
      }),
      facets,
    });
    expect(state.filters).toEqual({ types: ['potion'], hp: ['50'] });
  });

  it('converts custom ranges and emits only active current-category filters', () => {
    const search = validateSearch({
      q: 'potion',
      page: 3,
      pageSize: 25,
      sort: 'name-desc',
      types: ['arrow', 'not-an-option'],
      hp: { min: 75, max: 125 },
      unknown: ['drop-me'],
    });
    const state = urlToBrowseState({ search, facets });
    expect(state.filters).toEqual({
      types: ['arrow'],
      hp: { min: 75, max: 125 },
    });
    expect(browseStateToUrl({ state, facets, includePage: false })).toEqual({
      q: 'potion',
      page: 1,
      pageSize: 25,
      sort: 'name-desc',
      types: ['arrow'],
      hp: { min: 75, max: 125 },
    });
    expect(browseStateToUrl({ state, facets: [], includePage: false })).toEqual(
      {
        q: 'potion',
        page: 1,
        pageSize: 25,
        sort: 'name-desc',
      },
    );
  });

  it('restores the shared default browse state when no facets are active', () => {
    expect(urlToBrowseState({ search: validateSearch({}), facets })).toEqual(
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
