/**
 * Facet configurations and context mappings for Items Browse.
 *
 * Declarative tables defining available categorical and range facets
 * and the facet sets active in each category context.
 */
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import {
  ITEM_FUNCTION_LABELS,
  ITEM_TYPE_LABELS,
  SCROLL_STAT_LABELS,
  SCROLL_STAT_ORDER,
  UPGRADE_SPECIAL_LABELS,
  UPGRADE_TARGET_LABELS,
  UPGRADE_TIER_LABELS,
  type ItemRelationshipKind,
} from './labels';
import { RELATIONSHIP_COUNT_FIELDS, type ItemRow } from './project';

export function getItemRelationships(
  row: ItemRow,
): readonly ItemRelationshipKind[] {
  return RELATIONSHIP_COUNT_FIELDS.filter(
    ([, key]) => typeof row[key] === 'number' && row[key] > 0,
  ).map(([kind]) => kind);
}

export interface CategoricalContext {
  readonly coverage: ItemBrowseCoverage;
  readonly petLabels: ReadonlyMap<string, string>;
}

export interface CategoricalFacetConfig {
  readonly field: string;
  readonly label: string;
  readonly values: (row: ItemRow) => readonly string[];
  readonly optionLabel:
    | Readonly<Record<string, string>>
    | ((value: string, ctx: CategoricalContext) => string | undefined);
  readonly optionValues?: readonly string[] | undefined;
  readonly groups?: Readonly<Record<string, string>> | undefined;
  readonly sortOrder?:
    readonly string[] | ((a: string, b: string) => number) | undefined;
  readonly quick?: boolean | undefined;
}

export interface RangeFacetConfig {
  readonly field: string;
  readonly label: string;
  readonly getValue: (row: ItemRow) => number | undefined;
  readonly unit?: string | undefined;
  readonly valuePrefix?: string | undefined;
  readonly quick?: boolean | undefined;
}

export interface BooleanFacetConfig {
  readonly field: string;
  readonly label: string;
  readonly getValue: (row: ItemRow) => boolean | undefined;
  readonly quick?: boolean | undefined;
}

const QUEST_RELATIONSHIPS = [
  { kind: 'needed-for-quest', label: 'Required for a quest' },
  { kind: 'quest-reward', label: 'Quest reward' },
] as const satisfies readonly { kind: ItemRelationshipKind; label: string }[];

const CRAFTING_RELATIONSHIPS = [
  { kind: 'used-in-recipe', label: 'Used as an ingredient' },
  { kind: 'made-by-recipe', label: 'Made by recipe' },
] as const satisfies readonly { kind: ItemRelationshipKind; label: string }[];

const SOURCE_RELATIONSHIPS = [
  { kind: 'found-in-container', label: 'Found in a box' },
] as const satisfies readonly { kind: ItemRelationshipKind; label: string }[];

const CASH_SHOP_RELATIONSHIPS = [
  { kind: 'cash-shop-listing', label: 'Listed in the Cash Shop' },
] as const satisfies readonly { kind: ItemRelationshipKind; label: string }[];

function relationshipFacet({
  field,
  label,
  relationships,
}: {
  readonly field: string;
  readonly label: string;
  readonly relationships: readonly {
    readonly kind: ItemRelationshipKind;
    readonly label: string;
  }[];
}): CategoricalFacetConfig {
  const allowed = new Set(relationships.map(({ kind }) => kind));
  return {
    field,
    label,
    values: (row) =>
      getItemRelationships(row).filter((kind) => allowed.has(kind)),
    optionValues: relationships.map(({ kind }) => kind),
    optionLabel: (value, ctx) => {
      const relationship = relationships.find(({ kind }) => kind === value);
      if (!relationship) return undefined;
      const coverage = ctx.coverage.relationships[relationship.kind];
      if (coverage === 'unsupported') return undefined;
      return coverage === 'partial'
        ? `${relationship.label} (partial)`
        : relationship.label;
    },
  };
}

const SCROLL_TARGET_GROUPS = {
  Weapons: [
    'bow',
    'claw',
    'crossbow',
    'dagger',
    'gun',
    'knuckle',
    'one-handed-axe',
    'one-handed-blunt-weapon',
    'one-handed-sword',
    'polearm',
    'spear',
    'staff',
    'two-handed-axe',
    'two-handed-blunt-weapon',
    'two-handed-sword',
    'wand',
  ],
  Armor: ['bottomwear', 'gloves', 'hat', 'overall-armor', 'shoes', 'topwear'],
  Accessories: [
    'accessory',
    'belt',
    'earrings',
    'eye-accessory',
    'face-accessory',
    'ring',
  ],
  Cape: ['cape'],
  Shield: ['shield'],
  'Pet Equipment': ['pet-equipment'],
} as const;

