import { describe, expect, it } from 'vitest';

import { MAX_ITEM_SUGGESTIONS, matchItemSuggestions } from '../suggestions';

const option = (value: string, label: string) => ({ value, label });
const seeAll = option('__see_all_results__', 'pebble');

describe('matchItemSuggestions', () => {
  it('returns empty for blank or unmatched queries', () => {
    const options = [option('1', 'Lantern Shard')];
    expect(matchItemSuggestions({ options, search: '', limit: 6 })).toEqual([]);
    expect(matchItemSuggestions({ options, search: '   ', limit: 6 })).toEqual(
      [],
    );
    expect(
      matchItemSuggestions({ options, search: 'not-found', limit: 6 }),
    ).toEqual([]);
  });

  it('matches case-insensitively, ranks prefixes first, and keeps the action after six names', () => {
    const options = [
      option('mid-2', 'Bright Pebble B'),
      option('pre-2', 'Pebble Beta'),
      option('mid-1', 'Amber Pebble A'),
      option('pre-1', 'Pebble Alpha'),
      option('pre-3', 'Pebble Gamma'),
      option('pre-4', 'Pebble Delta'),
      option('pre-5', 'Pebble Epsilon'),
      option('pre-6', 'Pebble Zeta'),
      seeAll,
    ];
    const results = matchItemSuggestions({
      options,
      search: '  pebble ',
      limit: MAX_ITEM_SUGGESTIONS,
    });
    expect(
      results.map((entry) => ('label' in entry ? entry.label : '')),
    ).toEqual([
      'Pebble Alpha',
      'Pebble Beta',
      'Pebble Delta',
      'Pebble Epsilon',
      'Pebble Gamma',
      'Pebble Zeta',
      'pebble',
    ]);
  });

  it('orders substring matches alphabetically after prefix matches', () => {
    const options = [
      option('sub-b', 'Old Lantern'),
      option('sub-a', 'Bright Lantern'),
      option('pre-a', 'Lantern Wick'),
    ];
    expect(
      matchItemSuggestions({ options, search: 'lantern', limit: 6 }).map(
        (entry) => ('value' in entry ? entry.value : ''),
      ),
    ).toEqual(['pre-a', 'sub-a', 'sub-b']);
  });
});
