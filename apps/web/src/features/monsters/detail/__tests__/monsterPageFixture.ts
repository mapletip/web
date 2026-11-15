import type { MonsterPageRecordV1 } from '@mapletip/data/monsters';

const UNKNOWN = { state: 'unknown' } as const;

export function monsterPageFixture(
  overrides: Partial<MonsterPageRecordV1> = {},
): MonsterPageRecordV1 {
  return {
    format: 'mapletip.monster-page',
    contractVersion: '1.0',
    scope: { build_id: 'cw-launch', family_id: 'classic-world' },
    key: 'fixture:monster:001',
    publicId: '36z2h01p',
    slug: 'sentinel-snail',
    name: { state: 'known', value: 'Sentinel Snail' },
    sprite: {
      contentId: { state: 'known', value: 'a'.repeat(64) },
    },
    boss: UNKNOWN,
    undead: UNKNOWN,
    elements: UNKNOWN,
    hpRecovery: UNKNOWN,
    mpRecovery: UNKNOWN,
    stats: {
      level: UNKNOWN,
      hp: UNKNOWN,
      mp: UNKNOWN,
      exp: UNKNOWN,
      paDamage: UNKNOWN,
      pdDamage: UNKNOWN,
      maDamage: UNKNOWN,
      mdDamage: UNKNOWN,
      acc: UNKNOWN,
      eva: UNKNOWN,
      pushed: UNKNOWN,
      speed: UNKNOWN,
    },
    drops: {
      entries: [],
      summary: {
        native: UNKNOWN,
      },
    },
    locations: {
      entries: [],
      summary: { state: 'absent' },
    },
    quests: {
      entries: [],
      state: 'unknown',
    },
    summonedByItems: [],
    ...overrides,
  };
}
