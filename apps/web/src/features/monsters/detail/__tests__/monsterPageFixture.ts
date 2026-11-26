import type { MonsterPageRecordV1_4 } from '@mapletip/data/monsters';

const UNKNOWN = { state: 'unknown' } as const;

export function monsterPageFixture(
  overrides: { readonly [key: string]: unknown } = {},
): MonsterPageRecordV1_4 {
  return {
    format: 'mapletip.monster-page',
    contractVersion: '1.4',
    scope: { build_id: 'cw-launch', family_id: 'classic-world' },
    key: 'fixture:monster:001',
    publicId: '36z2h01p',
    slug: 'sentinel-shellback',
    name: { state: 'known', value: 'Sentinel Shellback' },
    sprite: {
      contentId: { state: 'known', value: 'a'.repeat(64) },
      width: 32,
      height: 48,
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
        count: 0,
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
  } as unknown as MonsterPageRecordV1_4;
}
