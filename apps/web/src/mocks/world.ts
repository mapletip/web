import type {
  ItemBrowseCoverage,
  ItemBrowseRecordV2_2,
} from '@mapletip/data/items';
import type { MapPageRecordV1_2, MapRestrictionV1 } from '@mapletip/data/maps';
import type { MonsterPageRecordV1_4 } from '@mapletip/data/monsters';

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

export const FIXTURE_EVIDENCE_KINDS = {
  native: { label: "This version's game files" },
  'historical-overlay': { label: "Another version's game files" },
  vod: { label: 'VOD' },
  screenshot: { label: 'Screenshot' },
} as const;

export type FixtureEvidenceKind = keyof typeof FIXTURE_EVIDENCE_KINDS;

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
  readonly quests?: MonsterPageRecordV1_4['quests'];
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
  readonly sprite?: SpriteState;
  readonly types?: NonNullable<ItemBrowseRecordV2_2['types']>;
  readonly functions?: NonNullable<ItemBrowseRecordV2_2['functions']>;
  readonly family?: string;
  readonly recovery?: NonNullable<ItemBrowseRecordV2_2['recovery']>;
  readonly seatingRecovery?: NonNullable<
    ItemBrowseRecordV2_2['seatingRecovery']
  >;
  readonly buff?: NonNullable<ItemBrowseRecordV2_2['buff']>;
  readonly projectileAttack?: FixtureFact<number>;
  readonly maxStack?: number;
  readonly scroll?: NonNullable<ItemBrowseRecordV2_2['scroll']>;
  readonly sellPrice?: FixtureFact<number>;
  readonly cashShopSale?: NonNullable<ItemBrowseRecordV2_2['cashShopSale']>;
  readonly questFlag?: boolean;
  readonly questUses?: readonly FixtureItemQuestUse[];
  readonly questRewards?: readonly FixtureQuest[];
  readonly description?: string;
}

export type FixtureQuestRole =
  | 'turned-in'
  | 'held-to-complete'
  | 'held-to-start'
  | 'must-not-be-held'
  | 'pet'
  | 'monster-card'
  | 'not-established';

export interface FixtureQuest {
  readonly id: string;
  readonly name: string;
  readonly startLevel?: number;
}

export interface FixtureItemQuestUse {
  readonly quest: FixtureQuest;
  readonly roles: readonly {
    readonly role: FixtureQuestRole;
    readonly amount?: number;
  }[];
}

export interface FixtureRecipe {
  readonly id: string;
  readonly name: string;
  readonly fee: FixtureFact<number>;
  readonly ingredients: readonly {
    readonly itemId: string;
    readonly amount: number;
  }[];
  readonly products: readonly {
    readonly itemId?: string;
    readonly name: string;
    readonly outcome: 'guaranteed' | 'random';
  }[];
}

export interface FixtureContainer {
  readonly id: string;
  readonly name: string;
  readonly itemIds: readonly string[];
}

export interface FixtureCashShopListing {
  readonly id: string;
  readonly name: string;
  readonly itemIds: readonly string[];
}

export interface FixtureDropEvidence {
  readonly kind: FixtureEvidenceKind;
  readonly build: string;
  readonly date?: string;
  readonly url?: string;
  readonly startSeconds?: number;
}

export interface FixtureDrop {
  readonly itemId: string;
  readonly evidence: readonly [FixtureDropEvidence, ...FixtureDropEvidence[]];
}

export interface FixtureMapPoint {
  readonly x: number;
  readonly y: number;
}

export interface FixtureMapMonster {
  readonly monsterId: string;
  readonly points: readonly FixtureMapPoint[];
  readonly respawn?: MapPageRecordV1_2['monsters']['items'][number]['respawn'];
}

export interface FixtureMapNpc {
  readonly id: string;
  readonly name: string;
  readonly points: readonly FixtureMapPoint[];
  readonly questCount?: MapPageRecordV1_2['npcs']['items'][number]['questCount'];
  /** Served like a monster sprite of the same case; unknown when omitted. */
  readonly sprite?: SpriteCase;
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
  /** Reviewed geography placement; its classification types the activity. */
  readonly placement?: { readonly classification: string };
  readonly description?: string;
  readonly geography?: {
    readonly regionKey?: string;
    readonly regionLabel?: string;
    readonly areaKey?: string;
    readonly areaLabel?: string;
    readonly collectionKey?: string;
    readonly collectionLabel?: string;
  };
  readonly stage?: {
    readonly assetId: string;
    readonly width: number;
    readonly height: number;
    readonly contentId?: string;
  };
  readonly positionsPublished?: boolean;
  readonly information?: Partial<MapPageRecordV1_2['information']>;
  readonly monsters: readonly FixtureMapMonster[];
  readonly npcs: readonly FixtureMapNpc[];
  readonly connections: readonly FixtureMapConnection[];
  readonly returnMapId: string;
  readonly warps?: readonly FixtureMapWarp[];
  /** The map has no published mark (Map page and browse row agree). */
  readonly noMark?: true;
  /** Map browse 1.1 player facts; each is `absent` when omitted. */
  readonly player?: FixtureMapPlayerFacts;
}

