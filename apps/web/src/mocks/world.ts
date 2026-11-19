import type { MapPageRecordV1_1 } from '@mapletip/data/maps';
import type { MonsterPageRecordV1_2 } from '@mapletip/data/monsters';

/**
 * Invented Monster Browse rows used only by the web mock and integration tests.
 * Keep fields named here; the wire format's positional tuples are assembled by
 * release.ts so the fixture itself stays readable.
 */
export type FixtureFact<T> =
  | { readonly state: 'known'; readonly value: T }
  | { readonly state: 'unknown' }
  | { readonly state: 'absent'; readonly coverageKey: string }
  | { readonly state: 'unsupported' };

export type SpriteCase =
  'exact' | 'small' | 'large' | 'wide' | 'tall' | 'missing';
export type SpriteState = SpriteCase | 'unknown' | 'absent';
export type ItemClass = 'consume' | 'etc' | 'setup' | 'cash' | 'pet';

export type FixtureCategory =
  | { readonly kind: 'equip-slot'; readonly code: string }
  | { readonly kind: 'item-class'; readonly value: ItemClass }
  | { readonly kind: 'unknown' };

export interface FixtureLocation {
  /** Source Map identity used when building the corresponding Map page record. */
  readonly mapKey: string;
  readonly name?: string;
  readonly streetName?: string;
  readonly regionKey?: string;
  readonly regionLabel?: string;
  readonly placementCount: number;
  readonly minimapContentId?: string;
  readonly points?: readonly FixtureMapPoint[];
}

export interface FixtureMonster {
  readonly id: string;
  readonly name?: string;
  readonly level: number;
  readonly hp: FixtureFact<number>;
  readonly mp: FixtureFact<number>;
  readonly hpRecovery?: FixtureFact<number>;
  readonly mpRecovery?: FixtureFact<number>;
  readonly exp: FixtureFact<number>;
  readonly boss: FixtureFact<boolean>;
  readonly undead: FixtureFact<boolean>;
  readonly elements?: readonly FixtureMonsterElement[];
  readonly locationsState?: 'known' | 'absent' | 'unresolved';
  readonly locations?: readonly FixtureLocation[];
  readonly quests?: MonsterPageRecordV1_2['quests'];
  readonly summonedByItemIds?: readonly string[];
  readonly sprite: SpriteState;
}

export interface FixtureMonsterElement {
  readonly code: string;
  readonly effect: number;
  readonly meaning: string;
  readonly multiplier: number;
  readonly resistance: string;
}

export interface FixtureItem {
  readonly id: string;
  readonly name?: string;
  readonly itemClass: FixtureFact<ItemClass>;
  readonly category: FixtureCategory;
}

export interface FixtureDrop {
  readonly itemId: string;
  readonly assertionKind: 'native' | 'historical-overlay';
  readonly sourceBuild?: string;
  readonly confidence?: 'maybe';
}

export interface FixtureMapPoint {
  readonly x: number;
  readonly y: number;
}

export interface FixtureMapMonster {
  readonly monsterId: string;
  readonly points: readonly FixtureMapPoint[];
  readonly respawn?: 'ordinary' | 'none' | 'mixed';
}

export interface FixtureMapNpc {
  readonly id: string;
  readonly name: string;
  readonly points: readonly FixtureMapPoint[];
  readonly questCount?: MapPageRecordV1_1['npcs']['items'][number]['questCount'];
}

export interface FixtureMapConnection {
  readonly mapId: string;
  readonly points: readonly FixtureMapPoint[];
}

export interface FixtureMapWarp {
  readonly ends: readonly [FixtureMapPoint, FixtureMapPoint];
}

export interface FixtureMap {
  readonly id: string;
  readonly key?: string;
  readonly name?: string;
  readonly streetName?: string;
  readonly activity?: string;
  readonly description?: string;
  readonly geography?: {
    readonly regionKey?: string;
    readonly regionLabel?: string;
    readonly areaKey?: string;
    readonly areaLabel?: string;
  };
  readonly stage?: {
    readonly assetId: string;
    readonly width: number;
    readonly height: number;
    readonly contentId?: string;
  };
  readonly positionsPublished?: boolean;
  readonly information?: Partial<MapPageRecordV1_1['information']>;
  readonly monsters: readonly FixtureMapMonster[];
  readonly npcs: readonly FixtureMapNpc[];
  readonly connections: readonly FixtureMapConnection[];
  readonly returnMapId: string;
  readonly warps?: readonly FixtureMapWarp[];
}

