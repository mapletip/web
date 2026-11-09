/** Player-facing categorical facet values and labels. */
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import { SCROLL_STAT_LABELS, UPGRADE_TARGET_LABELS } from './labels';
import {
  RELATIONSHIP_COUNT_FIELDS,
  type ItemBrowseUpgradeTarget,
  type ItemRelationshipKind,
  type ItemRow,
} from './project';

export interface CategoricalContext {
  readonly coverage: ItemBrowseCoverage;
}

interface LabelContext {
  readonly context: CategoricalContext;
}

export interface CategoricalFacetConfig {
  readonly kind: 'multi-select';
  readonly label: string;
  readonly values: (row: ItemRow) => readonly string[];
  readonly labels?:
    | Readonly<Record<string, string>>
    | ((options: LabelContext) => Readonly<Record<string, string>>);
  readonly formatOption?: (options: { readonly value: string }) => string;
  readonly optionOrder?: readonly string[];
  readonly groups?: Readonly<Record<string, string>>;
  readonly quick?: boolean;
}

interface RelationshipFacetOption {
  readonly kind: ItemRelationshipKind;
  readonly label: string;
}

const QUEST_RELATIONSHIPS = [
  { kind: 'needed-for-quest', label: 'Required for a quest' },
  { kind: 'quest-reward', label: 'Quest reward' },
] as const satisfies readonly RelationshipFacetOption[];

const CRAFTING_RELATIONSHIPS = [
  { kind: 'used-in-recipe', label: 'Used as an ingredient' },
  { kind: 'made-by-recipe', label: 'Made by recipe' },
] as const satisfies readonly RelationshipFacetOption[];

const SOURCE_RELATIONSHIPS = [
  { kind: 'found-in-container', label: 'Found in a box' },
] as const satisfies readonly RelationshipFacetOption[];

const CASH_SHOP_RELATIONSHIPS = [
  { kind: 'cash-shop-listing', label: 'Listed in the Cash Shop' },
] as const satisfies readonly RelationshipFacetOption[];

function relationshipFacet({
  label,
  relationships,
}: {
  readonly label: string;
  readonly relationships: readonly RelationshipFacetOption[];
}): CategoricalFacetConfig {
  return {
    kind: 'multi-select',
    label,
    values: (row) =>
      relationships.flatMap(({ kind }) => {
        const field = RELATIONSHIP_COUNT_FIELDS.find(
          ([candidate]) => candidate === kind,
        )?.[1];
        if (field === undefined) return [];
        const count = row[field];
        return typeof count === 'number' && count > 0 ? [kind] : [];
      }),
    labels: ({ context }) =>
      Object.fromEntries(
        relationships.flatMap(({ kind, label: optionLabel }) => {
          const coverage = context.coverage.relationships[kind];
          if (coverage === 'unsupported') return [];
          const coveredLabel =
            coverage === 'partial' ? `${optionLabel} (partial)` : optionLabel;
          return [[kind, coveredLabel]];
        }),
      ),
  };
}

function positiveValue(value: number | undefined): boolean {
  return typeof value === 'number' && value > 0;
}

function restoresKinds({
  restoresHp,
  restoresMp,
}: {
  readonly restoresHp: boolean;
  readonly restoresMp: boolean;
}): readonly string[] {
  if (restoresHp && restoresMp) return ['hp-and-mp'];
  if (restoresHp) return ['hp-only'];
  if (restoresMp) return ['mp-only'];
  return [];
}

function recoveryKinds(row: ItemRow): readonly string[] {
  return restoresKinds({
    restoresHp: positiveValue(row.hp) || positiveValue(row.hpPercent),
    restoresMp: positiveValue(row.mp) || positiveValue(row.mpPercent),
  });
}

function chairRecoveryKinds(row: ItemRow): readonly string[] {
  return restoresKinds({
    restoresHp: positiveValue(row.seatHp),
    restoresMp: positiveValue(row.seatMp),
  });
}

const RESTORES_LABELS = {
  'hp-only': 'HP only',
  'mp-only': 'MP only',
  'hp-and-mp': 'HP and MP',
};

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
} as const satisfies Readonly<
  Record<string, readonly ItemBrowseUpgradeTarget[]>
>;

const SCROLL_TARGET_GROUP_BY_VALUE = Object.fromEntries(
  Object.entries(SCROLL_TARGET_GROUPS).flatMap(([group, targets]) =>
    targets.map((target) => [target, group]),
  ),
);

export const ITEM_CATEGORICAL_FACET_CONFIGS = {
  quests: relationshipFacet({
    label: 'Quests',
    relationships: QUEST_RELATIONSHIPS,
  }),
  crafting: relationshipFacet({
    label: 'Crafting',
    relationships: CRAFTING_RELATIONSHIPS,
  }),
  sources: relationshipFacet({
    label: 'Sources',
    relationships: SOURCE_RELATIONSHIPS,
  }),
  cashShop: relationshipFacet({
    label: 'Cash Shop',
    relationships: CASH_SHOP_RELATIONSHIPS,
  }),
  recoveryRestores: {
    kind: 'multi-select',
    label: 'Restores',
    values: recoveryKinds,
    labels: RESTORES_LABELS,
    quick: true,
  },
  chairRestores: {
    kind: 'multi-select',
    label: 'Restores',
    values: chairRecoveryKinds,
    labels: RESTORES_LABELS,
    quick: true,
  },
  scrollTarget: {
    kind: 'multi-select',
    label: 'Equipment slot',
    values: (row) => (row.targetLabel ? [row.targetLabel] : []),
    labels: UPGRADE_TARGET_LABELS,
    optionOrder: Object.values(SCROLL_TARGET_GROUPS).flat(),
    groups: SCROLL_TARGET_GROUP_BY_VALUE,
    quick: true,
  },
  scrollStat: {
    kind: 'multi-select',
    label: 'Stat improved',
    values: (row) => (row.stats ? Object.keys(row.stats) : []),
    labels: SCROLL_STAT_LABELS,
    quick: true,
  },
  scrollSuccess: {
    kind: 'multi-select',
    label: 'Success rate',
    values: (row) => (row.success !== undefined ? [String(row.success)] : []),
    formatOption: ({ value }) => `${value}%`,
  },
  scrollDestructionChance: {
    kind: 'multi-select',
    label: 'Destruction chance',
    values: (row) =>
      row.cursed === undefined ? ['no-listed-chance'] : [String(row.cursed)],
    formatOption: ({ value }) =>
      value === 'no-listed-chance'
        ? 'No listed chance'
        : `${value}% on failure`,
  },
} satisfies Record<string, CategoricalFacetConfig>;