export interface FixtureMapPlayerFacts {
  readonly entryLevel?: number;
  readonly levelCap?: number;
  readonly hpDrain?: {
    readonly amount: number;
    readonly protectionItem?: { readonly key: string; readonly name: string };
  };
  readonly underwater?: boolean;
  readonly timeLimitSeconds?: number;
  readonly partyOnly?: true;
  /** Reviewed town; `unknown` for every other map, as MapleKit publishes. */
  readonly town?: true;
  readonly restrictions?: readonly MapRestrictionV1[];
}

export interface FixtureBuild {
  readonly familyId: string;
  readonly buildId: string;
  readonly historicalDrops: 'supported' | 'unsupported';
  readonly monsters: readonly FixtureMonster[];
  readonly items: readonly FixtureItem[];
  readonly itemBrowseCoverage: ItemBrowseCoverage;
  readonly recipes: readonly FixtureRecipe[];
  readonly containers: readonly FixtureContainer[];
  readonly cashShopListings: readonly FixtureCashShopListing[];
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
          jobFamilies: { state: 'unknown' },
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
              points: Array.from(
                { length: index === 1 ? placementCount - 1 : placementCount },
                (_, point) => ({
                  x: 120 + point * 35,
                  y: 240 + (point % 3) * 45,
                }),
              ),
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
          jobFamilies: { state: 'unknown' },
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

const cwBaseItems: readonly FixtureItem[] = [
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
    types: ['potion'],
    functions: ['recovery'],
    recovery: { hp: 300 },
    sellPrice: known(0),
    sprite: 'small',
  },
  {
    id: 'practice-tonic-b',
    name: 'Practice Tonic B',
    itemClass: known('consume'),
    category: { kind: 'item-class', value: 'consume' },
    types: ['potion'],
    functions: ['recovery'],
    recovery: { mp: 120 },
    sellPrice: known(1),
    sprite: 'exact',
  },
  {
    id: 'sample-draught',
    name: 'Sample Draught',
    itemClass: known('consume'),
    category: { kind: 'item-class', value: 'consume' },
    types: ['potion'],
    functions: ['recovery'],
    recovery: { hp: 150, mp: 80 },
    sellPrice: known(1_200),
    sprite: 'large',
  },
  {
    id: 'training-snack',
    name: 'Training Snack',
    itemClass: known('consume'),
    category: { kind: 'item-class', value: 'consume' },
    types: ['food-buff'],
    buff: {
      durationSeconds: 600,
      effects: [{ stat: 'weaponAttack', unit: 'flat', value: 5 }],
    },
    sellPrice: unknown(),
  },

  {
    id: 'pebble-token',
    name: 'Pebble Token',
    itemClass: known('consume'),
    category: { kind: 'item-class', value: 'consume' },
    types: ['potion'],
    sprite: 'missing',
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
    types: ['monster-material'],
    sellPrice: known(10),
    questFlag: true,
  },
  {
    id: 'sample-charm-b',
    name: 'Sample Charm',
    itemClass: known('etc'),
    category: { kind: 'item-class', value: 'etc' },
    types: ['gem'],
    sellPrice: known(10),
  },
  {
    id: 'warden-token',
    name: 'Warden Token',
    itemClass: known('etc'),
    category: { kind: 'item-class', value: 'etc' },
    types: ['monster-material'],
    sellPrice: known(2_500),
  },
  {
    id: 'long-named-drop',
    name: 'An Extraordinarily Long Synthetic Drop Name For Narrow Layouts',
    itemClass: known('etc'),
    category: { kind: 'item-class', value: 'etc' },
    types: ['monster-material'],
    sellPrice: known(25),
    sprite: 'wide',
    description:
      'A long, invented description that wraps comfortably in a narrow card. It stops after two lines in browse and remains available in the detail drawer.',
  },
  {
    id: 'woven-thread',
    name: 'Woven Thread',
    itemClass: known('etc'),
    category: { kind: 'item-class', value: 'etc' },
    types: ['refined-material'],
    sellPrice: known(35),
    questUses: [
      {
        quest: { id: 'thread-trial', name: 'Thread Trial' },
        roles: [{ role: 'turned-in', amount: 4 }],
      },
    ],
  },
  {
    id: 'practice-lantern',
    name: 'Practice Lantern',
    itemClass: known('setup'),
    category: { kind: 'item-class', value: 'setup' },
    types: ['furniture'],
    sprite: 'wide',
  },
  {
    id: 'training-banner',
    name: 'Training Banner',
    itemClass: known('setup'),
    category: { kind: 'item-class', value: 'setup' },
    types: ['holiday-ornament'],
    sprite: 'tall',
  },
  {
    id: 'paper-kite',
    name: 'Paper Kite',
    itemClass: known('setup'),
    category: { kind: 'item-class', value: 'setup' },
    types: ['chair'],
    sprite: 'small',
  },
  {
    id: 'color-card',
    name: 'Color Card',
    itemClass: known('setup'),
    category: { kind: 'item-class', value: 'setup' },
    types: ['crafting-station'],
  },
  {
    id: 'pixel-pin',
    name: 'Pixel Pin',
    itemClass: known('cash'),
    category: { kind: 'item-class', value: 'cash' },
    sellPrice: known(0),
    cashShopSale: {
      state: 'on-sale',
      duration: { kind: 'permanent' },
      price: 120,
      quantity: 1,
    },
  },
  {
    id: 'star-badge',
    name: 'Star Badge',
    itemClass: known('cash'),
    category: { kind: 'item-class', value: 'cash' },
    cashShopSale: {
      state: 'on-sale',
      duration: { kind: 'days', days: 7 },
      price: 45,
      quantity: 1,
    },
  },
  {
    id: 'toy-cape',
    name: 'Toy Cape',
    itemClass: known('cash'),
    category: { kind: 'item-class', value: 'cash' },
    cashShopSale: { state: 'not-on-sale' },
  },
  {
    id: 'toy-mite',
    name: 'Toy Mite',
    itemClass: known('pet'),
    category: { kind: 'item-class', value: 'pet' },
    functions: ['pet'],
  },
  {
    id: 'paper-bird',
    name: 'Paper Bird',
    itemClass: known('pet'),
    category: { kind: 'item-class', value: 'pet' },
    functions: ['pet'],
  },
  {
    id: 'plush-dot',
    name: 'Plush Dot',
    itemClass: known('pet'),
    category: { kind: 'item-class', value: 'pet' },
    functions: ['pet'],
  },
  {
    id: 'clockwork-seed',
    name: 'Clockwork Seed',
    itemClass: known('pet'),
    category: { kind: 'item-class', value: 'pet' },
    functions: ['pet'],
  },
  {
    id: 'unresolved-token',
    itemClass: unknown(),
    category: { kind: 'unknown' },
  },
];