export interface FixtureBuild {
  readonly familyId: string;
  readonly buildId: string;
  readonly historicalDrops: 'supported' | 'unsupported';
  readonly monsters: readonly FixtureMonster[];
  readonly items: readonly FixtureItem[];
  readonly drops: Readonly<Record<string, readonly FixtureDrop[]>>;
  readonly maps: readonly FixtureMap[];
}

const known = <T>(value: T): FixtureFact<T> => ({ state: 'known', value });
const unknown = <T>(): FixtureFact<T> => ({ state: 'unknown' });
const absent = <T>(coverageKey: string): FixtureFact<T> => ({
  state: 'absent',
  coverageKey,
});
const unsupported = <T>(): FixtureFact<T> => ({ state: 'unsupported' });

const cwMonsters: readonly FixtureMonster[] = [
  {
    id: 'plain-pebble',
    name: 'Plain Pebble',
    level: 1,
    hp: known(10),
    mp: known(2),
    exp: known(1),
    boss: known(false),
    undead: known(false),
    sprite: 'exact',
  },
  {
    id: 'twin-sprout-a',
    name: 'Twin Sprout',
    level: 2,
    hp: known(20),
    mp: known(4),
    exp: known(3),
    boss: known(false),
    undead: known(false),
    sprite: 'small',
  },
  {
    id: 'twin-sprout-b',
    name: 'Twin Sprout',
    level: 3,
    hp: known(30),
    mp: known(6),
    exp: known(5),
    boss: known(false),
    undead: known(false),
    sprite: 'exact',
  },
  {
    id: 'unnamed-fixture',
    level: 4,
    hp: known(40),
    mp: known(8),
    exp: known(6),
    boss: known(false),
    undead: known(false),
    sprite: 'unknown',
  },
  {
    id: 'patchy-records',
    name: 'Patchy Records',
    level: 5,
    hp: absent('fixture:hp-coverage'),
    mp: unknown(),
    hpRecovery: absent('fixture:hp-recovery-coverage'),
    mpRecovery: unknown(),
    exp: unsupported(),
    boss: known(false),
    undead: known(false),
    sprite: 'exact',
  },
  {
    id: 'zero-yield-drone',
    name: 'Zero Yield Drone',
    level: 6,
    hp: known(60),
    mp: known(12),
    exp: known(0),
    boss: known(false),
    undead: known(false),
    sprite: 'exact',
  },
  {
    id: 'hollow-husk',
    name: 'Hollow Husk',
    level: 7,
    hp: known(0),
    mp: known(14),
    exp: known(9),
    boss: known(false),
    undead: known(false),
    sprite: 'exact',
  },
  {
    id: 'slow-burn-titan',
    name: 'Slow Burn Titan',
    level: 8,
    hp: known(1_000_000),
    mp: known(16),
    exp: known(1),
    boss: known(false),
    undead: known(false),
    sprite: 'large',
  },
  {
    id: 'big-number-brute',
    name: 'Big Number Brute',
    level: 9,
    hp: known(2_147_483_647),
    mp: known(18),
    exp: known(2_147_483_647),
    boss: known(false),
    undead: known(false),
    sprite: 'exact',
  },
  {
    id: 'long-named-fixture',
    name: 'Extraordinarily Long Named Fixture Creature Of The Far Northern Reaches',
    level: 10,
    hp: known(100),
    mp: known(20),
    exp: known(12),
    boss: known(false),
    undead: known(false),
    sprite: 'exact',
  },
  {
    id: 'wide-banner',
    name: 'Wide Banner',
    level: 11,
    hp: known(110),
    mp: known(22),
    exp: known(14),
    boss: known(false),
    undead: known(false),
    sprite: 'wide',
  },
  {
    id: 'tall-totem',
    name: 'Tall Totem',
    level: 12,
    hp: known(120),
    mp: known(24),
    exp: known(16),
    boss: known(false),
    undead: known(false),
    sprite: 'tall',
  },
  {
    id: 'lost-portrait',
    name: 'Lost Portrait',
    level: 13,
    hp: known(130),
    mp: known(26),
    exp: known(18),
    boss: known(false),
    undead: known(false),
    sprite: 'missing',
  },
  {
    id: 'unrecorded-portrait',
    name: 'Unrecorded Portrait',
    level: 14,
    hp: known(140),
    mp: known(28),
    exp: known(20),
    boss: known(false),
    undead: known(false),
    sprite: 'absent',
  },
  {
    id: 'mystery-traits',
    name: 'Mystery Traits',
    level: 15,
    hp: known(150),
    mp: known(30),
    exp: known(22),
    boss: unknown(),
    undead: unknown(),
    sprite: 'exact',
  },
  {
    id: 'restless-shade',
    name: 'Restless Shade',
    level: 16,
    hp: known(160),
    mp: known(32),
    exp: known(24),
    boss: known(false),
    undead: known(true),
    sprite: 'exact',
  },
  {
    id: 'crowned-warden',
    name: 'Crowned Warden',
    level: 17,
    hp: known(170),
    mp: known(34),
    exp: known(26),
    boss: known(true),
    undead: known(false),
    quests: {
      state: 'known',
      entries: [
        {
          questKey: 'fixture:quest:warden-hunt',
          name: known('Synthetic Warden Hunt'),
          minLevel: known(12),
          jobCodes: { state: 'known', items: [100] },
          repeatable: known(true),
          killCount: known(18),
          countGroupSize: known(3),
          startNpc: {
            state: 'known',
            value: {
              name: known('Lantern Maker'),
              sprite: { state: 'unknown' },
            },
          },
          event: known(false),
        },
      ],
    },
    summonedByItemIds: ['quiet-bell'],
    locations: Array.from({ length: 12 }, (_, index): FixtureLocation => {
      const number = String(index + 1).padStart(2, '0');
      const placementCount = Math.max(1, 12 - index);
      const western = index < 8;
      return {
        mapKey: `fixture:map:${number}`,
        name: `Practice Map ${number}`,
        streetName: western
          ? 'Western Practice Grounds'
          : 'Eastern Practice Grounds',
        regionKey: western ? 'fixture:west' : 'fixture:east',
        regionLabel: western ? 'Practice West' : 'Practice East',
        placementCount,
        ...(index < 2
          ? {
              minimapContentId: String(index + 1).repeat(64),
              points: Array.from({ length: placementCount }, (_, point) => ({
                x: 120 + point * 35,
                y: 240 + (point % 3) * 45,
              })),
            }
          : {}),
      };
    }),
    sprite: 'exact',
  },
  {
    id: 'crowned-revenant',
    name: 'Crowned Revenant',
    level: 18,
    hp: known(180),
    mp: known(36),
    exp: known(28),
    boss: known(true),
    undead: known(true),
    quests: {
      state: 'known',
      entries: [
        {
          questKey: 'fixture:quest:lantern-festival',
          name: known('Lantern Festival Challenge'),
          minLevel: known(10),
          jobCodes: { state: 'known', items: [100] },
          repeatable: known(false),
          killCount: known(10),
          startNpc: { state: 'absent', coverageKey: 'fixture:quest-start-npc' },
          event: known(true),
        },
      ],
    },
    elements: [
      {
        code: 'S',
        effect: 2,
        meaning: 'Poison',
        multiplier: 0,
        resistance: 'Immune',
      },
      {
        code: 'H',
        effect: 1,
        meaning: 'Holy',
        multiplier: 1.5,
        resistance: 'Weak',
      },
    ],
    sprite: 'exact',
  },
  ...Array.from({ length: 12 }, (_, index): FixtureMonster => {
    const level = 20 + index * 5;
    const number = String(index + 1).padStart(2, '0');
    return {
      id: `filler-${number}`,
      name: `Filler ${number}`,
      level,
      hp: known(level * 10),
      mp: known(level * 2),
      ...(index === 0 ? { hpRecovery: unknown() } : {}),
      exp: known(level * 2),
      boss: known(false),
      undead: known(false),
      sprite: 'exact',
    };
  }),
];

