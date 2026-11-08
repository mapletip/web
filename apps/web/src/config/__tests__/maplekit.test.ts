import { describe, expect, it } from 'vitest';

import {
  BUILDS,
  DEFAULT_BUILD_ID,
  isBuildId,
  MAPLEKIT_RELEASE,
  supportedBuildSlug,
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

  it('narrows valid alternate build slugs and rejects default or unknown with notFound', () => {
    expect(supportedBuildSlug('gms-v83')).toBe('gms-v83');
    expect(() => supportedBuildSlug('cw-launch')).toThrow();
    expect(() => supportedBuildSlug('unknown')).toThrow();
  });

  it('keeps the immutable pin and origin unchanged', () => {
    // Guards against an accidental release rotation; changing them is a
    // deliberate release-pin decision, not a refactor.
    expect(MAPLEKIT_RELEASE.baseUrl).toBe('https://d0.mapletip.com/');
    expect(MAPLEKIT_RELEASE.pin).toMatchObject({
      format: 'mapletip.local-release-pin',
      releaseId:
        'release-7bc0f9ed742b297bfe89324818820b90b3f963a691ba816539b0fffa0cf6d61b',
      path: 'v1/releases/6cb6b4ee26f52e2da9b4ea50f7553742ae3b41d2451722497eb91c6102d8ec86.json',
      sha256:
        '6cb6b4ee26f52e2da9b4ea50f7553742ae3b41d2451722497eb91c6102d8ec86',
      byteLength: 745,
    });
  });
});