const threadTrial: FixtureQuest = {
  id: 'thread-trial',
  name: 'Thread Trial',
  startLevel: 8,
};
const lanternAssembly: FixtureQuest = {
  id: 'lantern-assembly',
  name: 'Lantern Assembly',
  startLevel: 12,
};

function item(
  options: Omit<FixtureItem, 'itemClass' | 'category'> & {
    readonly itemClass: ItemClass;
  },
): FixtureItem {
  const { itemClass, ...details } = options;
  return {
    ...details,
    itemClass: known(itemClass),
    category: { kind: 'item-class', value: itemClass },
  };
}

const cwItems: readonly FixtureItem[] = [
  ...cwBaseItems,
  // Not in cwBaseItems: those are also the Warden's drops in Monster fixtures.
  {
    id: 'zesty-tonic',
    name: 'Zesty Tonic',
    itemClass: known('consume'),
    category: { kind: 'item-class', value: 'consume' },
    types: ['potion'],
    functions: ['recovery'],
    recovery: { hp: 90 },
    buff: {
      durationSeconds: 600,
      effects: [{ stat: 'weaponAttack', unit: 'flat', value: 10 }],
    },
  },
  {
    id: 'brisk-tonic',
    name: 'Brisk Tonic',
    itemClass: known('consume'),
    category: { kind: 'item-class', value: 'consume' },
    types: ['potion'],
    functions: ['recovery'],
    recovery: { hp: 200 },
    buff: {
      durationSeconds: 300,
      effects: [{ stat: 'weaponAttack', unit: 'flat', value: 5 }],
    },
  },
  item({
    id: 'amber-seat',
    name: 'Amber Seat',
    itemClass: 'setup',
    types: ['chair'],
    seatingRecovery: { hp: 50 },
    questRewards: [lanternAssembly],
  }),
  item({
    id: 'blue-seat',
    name: 'Blue Seat',
    itemClass: 'setup',
    types: ['chair'],
    seatingRecovery: { mp: 40 },
  }),
  item({
    id: 'azure-seat',
    name: 'Azure Seat',
    itemClass: 'setup',
    types: ['chair'],
    seatingRecovery: { mp: 50 },
  }),
  item({
    id: 'green-seat',
    name: 'Green Seat',
    itemClass: 'setup',
    types: ['chair'],
    seatingRecovery: { hp: 50, mp: 50 },
  }),
  item({
    id: 'unnamed-sprout',
    itemClass: 'etc',
    types: ['monster-material'],
    sellPrice: known(0),
    sprite: 'unknown',
  }),
  item({
    id: 'flat-hp-salve',
    name: 'Flat HP Salve',
    itemClass: 'consume',
    types: ['potion'],
    functions: ['recovery'],
    recovery: { hp: 420 },
    sprite: 'exact',
  }),
  item({
    id: 'flat-mp-salve',
    name: 'Flat MP Salve',
    itemClass: 'consume',
    types: ['potion'],
    functions: ['recovery'],
    recovery: { mp: 260 },
  }),
  item({
    id: 'dual-recovery-draught',
    name: 'Dual Recovery Draught',
    itemClass: 'consume',
    types: ['potion'],
    functions: ['recovery'],
    recovery: { hp: 80, mp: 40 },
  }),
  item({
    id: 'percentage-recovery-tonic',
    name: 'Percentage Recovery Tonic',
    itemClass: 'consume',
    types: ['potion'],
    functions: ['recovery'],
    recovery: { hpPercent: 35, mpPercent: 20 },
  }),
  item({
    id: 'no-effect-potion',
    name: 'Quiet Potion',
    itemClass: 'consume',
    types: ['potion'],
  }),
  item({
    id: 'practice-stars',
    name: 'Practice Stars',
    itemClass: 'consume',
    types: ['throwing-star'],
    projectileAttack: known(27),
    maxStack: 800,
    sprite: 'tall',
  }),
  item({
    id: 'training-stars',
    name: 'Training Stars',
    itemClass: 'consume',
    types: ['throwing-star'],
    projectileAttack: known(15),
    maxStack: 500,
    sprite: 'small',
  }),
  item({
    id: 'silent-arrow',
    name: 'Silent Arrow',
    itemClass: 'consume',
    types: ['arrow'],
    projectileAttack: unknown(),
    maxStack: 2000,
  }),
  item({
    id: 'pet-food-pouch',
    name: 'Pet Food Pouch',
    itemClass: 'consume',
    types: ['pet-food'],
  }),
  item({
    id: 'plain-use-item',
    name: 'Plain Use Item',
    itemClass: 'consume',
    description: 'An invented item with a short published description.',
    sellPrice: known(10),
  }),
  item({
    id: 'calling-sack',
    name: 'Calling Sack',
    itemClass: 'consume',
    functions: ['summon'],
    description: 'A small sack that calls one invented practice creature.',
  }),
  item({
    id: 'sprout-box',
    name: 'Sprout Box',
    itemClass: 'consume',
    functions: ['reward-container'],
  }),
  item({
    id: 'twin-sprout-card',
    name: 'Twin Sprout Card',
    itemClass: 'consume',
    functions: ['monster-card'],
  }),
  item({
    id: 'lantern-skill-book',
    name: 'Lantern Skill Book',
    itemClass: 'consume',
    functions: ['skill'],
    types: ['potion'],
    recovery: { hp: 1 },
  }),
  item({
    id: 'plain-skill-book',
    name: 'Plain Practice Skill Book',
    itemClass: 'consume',
    functions: ['skill'],
  }),
  item({
    id: 'return-scroll',
    name: 'Grove Return Scroll',
    itemClass: 'consume',
    types: ['return-scroll'],
  }),
  ...(['lesser', 'intermediate', 'greater', 'chaos'] as const).map(
    (tier): FixtureItem =>
      item({
        id: `practice-sword-scroll-${tier}`,
        name: `${tier[0]?.toUpperCase()}${tier.slice(1)} Practice Sword Scroll`,
        itemClass: 'consume',
        types: ['upgrade-scroll'],
        functions: ['upgrade'],
        family: 'practice-sword-scrolls',
        scroll: {
          targetLabel: 'one-handed-sword',
          tier,
          success: tier === 'chaos' ? 50 : 80,
          ...(tier === 'greater' ? { cursed: 10 } : {}),
          deltas: { weaponAttack: tier === 'chaos' ? 5 : 2 },
          ...(tier === 'lesser' ? { specials: ['warm-support'] } : {}),
        },
        sprite: 'small',
      }),
  ),
  ...(['lesser', 'greater'] as const).map((tier): FixtureItem =>
    item({
      id: `practice-shield-scroll-${tier}`,
      name: `${tier[0]?.toUpperCase()}${tier.slice(1)} Practice Shield Scroll`,
      itemClass: 'consume',
      types: ['upgrade-scroll'],
      functions: ['upgrade'],
      family: 'practice-shield-scrolls',
      scroll: {
        targetLabel: 'shield',
        tier,
        success: 70,
        deltas: { weaponDefense: 2, magicDefense: 3 },
      },
    }),
  ),
  item({
    id: 'unknown-target-scroll',
    name: 'Unsorted Practice Scroll',
    itemClass: 'consume',
    types: ['upgrade-scroll'],
    functions: ['upgrade'],
    scroll: { success: 60, deltas: { speed: 1 } },
    sprite: 'exact',
  }),
  item({
    id: 'meso-pouch',
    name: 'Pebble Meso Pouch',
    itemClass: 'consume',
    types: ['food-buff', 'meso-pouch'],
  }),
  item({
    id: 'plain-meso-pouch',
    name: 'Plain Pebble Pouch',
    itemClass: 'consume',
    types: ['meso-pouch'],
  }),
  item({
    id: 'turn-in-stamp',
    name: 'Turn-in Stamp',
    itemClass: 'etc',
    types: ['monster-material'],
    questFlag: true,
    questUses: [
      {
        quest: threadTrial,
        roles: [{ role: 'turned-in', amount: 3 }],
      },
    ],
    questRewards: [lanternAssembly],
    sellPrice: known(1),
  }),
  item({
    id: 'many-quest-token',
    name: 'Many Quest Token',
    itemClass: 'etc',
    questFlag: true,
    questUses: [
      {
        quest: threadTrial,
        roles: [{ role: 'held-to-complete', amount: 2 }],
      },
      {
        quest: lanternAssembly,
        roles: [{ role: 'held-to-start' }],
      },
    ],
  }),
  item({
    id: 'multi-role-relic',
    name: 'Multi-role Relic',
    itemClass: 'etc',
    questFlag: true,
    questUses: [
      {
        quest: threadTrial,
        roles: [
          { role: 'turned-in', amount: 1 },
          { role: 'held-to-complete', amount: 1 },
          { role: 'not-established' },
        ],
      },
    ],
  }),
  item({
    id: 'must-not-hold-token',
    name: 'Must Not Hold Token',
    itemClass: 'etc',
    questUses: [
      { quest: lanternAssembly, roles: [{ role: 'must-not-be-held' }] },
    ],
  }),
  item({
    id: 'pet-role-biscuit',
    name: 'Pet Role Biscuit',
    itemClass: 'etc',
    questUses: [{ quest: threadTrial, roles: [{ role: 'pet' }] }],
  }),
  item({
    id: 'card-role-token',
    name: 'Card Role Token',
    itemClass: 'etc',
    questUses: [{ quest: lanternAssembly, roles: [{ role: 'monster-card' }] }],
  }),
  item({
    id: 'given-and-taken',
    name: 'Given And Taken Sprout',
    itemClass: 'etc',
    types: ['monster-material'],
    questFlag: true,
    questUses: [
      { quest: threadTrial, roles: [{ role: 'turned-in', amount: 2 }] },
    ],
    questRewards: [threadTrial],
  }),
  item({
    id: 'only-taken',
    name: 'Only Taken Sprout',
    itemClass: 'etc',
    types: ['monster-material'],
    questFlag: true,
    questUses: [
      {
        quest: lanternAssembly,
        roles: [{ role: 'held-to-complete', amount: 5 }],
      },
    ],
  }),
  item({
    id: 'only-given',
    name: 'Only Given Pebble',
    itemClass: 'etc',
    questRewards: [lanternAssembly],
  }),
  item({
    id: 'ore-chip',
    name: 'Lamplight Ore',
    itemClass: 'etc',
    types: ['ore'],
  }),
  item({
    id: 'refined-bloom',
    name: 'Refined Bloom',
    itemClass: 'etc',
    types: ['refined-material'],
  }),
  item({
    id: 'other-etc',
    name: 'Quiet Gallery Note',
    itemClass: 'etc',
    questFlag: true,
    sprite: 'small',
  }),
  item({
    id: 'plain-pet-food',
    name: 'Plain Pet Food',
    itemClass: 'pet',
    types: ['pet-food'],
    functions: ['pet'],
  }),
  item({
    id: 'other-setup',
    name: 'Practice Place Marker',
    itemClass: 'setup',
  }),
  item({
    id: 'uncategorized-cash',
    name: 'Unlisted Cash Pin',
    itemClass: 'cash',
    cashShopSale: { state: 'not-on-sale' },
  }),
  ...Array.from({ length: 51 }, (_, index) =>
    item({
      id: `pebble-shard-${String(index + 1).padStart(2, '0')}`,
      name: `Pebble Shard ${String(index + 1).padStart(2, '0')}`,
      itemClass: 'etc',
      types: ['monster-material'],
      sellPrice: known(index),
      sprite: (['exact', 'small', 'large', 'wide', 'tall'] as const)[
        index % 5
      ]!,
    }),
  ),
];

