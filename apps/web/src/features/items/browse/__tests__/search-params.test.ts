import { describe, expect, it } from 'vitest';

import {
  browseStateToUrl,
  ITEM_BROWSE_DEFAULT_STATE,
  PAGE_SIZE_OPTIONS,
  urlToBrowseState,
  validateSearch,
} from '../search-params';

describe('Items Browse search params', () => {
  it('validates q, page, pageSize and supported sort values only', () => {
    expect(
      validateSearch({
        q: 'red potion',
        page: '3',
        pageSize: '75',
        sort: 'sourceId-desc',
        extra: 'ignored',
        unsupported: 'ignored',
      }),
    ).toEqual({
      q: 'red potion',
      page: 3,
      pageSize: 75,
      sort: 'sourceId-desc',
    });
  });

  it('uses shared defaults for invalid values on all four supported keys', () => {
    expect(
      validateSearch({
        q: 'a'.repeat(201),
        page: 0,
        pageSize: 30,
        sort: 'sourceId-ascending',
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

  it('accepts only configured page sizes and sort options', () => {
    for (const pageSize of PAGE_SIZE_OPTIONS) {
      expect(validateSearch({ pageSize })).toMatchObject({ pageSize });
    }
    expect(validateSearch({ sort: 'name-asc' })).toMatchObject({
      sort: 'name-asc',
    });
    expect(validateSearch({ sort: 'sourceId-asc' })).toMatchObject({
      sort: 'sourceId-asc',
    });
  });

  it('restores the shared default state for absent or invalid params', () => {
    expect(urlToBrowseState({ search: validateSearch({}) })).toEqual(
      ITEM_BROWSE_DEFAULT_STATE,
    );
    expect(
      urlToBrowseState({
        search: validateSearch({ page: 0, pageSize: 30, sort: 'unknown-asc' }),
      }),
    ).toEqual(ITEM_BROWSE_DEFAULT_STATE);
  });

  it('serializes state for the route middleware to strip defaults', () => {
    expect(browseStateToUrl({ state: ITEM_BROWSE_DEFAULT_STATE })).toEqual({
      q: '',
      page: 1,
      pageSize: 50,
      sort: 'name-asc',
    });

    expect(
      browseStateToUrl({
        state: {
          ...ITEM_BROWSE_DEFAULT_STATE,
          search: 'snail',
          page: 3,
          pageSize: 25,
          sort: { field: 'sourceId', direction: 'desc' },
        },
        includePage: false,
      }),
    ).toEqual({ q: 'snail', page: 1, pageSize: 25, sort: 'sourceId-desc' });
  });
});