const SCROLL_TARGET_GROUP_BY_VALUE = Object.fromEntries(
  Object.entries(SCROLL_TARGET_GROUPS).flatMap(([group, targets]) =>
    targets.map((target) => [target, group]),
  ),
);

const SCROLL_TARGET_ORDER = Object.values(SCROLL_TARGET_GROUPS).flat();

export const CATEGORICAL_FACETS: readonly CategoricalFacetConfig[] = [
  relationshipFacet({
    field: 'quests',
    label: 'Quests',
    relationships: QUEST_RELATIONSHIPS,
  }),
  relationshipFacet({
    field: 'crafting',
    label: 'Crafting',
    relationships: CRAFTING_RELATIONSHIPS,
  }),
  relationshipFacet({
    field: 'sources',
    label: 'Sources',
    relationships: SOURCE_RELATIONSHIPS,
  }),
  relationshipFacet({
    field: 'cashShop',
    label: 'Cash Shop',
    relationships: CASH_SHOP_RELATIONSHIPS,
  }),
  {
    field: 'recoveryRestores',
    label: 'Restores',
    values: (row) => {
      const restoresHp = (row.hp ?? 0) > 0 || (row.hpPercent ?? 0) > 0;
      const restoresMp = (row.mp ?? 0) > 0 || (row.mpPercent ?? 0) > 0;
      if (restoresHp && restoresMp) return ['hp-and-mp'];
      if (restoresHp) return ['hp-only'];
      if (restoresMp) return ['mp-only'];
      return [];
    },
    optionLabel: {
      'hp-only': 'HP only',
      'mp-only': 'MP only',
      'hp-and-mp': 'HP and MP',
    },
    quick: true,
  },
  {
    field: 'chairRestores',
    label: 'Restores',
    values: (row) => {
      const restoresHp = (row.seatHp ?? 0) > 0;
      const restoresMp = (row.seatMp ?? 0) > 0;
      if (restoresHp && restoresMp) return ['hp-and-mp'];
      if (restoresHp) return ['hp-only'];
      if (restoresMp) return ['mp-only'];
      return [];
    },
    optionLabel: {
      'hp-only': 'HP only',
      'mp-only': 'MP only',
      'hp-and-mp': 'HP and MP',
    },
    quick: true,
  },
  {
    field: 'types',
    label: 'Item type',
    values: (row) => row.types ?? [],
    optionLabel: ITEM_TYPE_LABELS,
    quick: true,
  },
  {
    field: 'functions',
    label: 'Effect',
    values: (row) =>
      row.functions ? row.functions.filter((fn) => fn !== 'pet') : [],
    optionLabel: ITEM_FUNCTION_LABELS,
  },
  {
    field: 'scrollTarget',
    label: 'Equipment type',
    values: (row) => (row.targetLabel ? [row.targetLabel] : []),
    optionLabel: UPGRADE_TARGET_LABELS,
    optionValues: SCROLL_TARGET_ORDER,
    groups: SCROLL_TARGET_GROUP_BY_VALUE,
    quick: true,
  },
  {
    field: 'scrollStat',
    label: 'Stats Improved',
    values: (row) => (row.stats ? Object.keys(row.stats) : []),
    optionLabel: SCROLL_STAT_LABELS,
    sortOrder: SCROLL_STAT_ORDER,
    quick: true,
  },
  {
    field: 'scrollSuccess',
    label: 'Success rate',
    values: (row) => (row.success !== undefined ? [String(row.success)] : []),
    optionLabel: (val) => `${val}%`,
    sortOrder: (a, b) => Number(a) - Number(b),
  },
  {
    field: 'scrollRisk',
    label: 'Destruction risk',
    values: (row) =>
      row.cursed === undefined ? ['none'] : [String(row.cursed)],
    optionLabel: (val) => (val === 'none' ? '-' : `${val}% on failure`),
    sortOrder: (a, b) => {
      if (a === 'none') return -1;
      if (b === 'none') return 1;
      return Number(a) - Number(b);
    },
  },
  {
    field: 'scrollTier',
    label: 'Tier',
    values: (row) => (row.tier ? [row.tier] : []),
    optionValues: Object.keys(UPGRADE_TIER_LABELS),
    optionLabel: (val, ctx) =>
      ctx.coverage.scrollTier === 'unsupported'
        ? undefined
        : UPGRADE_TIER_LABELS[val],
  },
  {
    field: 'scrollSpecial',
    label: 'Special',
    values: (row) => row.specials ?? [],
    optionLabel: UPGRADE_SPECIAL_LABELS,
  },
  {
    field: 'scrollDirect',
    label: 'Targets',
    values: (row) => (row.directTargetCount ? ['verified'] : []),
    optionLabel: () => 'Verified equipment targets',
  },
  {
    field: 'pet',
    label: 'Compatible pets',
    values: (row) => [
      ...(row.petTargets?.map((t) => t.key) ?? []),
      ...(row.unresolvedPetTargets?.map((id) => `unresolved:${id}`) ?? []),
    ],
    optionLabel: (val, ctx) =>
      val.startsWith('unresolved:')
        ? `Unresolved target ${val.slice(11)}`
        : (ctx.petLabels.get(val) ?? val),
    quick: true,
  },
  {
    field: 'kind',
    label: 'Kind',
    values: (row) =>
      row.itemClass === 'pet' || row.itemClass === 'cash'
        ? [row.itemClass]
        : [],
    optionLabel: { pet: 'Pet', cash: 'Cash Item' },
    quick: true,
  },
  {
    field: 'questFlag',
    label: 'Quest item',
    values: (row) => (row.questFlag ? ['quest-flagged'] : []),
    optionLabel: () => 'Marked as a quest item',
    quick: true,
  },
];