const cwRecipes: readonly FixtureRecipe[] = [
  {
    id: 'woven-kite',
    name: 'Woven Kite Recipe',
    fee: known(0),
    ingredients: [
      { itemId: 'woven-thread', amount: 2 },
      { itemId: 'sample-charm-a', amount: 1 },
    ],
    products: [
      { itemId: 'paper-kite', name: 'Paper Kite', outcome: 'guaranteed' },
    ],
  },
  {
    id: 'sprout-meal',
    name: 'Sprout Meal Recipe',
    fee: known(5),
    ingredients: [
      { itemId: 'sample-charm-a', amount: 1 },
      { itemId: 'training-snack', amount: 1 },
    ],
    products: [{ name: 'Warm Sprout Meal', outcome: 'guaranteed' }],
  },
];

const cwContainers: readonly FixtureContainer[] = [
  {
    id: 'seeded-crate',
    name: 'Seeded Crate',
    itemIds: ['calling-sack', 'sprout-box', 'twin-sprout-card'],
  },
];

const cwCashShopListings: readonly FixtureCashShopListing[] = [
  {
    id: 'spring-window',
    name: 'Spring Window',
    itemIds: ['pixel-pin', 'star-badge'],
  },
  {
    id: 'autumn-window',
    name: 'Autumn Window',
    itemIds: ['uncategorized-cash'],
  },
];

