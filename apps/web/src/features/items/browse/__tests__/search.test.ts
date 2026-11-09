import { describe, expect, it } from 'vitest';

import { matchSourceId } from '../search';

describe('source ID search matching', () => {
  it('matches numeric IDs while allowing leading-zero differences', () => {
    expect(matchSourceId('02000000', '2000000')).toBe(true);
    expect(matchSourceId('02000000', '02000000')).toBe(true);
    expect(matchSourceId('5000000', '5000000')).toBe(true);
  });

  it('never substring-matches or matches non-digit queries', () => {
    expect(matchSourceId('02000000', '200')).toBe(false);
    expect(matchSourceId('02000000', '02')).toBe(false);
    expect(matchSourceId('02000000', '0000')).toBe(false);
    expect(matchSourceId('02000000', 'potion')).toBe(false);
    expect(matchSourceId('02000000', '2000000a')).toBe(false);
    expect(matchSourceId('02000000', '')).toBe(false);
    expect(matchSourceId('02000000', '   ')).toBe(false);
  });
});