export const BOOLEAN_FACETS: readonly BooleanFacetConfig[] = [
  {
    field: 'noRecordedQuestOrRecipeUse',
    label: 'No recorded quest or recipe use',
    getValue: (row) =>
      [row.neededForQuestCount, row.usedInRecipeCount].every(
        (value) => value === undefined || value === 0,
      ),
  },
  {
    field: 'percentageRecovery',
    label: 'Percentage recovery',
    getValue: (row) =>
      row.hpPercent !== undefined || row.mpPercent !== undefined,
  },
];

export const RANGE_FACETS: readonly RangeFacetConfig[] = [
  {
    field: 'hp',
    label: 'HP Recovered',
    getValue: (r) => r.hp,
    quick: true,
  },
  {
    field: 'mp',
    label: 'MP Recovered',
    getValue: (r) => r.mp,
  },
  {
    field: 'hpPercent',
    label: 'HP Recovered %',
    getValue: (r) => r.hpPercent,
    unit: '%',
  },
  {
    field: 'mpPercent',
    label: 'MP Recovered %',
    getValue: (r) => r.mpPercent,
    unit: '%',
  },
  {
    field: 'attack',
    label: 'Attack',
    getValue: (r) => r.attack,
    valuePrefix: '+',
    quick: true,
  },
  {
    field: 'closeness',
    label: 'Closeness',
    getValue: (r) => r.closeness,
    quick: true,
  },
  { field: 'fullness', label: 'Fullness', getValue: (r) => r.fullness },
  { field: 'tameness', label: 'Tameness', getValue: (r) => r.tameness },
  {
    field: 'seatHp',
    label: 'HP Recovered / 10s',
    getValue: (r) => r.seatHp,
  },
  {
    field: 'seatMp',
    label: 'MP Recovered / 10s',
    getValue: (r) => r.seatMp,
  },
];

const SHARED_FACETS = ['quests', 'crafting', 'sources'] as const;
const PET_FEEDING_FIELDS = [
  'pet',
  'closeness',
  'fullness',
  'tameness',
] as const;

export const DEFAULT_FACETS = [...SHARED_FACETS, 'functions'] as const;

export const SCROLL_FACETS = [
  ...SHARED_FACETS,
  'scrollTarget',
  'scrollStat',
  'scrollSuccess',
  'scrollRisk',
  'scrollTier',
  'scrollSpecial',
  'scrollDirect',
] as const;

export const PET_FEEDING_FACETS = [
  ...PET_FEEDING_FIELDS,
  ...SHARED_FACETS,
] as const;

export const CONTEXT_FACETS: Readonly<Record<string, readonly string[]>> = {
  all: DEFAULT_FACETS,
  use: DEFAULT_FACETS,
  'use:recovery': [
    'recoveryRestores',
    'hp',
    'mp',
    'hpPercent',
    'mpPercent',
    'percentageRecovery',
    ...DEFAULT_FACETS,
  ],
  'use:upgrade-scrolls': SCROLL_FACETS,
  'use:throwing-stars': ['attack', ...DEFAULT_FACETS],
  'use:arrows': ['attack', ...DEFAULT_FACETS],
  'use:bullets': ['attack', ...DEFAULT_FACETS],
  'use:pet-food': PET_FEEDING_FACETS,
  etc: ['questFlag', 'noRecordedQuestOrRecipeUse', ...SHARED_FACETS],
  'etc:quest-items': ['questFlag', ...SHARED_FACETS],
  'etc:crafting': DEFAULT_FACETS,
  setup: ['seatHp', 'seatMp', ...SHARED_FACETS],
  'setup:chairs': ['chairRestores', 'seatHp', 'seatMp', ...SHARED_FACETS],
  cash: [...SHARED_FACETS, 'cashShop', ...PET_FEEDING_FIELDS],
  'cash:pets': SHARED_FACETS,
  'cash:cash-items': [...SHARED_FACETS, 'cashShop', ...PET_FEEDING_FIELDS],
};