const cwItems: readonly FixtureItem[] = [
  {
    id: 'practice-cap',
    name: 'Practice Cap',
    itemClass: unknown(),
    category: { kind: 'equip-slot', code: 'cap' },
  },
  {
    id: 'practice-boots',
    name: 'Practice Boots',
    itemClass: unknown(),
    category: { kind: 'equip-slot', code: 'shoes' },
  },
  {
    id: 'practice-gloves',
    name: 'Practice Gloves',
    itemClass: unknown(),
    category: { kind: 'equip-slot', code: 'gloves' },
  },
  {
    id: 'practice-shield',
    name: 'Practice Shield',
    itemClass: unknown(),
    category: { kind: 'equip-slot', code: 'shield' },
  },
  {
    id: 'practice-tonic-a',
    name: 'Practice Tonic A',
    itemClass: known('consume'),
    category: { kind: 'item-class', value: 'consume' },
  },
  {
    id: 'practice-tonic-b',
    name: 'Practice Tonic B',
    itemClass: known('consume'),
    category: { kind: 'item-class', value: 'consume' },
  },
  {
    id: 'sample-draught',
    name: 'Sample Draught',
    itemClass: known('consume'),
    category: { kind: 'item-class', value: 'consume' },
  },
  {
    id: 'training-snack',
    name: 'Training Snack',
    itemClass: known('consume'),
    category: { kind: 'item-class', value: 'consume' },
  },
  {
    id: 'pebble-token',
    name: 'Pebble Token',
    itemClass: known('consume'),
    category: { kind: 'item-class', value: 'consume' },
  },
  {
    id: 'quiet-bell',
    name: 'Quiet Bell',
    itemClass: known('setup'),
    category: { kind: 'item-class', value: 'setup' },
  },
  {
    id: 'sample-charm-a',
    name: 'Sample Charm',
    itemClass: known('etc'),
    category: { kind: 'item-class', value: 'etc' },
  },
  {
    id: 'sample-charm-b',
    name: 'Sample Charm',
    itemClass: known('etc'),
    category: { kind: 'item-class', value: 'etc' },
  },
  {
    id: 'warden-token',
    name: 'Warden Token',
    itemClass: known('etc'),
    category: { kind: 'item-class', value: 'etc' },
  },
  {
    id: 'long-named-drop',
    name: 'An Extraordinarily Long Synthetic Drop Name For Narrow Layouts',
    itemClass: known('etc'),
    category: { kind: 'item-class', value: 'etc' },
  },
  {
    id: 'woven-thread',
    name: 'Woven Thread',
    itemClass: known('etc'),
    category: { kind: 'item-class', value: 'etc' },
  },
  {
    id: 'practice-lantern',
    name: 'Practice Lantern',
    itemClass: known('setup'),
    category: { kind: 'item-class', value: 'setup' },
  },
  {
    id: 'training-banner',
    name: 'Training Banner',
    itemClass: known('setup'),
    category: { kind: 'item-class', value: 'setup' },
  },
  {
    id: 'paper-kite',
    name: 'Paper Kite',
    itemClass: known('setup'),
    category: { kind: 'item-class', value: 'setup' },
  },
  {
    id: 'color-card',
    name: 'Color Card',
    itemClass: known('setup'),
    category: { kind: 'item-class', value: 'setup' },
  },
  {
    id: 'pixel-pin',
    name: 'Pixel Pin',
    itemClass: known('cash'),
    category: { kind: 'item-class', value: 'cash' },
  },
  {
    id: 'star-badge',
    name: 'Star Badge',
    itemClass: known('cash'),
    category: { kind: 'item-class', value: 'cash' },
  },
  {
    id: 'toy-cape',
    name: 'Toy Cape',
    itemClass: known('cash'),
    category: { kind: 'item-class', value: 'cash' },
  },
  {
    id: 'toy-mite',
    name: 'Toy Mite',
    itemClass: known('pet'),
    category: { kind: 'item-class', value: 'pet' },
  },
  {
    id: 'paper-bird',
    name: 'Paper Bird',
    itemClass: known('pet'),
    category: { kind: 'item-class', value: 'pet' },
  },
  {
    id: 'plush-dot',
    name: 'Plush Dot',
    itemClass: known('pet'),
    category: { kind: 'item-class', value: 'pet' },
  },
  {
    id: 'clockwork-seed',
    name: 'Clockwork Seed',
    itemClass: known('pet'),
    category: { kind: 'item-class', value: 'pet' },
  },
  {
    id: 'unresolved-token',
    itemClass: unknown(),
    category: { kind: 'unknown' },
  },
];

