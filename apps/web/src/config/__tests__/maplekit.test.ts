import { describe, expect, it } from 'vitest';

import {
  BUILDS,
  DEFAULT_BUILD_ID,
  isBuildId,
  MAPLEKIT_RELEASE,
} from '@/config/maplekit';

describe('maplekit configuration', () => {
  it('accepts only explicitly supported build IDs', () => {
    for (const id of Object.keys(BUILDS)) {
      expect(isBuildId(id)).toBe(true);
    }
    expect(isBuildId('unknown')).toBe(false);
    expect(isBuildId('')).toBe(false);
    expect(isBuildId('cw-launch ')).toBe(false);
  });

  it('configures a supported canonical build', () => {
    expect(isBuildId(DEFAULT_BUILD_ID)).toBe(true);
    expect(DEFAULT_BUILD_ID).toBe('cw-launch');
  });

  it('keeps the immutable pin and origin unchanged', () => {
    // Guards against an accidental release rotation; changing them is a
    // deliberate release-pin decision, not a refactor.
    expect(MAPLEKIT_RELEASE.baseUrl).toBe('https://data.mapletip.com/');
    expect(MAPLEKIT_RELEASE.pin).toMatchObject({
      format: 'mapletip.local-release-pin',
      sha256:
        'aa16dd552dc2502ed6a16ea19b9e778d06c2d83aedd1d89a456197b0cf0ea06f',
      byteLength: 745,
    });
  });
});
