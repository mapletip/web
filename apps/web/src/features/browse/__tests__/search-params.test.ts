import { describe, expect, it } from 'vitest';

import { defineBrowseSearch } from '../search-params';

const LEVEL_SORTS = [
  { label: 'Level: low to high', field: 'level', direction: 'asc' },
  { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
] as const;

describe('defineBrowseSearch', () => {
  const address = defineBrowseSearch({ sortOptions: LEVEL_SORTS });

  it('takes the default order from the first sort option', () => {
    expect(address.defaultSearch).toEqual({
      q: '',
      page: 1,
      pageSize: 50,
      sort: 'level-asc',
    });
    expect(address.schema.parse({ sort: 'bogus' }).sort).toBe('level-asc');
    expect(address.defaultState.sort).toEqual({
      field: 'level',
      direction: 'asc',
    });
  });

  it('round-trips facet values and a non-default sort', () => {
    const search = address.schema.parse({
      sort: 'name-asc',
      page: 2,
      monster: ['a', 'b'],
      level: { min: 20, max: 25 },
      has: ['npcs'],
    });
    const state = address.urlToBrowseState({ search });

    expect(state.sort).toEqual({ field: 'name', direction: 'asc' });
    expect(state.filters).toEqual({
      monster: ['a', 'b'],
      level: { min: 20, max: 25 },
      has: ['npcs'],
    });
    expect(address.browseStateToUrl({ state })).toEqual(search);
  });

  it('falls back to the page default when a context has no sort options', () => {
    const state = address.urlToBrowseState({
      search: address.schema.parse({ sort: 'name-asc' }),
      sortOptions: [],
    });

    expect(state.sort).toEqual({ field: 'level', direction: 'asc' });
  });
});

describe('isDefaultSearch', () => {
  const address = defineBrowseSearch({ sortOptions: LEVEL_SORTS });

  it('is true only for the default view', () => {
    expect(address.isDefaultSearch(address.schema.parse({}))).toBe(true);
    expect(address.isDefaultSearch(address.schema.parse({ q: '  ' }))).toBe(
      true,
    );
    expect(address.isDefaultSearch(address.schema.parse({ monster: [] }))).toBe(
      true,
    );
    for (const search of [
      { q: 'snail' },
      { page: 2 },
      { pageSize: 25 },
      { sort: 'name-asc' },
      { monster: ['a'] },
      { level: {} },
      { has: false },
    ]) {
      expect(address.isDefaultSearch(address.schema.parse(search))).toBe(false);
    }
  });
});
