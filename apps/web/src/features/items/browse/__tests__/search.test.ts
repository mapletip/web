import { describe, expect, it } from 'vitest';

import { matchSourceId } from '../search';

describe('Items Browse exact ID search', () => {
  it('matches digit-only IDs by numeric value, including leading zeroes', () => {
    expect(matchSourceId({ sourceId: '02000000', query: '2000000' })).toBe(
      true,
    );
    expect(matchSourceId({ sourceId: '02000000', query: '02000000' })).toBe(
      true,
    );
    expect(matchSourceId({ sourceId: '02000000', query: '200' })).toBe(false);
    expect(matchSourceId({ sourceId: '02000000', query: 'potion' })).toBe(
      false,
    );
    expect(matchSourceId({ sourceId: '02000000', query: ' 2000000 ' })).toBe(
      true,
    );
  });
});
