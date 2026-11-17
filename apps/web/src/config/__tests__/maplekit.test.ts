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
        'release-aa86cbc90a010d6a54b95f2682825e7f3262f4d7fbfe0b368671150fc10e054e',
      path: 'v1/releases/4f2c504bc30d38afb5f04ce3e30140d5d311e6b1fb33d334f15ec34f8e0ee63b.json',
      sha256:
        '4f2c504bc30d38afb5f04ce3e30140d5d311e6b1fb33d334f15ec34f8e0ee63b',
      byteLength: 916,
    });
  });
});