const cwItemBrowseCoverage: ItemBrowseCoverage = {
  scrollTier: 'complete',
  relationships: {
    'cash-shop-listing': 'complete',
    'found-in-container': 'complete',
    'made-by-recipe': 'complete',
    'monster-drop': 'complete',
    'needed-for-quest': 'complete',
    'quest-reward': 'complete',
    'used-in-recipe': 'complete',
  },
  playerFacts: {
    buff: 'complete',
    flatRecovery: 'complete',
    levelRange: 'complete',
    maxStack: 'complete',
    percentRecovery: 'complete',
    requirementJobs: 'complete',
    requirementLevel: 'complete',
    sellPrice: 'partial',
  },
};

const gmsItems: readonly FixtureItem[] = [
  item({
    id: 'native-flake',
    name: 'Native Flake',
    itemClass: 'etc',
    types: ['monster-material'],
    questFlag: true,
    sprite: 'exact',
  }),
  item({
    id: 'native-bloom',
    name: 'Native Bloom',
    itemClass: 'consume',
    types: ['potion'],
    functions: ['recovery'],
    recovery: { hp: 100 },
    sprite: 'small',
  }),
  item({
    id: 'gms-unnamed',
    itemClass: 'etc',
    sprite: 'unknown',
  }),
  item({
    id: 'gms-scroll',
    name: 'Grove Return Scroll',
    itemClass: 'consume',
    types: ['return-scroll'],
  }),
  item({
    id: 'gms-upgrade-scroll-a',
    name: 'GMS Practice Hat Scroll',
    itemClass: 'consume',
    types: ['upgrade-scroll'],
    functions: ['upgrade'],
    scroll: {
      targetLabel: 'hat',
      success: 80,
      deltas: { dexterity: 1 },
    },
  }),
  item({
    id: 'gms-upgrade-scroll-b',
    name: 'GMS Unnamed Target Scroll',
    itemClass: 'consume',
    types: ['upgrade-scroll'],
    functions: ['upgrade'],
    scroll: { success: 60, deltas: { speed: 1 } },
  }),
  item({
    id: 'gms-buff',
    name: 'GMS Lamplight Snack',
    itemClass: 'consume',
    types: ['food-buff'],
    buff: {
      durationSeconds: 300,
      effects: [{ stat: 'speed', unit: 'flat', value: 2 }],
    },
  }),
  item({
    id: 'gms-star',
    name: 'GMS Practice Star',
    itemClass: 'consume',
    types: ['throwing-star'],
    projectileAttack: known(5),
    maxStack: 500,
  }),
  item({
    id: 'gms-arrow',
    name: 'GMS Practice Arrow',
    itemClass: 'consume',
    types: ['arrow'],
    maxStack: 1000,
  }),
  item({
    id: 'gms-bullet',
    name: 'GMS Practice Bullet',
    itemClass: 'consume',
    types: ['bullet'],
    projectileAttack: known(10),
    maxStack: 600,
  }),
  item({
    id: 'gms-pet-food',
    name: 'GMS Pet Food',
    itemClass: 'consume',
    types: ['pet-food'],
  }),
  item({
    id: 'gms-sack',
    name: 'GMS Sprout Sack',
    itemClass: 'consume',
    functions: ['summon'],
  }),
  item({
    id: 'gms-box',
    name: 'GMS Quiet Box',
    itemClass: 'consume',
    functions: ['reward-container'],
  }),
  item({
    id: 'gms-card',
    name: 'GMS Native Alpha Card',
    itemClass: 'consume',
    functions: ['monster-card'],
    buff: {
      durationSeconds: 1800,
      effects: [{ stat: 'weaponAttack', unit: 'flat', value: 5 }],
    },
    sprite: 'exact',
  }),
  item({
    id: 'gms-beta-card',
    name: 'GMS Native Beta Card',
    itemClass: 'consume',
    functions: ['monster-card'],
    buff: {
      durationSeconds: 1800,
      effects: [{ stat: 'maxHp', unit: 'flat', value: 100 }],
    },
    sprite: 'small',
  }),
  item({
    id: 'gms-skill-book',
    name: 'GMS Skill Book',
    itemClass: 'consume',
    functions: ['skill'],
  }),
  item({
    id: 'gms-other-use',
    name: 'GMS Other Use',
    itemClass: 'consume',
    description: 'A short note in an invented second-build inventory.',
  }),
  item({
    id: 'gms-meso-pouch',
    name: 'GMS Pebble Pouch',
    itemClass: 'consume',
    types: ['meso-pouch'],
  }),
  item({
    id: 'gms-ore',
    name: 'GMS Lamplight Ore',
    itemClass: 'etc',
    types: ['ore'],
  }),
  item({
    id: 'gms-gem',
    name: 'GMS Soft Gem',
    itemClass: 'etc',
    types: ['gem'],
  }),
  item({
    id: 'gms-refined',
    name: 'GMS Refined Thread',
    itemClass: 'etc',
    types: ['refined-material'],
  }),
  item({
    id: 'gms-monster-material',
    name: 'GMS Monster Material',
    itemClass: 'etc',
    types: ['monster-material'],
  }),
  item({
    id: 'gms-quest-item',
    name: 'GMS Quest Note',
    itemClass: 'etc',
    questFlag: true,
  }),
  item({
    id: 'gms-other-etc',
    name: 'GMS Other ETC',
    itemClass: 'etc',
  }),
  item({
    id: 'gms-chair',
    name: 'GMS Practice Seat',
    itemClass: 'setup',
    types: ['chair'],
  }),
  item({
    id: 'gms-ornament',
    name: 'GMS Paper Ornament',
    itemClass: 'setup',
    types: ['holiday-ornament'],
  }),
  item({
    id: 'gms-furniture',
    name: 'GMS Practice Shelf',
    itemClass: 'setup',
    types: ['furniture'],
  }),
  item({
    id: 'gms-station',
    name: 'GMS Thread Station',
    itemClass: 'setup',
    types: ['crafting-station'],
  }),
  item({
    id: 'gms-other-setup',
    name: 'GMS Paper Marker',
    itemClass: 'setup',
  }),
  item({
    id: 'gms-cash',
    name: 'GMS Cash Badge',
    itemClass: 'cash',
    cashShopSale: { state: 'not-on-sale' },
  }),
  item({
    id: 'gms-pet',
    name: 'GMS Paper Mite',
    itemClass: 'pet',
    functions: ['pet'],
  }),
];

