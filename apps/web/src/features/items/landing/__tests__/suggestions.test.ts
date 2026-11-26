import { describe, expect, it } from 'vitest';

import type { CategorizedItemRow } from '../../browse/project';
import { MAX_ITEM_SUGGESTIONS, matchItemSuggestions } from '../suggestions';

function makeRow({
  sourceId,
  name,
}: {
  readonly sourceId: string;
  readonly name?: string;
}): CategorizedItemRow {
  return {
    key: `item:test:${sourceId}`,
    sourceId,
    itemClass: 'etc',
    ...(name === undefined ? {} : { name }),
    kind: 'other-etc',
    kindPath: ['all', 'etc', 'other-etc'],
  };
}

describe('matchItemSuggestions', () => {
  it('returns empty for blank or unmatched queries', () => {
    const rows = [makeRow({ sourceId: '1', name: 'Lantern Shard' })];
    expect(matchItemSuggestions({ rows, query: '' })).toEqual([]);
    expect(matchItemSuggestions({ rows, query: '   ' })).toEqual([]);
    expect(matchItemSuggestions({ rows, query: 'not-found' })).toEqual([]);
  });

  it('matches case-insensitively, ranks prefix matches first, and caps at six', () => {
    const rows = [
      makeRow({ sourceId: 'mid-2', name: 'Bright Pebble B' }),
      makeRow({ sourceId: 'pre-2', name: 'Pebble Beta' }),
      makeRow({ sourceId: 'mid-1', name: 'Amber Pebble A' }),
      makeRow({ sourceId: 'pre-1', name: 'Pebble Alpha' }),
      makeRow({ sourceId: 'pre-3', name: 'Pebble Gamma' }),
      makeRow({ sourceId: 'pre-4', name: 'Pebble Delta' }),
      makeRow({ sourceId: 'pre-5', name: 'Pebble Epsilon' }),
      makeRow({ sourceId: 'pre-6', name: 'Pebble Zeta' }),
      makeRow({ sourceId: 'unnamed' }),
    ];

    const results = matchItemSuggestions({ rows, query: '  pebble ' });
    expect(results).toHaveLength(MAX_ITEM_SUGGESTIONS);
    expect(results.map((row) => row.name)).toEqual([
      'Pebble Alpha',
      'Pebble Beta',
      'Pebble Delta',
      'Pebble Epsilon',
      'Pebble Gamma',
      'Pebble Zeta',
    ]);
  });

  it('orders substring matches alphabetically after prefix matches', () => {
    const rows = [
      makeRow({ sourceId: 'sub-b', name: 'Old Lantern' }),
      makeRow({ sourceId: 'sub-a', name: 'Bright Lantern' }),
      makeRow({ sourceId: 'pre-a', name: 'Lantern Wick' }),
    ];

    const results = matchItemSuggestions({ rows, query: 'lantern' });
    expect(results.map((row) => row.sourceId)).toEqual([
      'pre-a',
      'sub-a',
      'sub-b',
    ]);
  });
});