const wardenItemIds = cwItems
  .map(({ id }) => id)
  .filter(
    (id) =>
      id !== 'pebble-token' && id !== 'quiet-bell' && id !== 'long-named-drop',
  );
const historical = (itemId: string): FixtureDrop => ({
  itemId,
  assertionKind: 'historical-overlay',
  sourceBuild: 'gms-v83',
  confidence: 'maybe',
});

const fixtureMapTargets: readonly Omit<
  FixtureMap,
  'connections' | 'returnMapId'
>[] = [
  {
    id: 'practice-grove',
    name: 'Practice Grove',
    streetName: 'Lantern Hills',
    geography: {
      regionKey: 'fixture:lantern-hills',
      regionLabel: 'Lantern Hills',
    },
    stage: { assetId: 'practice-grove', width: 900, height: 600 },
    monsters: [
      {
        monsterId: 'plain-pebble',
        points: [{ x: 240, y: 390 }],
        respawn: 'none',
      },
      {
        monsterId: 'twin-sprout-a',
        points: [
          { x: 240, y: 390 },
          { x: 380, y: 350 },
        ],
      },
      {
        monsterId: 'hollow-husk',
        points: [{ x: 570, y: 420 }],
        respawn: 'mixed',
      },
      {
        monsterId: 'crowned-warden',
        points: [{ x: 690, y: 390 }],
      },
    ],
    npcs: [],
    warps: [
      {
        ends: [
          { x: 85, y: 500 },
          { x: 800, y: 470 },
        ],
      },
    ],
  },
  {
    id: 'quiet-gallery',
    name: 'Quiet Gallery',
    monsters: [],
    npcs: [
      {
        id: 'gallery-guide',
        name: 'Gallery Guide',
        points: [{ x: 400, y: 300 }],
      },
    ],
  },
  {
    id: 'stillwater-stage',
    name: 'Stillwater Stage',
    stage: { assetId: 'stillwater-stage', width: 900, height: 600 },
    positionsPublished: false,
    monsters: [{ monsterId: 'plain-pebble', points: [{ x: 330, y: 390 }] }],
    npcs: [],
  },
  {
    id: 'unnamed-stage',
    stage: { assetId: 'unnamed-stage', width: 900, height: 600 },
    monsters: [],
    npcs: [],
  },
  {
    id: 'brass-walk',
    name: 'Brass Walk',
    stage: { assetId: 'brass-walk', width: 900, height: 600 },
    monsters: [],
    npcs: [
      { id: 'brass-guide', name: 'Brass Guide', points: [{ x: 470, y: 320 }] },
    ],
  },
  {
    id: 'paper-lane',
    name: 'Paper Lane',
    stage: { assetId: 'paper-lane', width: 900, height: 600 },
    monsters: [],
    npcs: [],
  },
  {
    id: 'cloud-arch',
    name: 'Cloud Arch',
    stage: { assetId: 'cloud-arch', width: 900, height: 600 },
    monsters: [],
    npcs: [],
  },
];

