import { describe, expect, it } from 'vitest';

import { monsterPageMetadata } from '../metadata';

/**
 * Visitor-facing search metadata. The route `<head>` is exercised through the
 * Nitro smoke check; this covers the copy contract for every supported build.
 */
describe('monsterPageMetadata', () => {
  it('identifies the Classic World build for search', () => {
    expect(monsterPageMetadata('cw-launch')).toEqual({
      title: 'MapleStory Classic World Monsters – MapleTip',
      description:
        'Browse Classic World monsters in MapleStory. Compare levels, HP, EXP, attack, defense, and other stats.',
    });
  });

  it('identifies the GMS v83 build for search', () => {
    expect(monsterPageMetadata('gms-v83')).toEqual({
      title: 'MapleStory GMS v83 Monsters – MapleTip',
      description:
        'Browse GMS v83 monsters in MapleStory. Compare levels, HP, EXP, attack, defense, and other stats.',
    });
  });

  it('does not describe implementation details', () => {
    for (const buildId of ['cw-launch', 'gms-v83'] as const) {
      const { title, description } = monsterPageMetadata(buildId);
      for (const leaked of [
        'MapleKit',
        'SDK',
        'release',
        'manifest',
        'contract',
        'verified',
        'integrity',
        'projection',
      ]) {
        expect(title).not.toContain(leaked);
        expect(description).not.toContain(leaked);
      }
    }
  });
});
