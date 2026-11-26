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

  it('uses the selected immutable MapleKit release pin', () => {
    expect(MAPLEKIT_RELEASE.baseUrl).toBe('https://d0.mapletip.com/');
    expect(MAPLEKIT_RELEASE.pin).toMatchObject({
      format: 'mapletip.local-release-pin',
      releaseId:
        'release-c866545c43fb66eea885537a9387967d1318e5c6c8504874a297433fd19a592c',
      path: 'v1/releases/6a03a0cce4c55c317c3e888a8271ee1dafc76243fea115472ef9734109076415.json',
      sha256:
        '6a03a0cce4c55c317c3e888a8271ee1dafc76243fea115472ef9734109076415',
      byteLength: 939,
    });
  });
});