const townMapId = 'lantern-square';

export const fixtureMaps: readonly FixtureMap[] = [
  {
    id: townMapId,
    name: 'Lantern Square',
    streetName: 'Lantern Hills',
    activity: 'Market',
    description: 'A gathering place beneath paper lanterns.',
    information: {
      music: { state: 'known', value: 'Floral Life' },
      timeLimitSeconds: { state: 'known', value: 600 },
      swimming: { state: 'known', value: true },
      flying: { state: 'known', value: false },
    },
    geography: {
      regionKey: 'fixture:lantern-hills',
      regionLabel: 'Lantern Hills',
    },
    stage: { assetId: 'lantern-square', width: 1100, height: 700 },
    monsters: [],
    npcs: (
      [
        ['bellkeeper', 'Bellkeeper'],
        ['map-seller', 'Map Seller'],
        ['lantern-maker', 'Lantern Maker', { state: 'known', count: 1 }],
        ['tea-host', 'Tea Host'],
        ['courier', 'Courier'],
        ['storyteller', 'Storyteller', { state: 'partial', count: 1 }],
        ['gardener', 'Town Gardener'],
        ['clock-mender', 'Clock Mender'],
      ] as const
    ).map(([id, name, questCount], index) => ({
      id: `town-${id}`,
      name,
      points: [{ x: 140 + index * 105, y: 420 }],
      ...(questCount === undefined ? {} : { questCount }),
    })),
    connections: fixtureMapTargets.map((map, index) => ({
      mapId: map.id,
      points: [{ x: 90 + index * 140, y: 160 + (index % 3) * 90 }],
    })),
    returnMapId: 'practice-grove',
  },
  ...fixtureMapTargets.map((map, index): FixtureMap => ({
    ...map,
    connections: [
      { mapId: townMapId, points: [{ x: 430, y: 270 + index * 20 }] },
    ],
    returnMapId: townMapId,
  })),
  {
    id: 'synthetic-monster-yard',
    name: 'Synthetic Monster Yard',
    streetName: 'Lantern Hills',
    geography: {
      regionKey: 'fixture:lantern-hills',
      regionLabel: 'Lantern Hills',
    },
    stage: { assetId: 'synthetic-monster-yard', width: 900, height: 600 },
    monsters: [
      { monsterId: 'plain-pebble', points: [{ x: 100, y: 390 }] },
      {
        monsterId: 'twin-sprout-a',
        points: [
          { x: 200, y: 390 },
          { x: 240, y: 390 },
          { x: 280, y: 390 },
          { x: 320, y: 390 },
        ],
      },
      {
        monsterId: 'hollow-husk',
        points: [
          { x: 360, y: 390 },
          { x: 400, y: 390 },
          { x: 440, y: 390 },
          { x: 480, y: 390 },
          { x: 520, y: 390 },
        ],
      },
      {
        monsterId: 'patchy-records',
        points: [
          { x: 560, y: 390 },
          { x: 600, y: 390 },
        ],
      },
      {
        monsterId: 'zero-yield-drone',
        points: [
          { x: 640, y: 390 },
          { x: 660, y: 390 },
          { x: 680, y: 390 },
          { x: 700, y: 390 },
          { x: 720, y: 390 },
          { x: 740, y: 390 },
        ],
      },
      {
        monsterId: 'big-number-brute',
        points: [{ x: 760, y: 390 }],
      },
      {
        monsterId: 'crowned-warden',
        points: [
          { x: 800, y: 390 },
          { x: 840, y: 390 },
          { x: 880, y: 390 },
        ],
      },
    ],
    npcs: [],
    connections: [{ mapId: townMapId, points: [{ x: 430, y: 270 }] }],
    returnMapId: townMapId,
  },
];

