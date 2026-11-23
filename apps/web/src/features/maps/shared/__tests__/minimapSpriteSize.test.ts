import { describe, expect, it } from 'vitest';

import {
  MINIMAP_SCALE_ESTIMATE,
  minimapSpriteSize,
} from '../minimapSpriteSize';

describe('minimapSpriteSize', () => {
  it('estimates minimap pixels from game-pixel dimensions', () => {
    expect(MINIMAP_SCALE_ESTIMATE).toBe(1 / 16);
    expect(minimapSpriteSize({ width: 62, height: 51 })).toEqual({
      width: 3.875,
      height: 3.1875,
    });
  });
});
