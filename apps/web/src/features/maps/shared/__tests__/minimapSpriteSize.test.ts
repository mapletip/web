import { describe, expect, it } from 'vitest';

import { minimapSpriteSize } from '../minimapSpriteSize';

describe('minimapSpriteSize', () => {
  it('multiplies a game-pixel size by the stage scale', () => {
    // MapleKit's known answer: minimap scale 4 publishes 0.0625.
    expect(minimapSpriteSize({ width: 64, height: 48, scale: 0.0625 })).toEqual(
      { width: 4, height: 3 },
    );
    expect(minimapSpriteSize({ width: 64, height: 48, scale: 0.125 })).toEqual({
      width: 8,
      height: 6,
    });
  });
});