// This fixture deliberately breaks cross-product consistency to cover the unsupported Items roster; nothing reads both.
const gmsItemBrowseCoverage: ItemBrowseCoverage = {
  scrollTier: 'unsupported',
  relationships: {
    'cash-shop-listing': 'partial',
    'found-in-container': 'complete',
    'made-by-recipe': 'complete',
    'monster-drop': 'unsupported',
    'needed-for-quest': 'complete',
    'quest-reward': 'complete',
    'used-in-recipe': 'partial',
  },
  playerFacts: {
    buff: 'complete',
    flatRecovery: 'complete',
    levelRange: 'complete',
    maxStack: 'complete',
    percentRecovery: 'complete',
    requirementJobs: 'complete',
    requirementLevel: 'complete',
    sellPrice: 'partial',
  },
};

const gmsRecipes: readonly FixtureRecipe[] = [];
const gmsContainers: readonly FixtureContainer[] = [];
const gmsCashShopListings: readonly FixtureCashShopListing[] = [];

const wardenItemIds = cwBaseItems
  .map(({ id }) => id)
  .filter(
    (id) =>
      id !== 'pebble-token' && id !== 'quiet-bell' && id !== 'long-named-drop',
  );
const historical = (itemId: string): FixtureDrop => ({
  itemId,
  evidence: [{ kind: 'historical-overlay', build: 'gms-v83' }],
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
      regionKey: 'region:lantern-hills',
      regionLabel: 'Lantern Hills',
    },
    stage: { assetId: 'practice-grove', width: 900, height: 600 },
    monsters: [
      {
        monsterId: 'plain-pebble',
        points: [{ x: 240, y: 390 }],
        respawn: { kind: 'none' },
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
        respawn: { kind: 'mixed' },
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

/** Synthetic area for Map Browse location fixtures. */
const LAMPLIGHT = {
  regionKey: 'region:lantern-hills',
  regionLabel: 'Lantern Hills',
  areaKey: 'area:lantern-hills/lamplight',
  areaLabel: 'Lamplight',
} as const;

export const fixtureMaps: readonly FixtureMap[] = [
  {
    id: townMapId,
    name: 'Lantern Square',
    streetName: 'Lantern Hills',
    activity: 'Market',
    description: 'A gathering place beneath paper lanterns.',
    player: { town: true, timeLimitSeconds: 600 },
    information: {
      music: { state: 'known', value: 'Lantern Waltz' },
      timeLimitSeconds: { state: 'known', value: 600 },
      swimming: { state: 'known', value: true },
      flying: { state: 'known', value: false },
    },
    geography: {
      regionKey: 'region:lantern-hills',
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
      ...(id === 'bellkeeper' || id === 'storyteller'
        ? { sprite: 'exact' as const }
        : {}),
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
      regionKey: 'region:lantern-hills',
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
        respawn: { kind: 'delayed', seconds: 180 },
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
  ...(
    [
      {
        id: 'lamplight-meadow',
        name: 'Lamplight Meadow',
        streetName: 'Lantern Hills',
        geography: LAMPLIGHT,
        stage: { assetId: 'lamplight-meadow', width: 900, height: 600 },
        monsters: [
          {
            monsterId: 'twin-sprout-b',
            points: [
              { x: 200, y: 390 },
              { x: 420, y: 390 },
            ],
          },
          { monsterId: 'long-named-fixture', points: [{ x: 640, y: 390 }] },
        ],
        npcs: [
          {
            id: 'meadow-keeper',
            name: 'Meadow Keeper',
            points: [{ x: 120, y: 390 }],
          },
        ],
      },
      {
        id: 'lantern-rehearsal',
        name: 'Lantern Rehearsal <Stage 1>',
        streetName: 'Back Lane',
        activity: 'Lantern Relay',
        placement: { classification: 'party-quest' },
        geography: LAMPLIGHT,
        stage: { assetId: 'lantern-rehearsal', width: 900, height: 600 },
        monsters: [
          {
            monsterId: 'wide-banner',
            points: [
              { x: 300, y: 390 },
              { x: 500, y: 390 },
              { x: 700, y: 390 },
            ],
          },
        ],
        npcs: [],
      },
      {
        id: 'lamplight-hall',
        streetName: 'Lamplight Hall',
        geography: LAMPLIGHT,
        stage: { assetId: 'lamplight-hall', width: 900, height: 600 },
        monsters: [],
        npcs: [],
      },
      {
        id: 'festival-booth',
        name: 'Festival Booth',
        streetName: 'Festival Grounds',
        geography: {
          collectionKey: 'collection:event',
          collectionLabel: 'Event maps',
        },
        stage: { assetId: 'festival-booth', width: 900, height: 600 },
        monsters: [],
        npcs: [
          {
            id: 'festival-host',
            name: 'Festival Host',
            points: [{ x: 450, y: 390 }],
          },
        ],
      },
    ] satisfies readonly Omit<FixtureMap, 'connections' | 'returnMapId'>[]
  ).map((map): FixtureMap => ({
    ...map,
    connections: [{ mapId: townMapId, points: [{ x: 430, y: 270 }] }],
    returnMapId: townMapId,
  })),
];

export const world: { readonly builds: readonly FixtureBuild[] } = {
  builds: [
    {
      familyId: 'classic-world',
      buildId: 'cw-launch',
      historicalDrops: 'supported',
      monsters: cwMonsters,
      items: cwItems,
      itemBrowseCoverage: cwItemBrowseCoverage,
      recipes: cwRecipes,
      containers: cwContainers,
      cashShopListings: cwCashShopListings,
      maps: fixtureMaps,
      drops: {
        ...Object.fromEntries(
          cwMonsters
            .filter(({ id }) => id.startsWith('filler-'))
            .slice(0, 7)
            .map(({ id }) => [id, [historical('pebble-shard-01')]]),
        ),
        'plain-pebble': [historical('pebble-token')],
        'crowned-warden': wardenItemIds.map(historical),
        'crowned-revenant': [
          {
            itemId: 'practice-tonic-a',
            evidence: [
              { kind: 'historical-overlay', build: 'gms-v83' },
              { kind: 'vod', build: 'cw-launch', date: '2026-02-01' },
            ],
          },
          historical('sample-charm-a'),
          historical('long-named-drop'),
          historical('given-and-taken'),
          historical('only-taken'),
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
          locations: [
            {
              mapKey: 'fixture:map:01',
              name: 'Practice Map 01',
              streetName: 'Western Practice Grounds',
              placementCount: 3,
            },
          ],
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
          locationsState: 'unresolved',
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
          locationsState: 'unresolved',
          locations: [
            {
              mapKey: 'fixture:map:02',
              placementCount: 2,
            },
            ...['03', '04', '05'].map((number) => ({
              mapKey: `fixture:map:${number}`,
              name: `Practice Map ${number}`,
              streetName: 'Western Practice Grounds',
              placementCount: number === '05' ? 3 : 1,
            })),
          ],
          sprite: 'exact',
        },
      ],
      items: gmsItems,
      itemBrowseCoverage: gmsItemBrowseCoverage,
      recipes: gmsRecipes,
      containers: gmsContainers,
      cashShopListings: gmsCashShopListings,
      maps: fixtureMaps.map((map): FixtureMap => {
        const alternate = { ...map, monsters: [] };
        if (map.id === 'lantern-rehearsal') {
          return {
            ...alternate,
            noMark: true,
            player: { entryLevel: 30, levelCap: 50, partyOnly: true },
          };
        }
        if (map.id === 'lamplight-meadow') {
          return {
            ...alternate,
            player: {
              entryLevel: 15,
              levelCap: 25,
              underwater: true,
              hpDrain: {
                amount: 25,
                protectionItem: {
                  key: 'fixture:float-ring',
                  name: 'Float Ring',
                },
              },
            },
          };
        }
        return alternate;
      }),
      drops: {
        'native-alpha': [
          {
            itemId: 'native-flake',
            evidence: [{ kind: 'native', build: 'gms-v83' }],
          },
          {
            itemId: 'native-bloom',
            evidence: [
              {
                kind: 'vod',
                build: 'gms-v83',
                date: '2026-01-15',
                url: 'https://video.example/watch?v=fixture',
                startSeconds: 95,
              },
              { kind: 'screenshot', build: 'gms-v83' },
            ],
          },
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
