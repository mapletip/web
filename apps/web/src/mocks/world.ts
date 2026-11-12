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
  readonly sprite: SpriteState;
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

export interface FixtureBuild {
  readonly familyId: string;
  readonly buildId: string;
  readonly historicalDrops: 'supported' | 'unsupported';
  readonly monsters: readonly FixtureMonster[];
  readonly items: readonly FixtureItem[];
  readonly drops: Readonly<Record<string, readonly FixtureDrop[]>>;
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
  .filter((id) => id !== 'pebble-token' && id !== 'quiet-bell');
const historical = (itemId: string): FixtureDrop => ({
  itemId,
  assertionKind: 'historical-overlay',
  sourceBuild: 'gms-v83',
  confidence: 'maybe',
});

export const world: { readonly builds: readonly FixtureBuild[] } = {
  builds: [
    {
      familyId: 'classic-world',
      buildId: 'cw-launch',
      historicalDrops: 'supported',
      monsters: cwMonsters,
      items: cwItems,
      drops: {
        'plain-pebble': [historical('pebble-token')],
        'crowned-warden': wardenItemIds.map(historical),
        'crowned-revenant': [
          historical('practice-tonic-a'),
          historical('sample-charm-a'),
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