export const world: { readonly builds: readonly FixtureBuild[] } = {
  builds: [
    {
      familyId: 'classic-world',
      buildId: 'cw-launch',
      historicalDrops: 'supported',
      monsters: cwMonsters,
      items: cwItems,
      maps: fixtureMaps,
      drops: {
        'plain-pebble': [historical('pebble-token')],
        'crowned-warden': wardenItemIds.map(historical),
        'crowned-revenant': [
          historical('practice-tonic-a'),
          historical('sample-charm-a'),
          historical('long-named-drop'),
        ],
      },
    },
    {
      familyId: 'gms',
      buildId: 'gms-v83',
      historicalDrops: 'unsupported',
      monsters: [
        {
          id: 'native-alpha',
          name: 'Native Alpha',
          level: 2,
          hp: known(25),
          mp: known(4),
          exp: known(5),
          boss: known(false),
          undead: known(false),
          sprite: 'exact',
        },
        {
          id: 'native-beta',
          name: 'Native Beta',
          level: 3,
          hp: known(35),
          mp: known(6),
          exp: known(7),
          boss: known(false),
          undead: known(false),
          sprite: 'exact',
        },
        {
          id: 'native-gamma',
          name: 'Native Gamma',
          level: 4,
          hp: known(45),
          mp: known(8),
          exp: known(9),
          boss: known(false),
          undead: known(false),
          sprite: 'exact',
        },
      ],
      items: [
        {
          id: 'native-flake',
          name: 'Native Flake',
          itemClass: known('etc'),
          category: { kind: 'item-class', value: 'etc' },
        },
        {
          id: 'native-bloom',
          name: 'Native Bloom',
          itemClass: known('consume'),
          category: { kind: 'item-class', value: 'consume' },
        },
      ],
      maps: fixtureMaps.map((map) => ({ ...map, monsters: [] })),
      drops: {
        'native-alpha': [
          { itemId: 'native-flake', assertionKind: 'native' },
          { itemId: 'native-bloom', assertionKind: 'native' },
        ],
      },
    },
  ],
};

export const spriteDimensions: Readonly<
  Record<SpriteCase, readonly [number, number]>
> = {
  exact: [40, 40],
  small: [16, 16],
  large: [256, 256],
  wide: [120, 24],
  tall: [24, 120],
  missing: [40, 40],
};
