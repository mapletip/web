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
        'release-dbf14ba28dad5bc90760a5c5ee4f77e3f45ff105d003b822e14f905aa32701ca',
      path: 'v1/releases/6fbe1994bff03cb5776e051d455506f2cd57e9ffe735cdc44a0eb1716e044527.json',
      sha256:
        '6fbe1994bff03cb5776e051d455506f2cd57e9ffe735cdc44a0eb1716e044527',
      byteLength: 868,
    });
  });
});
