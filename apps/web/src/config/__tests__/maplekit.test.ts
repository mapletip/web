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

  it('uses the selected immutable D0 release pin', () => {
    expect(MAPLEKIT_RELEASE.baseUrl).toBe('https://d0.mapletip.com/');
    expect(MAPLEKIT_RELEASE.pin).toMatchObject({
      format: 'mapletip.local-release-pin',
      releaseId:
        'release-df9d9eb093a48600160f1883070483414bf2391ac32f2023f1fc575a59dc302c',
      path: 'v1/releases/66da0268b3bc08a1745b7a8721a269acd6de4ab547cbc1bb73e70b882deec5c4.json',
      sha256:
        '66da0268b3bc08a1745b7a8721a269acd6de4ab547cbc1bb73e70b882deec5c4',
      byteLength: 916,
    });
  });
});
