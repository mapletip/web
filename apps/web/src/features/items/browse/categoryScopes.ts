/**
 * Category scopes and children configuration for Items Browse.
 */
import type { ItemBrowseClass, ItemRow } from './project';

export type ItemScopeSlug = 'all' | 'use' | 'etc' | 'setup' | 'cash';

export interface ItemPositiveChild {
  readonly kind: 'positive';
  readonly slug: string;
  readonly label: string;
  readonly matches: (row: ItemRow) => boolean;
}

export interface ItemOtherChild {
  readonly kind: 'other';
  readonly slug: string;
  readonly label: string;
}

export type ItemCategoryChild = ItemPositiveChild | ItemOtherChild;

export interface ItemCategoryScope {
  readonly slug: ItemScopeSlug;
  readonly label: string;
  readonly itemClasses: readonly ItemBrowseClass[];
  readonly children: readonly ItemCategoryChild[];
}

export const ITEM_SCOPES: readonly ItemCategoryScope[] = [
  {
    slug: 'all',
    label: 'All Items',
    itemClasses: ['consume', 'etc', 'setup', 'cash', 'pet'],
    children: [],
  },
  {
    slug: 'use',
    label: 'Use',
    itemClasses: ['consume'],
    children: [
      {
        kind: 'positive',
        slug: 'upgrade-scrolls',
        label: 'Upgrade Scrolls',
        matches: (row) => (row.types ?? []).includes('upgrade-scroll'),
      },
      {
        kind: 'positive',
        slug: 'recovery',
        label: 'Recovery',
        matches: (row) => (row.functions ?? []).includes('recovery'),
      },
      {
        kind: 'positive',
        slug: 'throwing-stars',
        label: 'Throwing Stars',
        matches: (row) => (row.types ?? []).includes('throwing-star'),
      },
      {
        kind: 'positive',
        slug: 'arrows',
        label: 'Arrows',
        matches: (row) => (row.types ?? []).includes('arrow'),
      },
      {
        kind: 'positive',
        slug: 'bullets',
        label: 'Bullets',
        matches: (row) => (row.types ?? []).includes('bullet'),
      },
      {
        kind: 'positive',
        slug: 'pet-food',
        label: 'Pet Food',
        matches: (row) => (row.types ?? []).includes('pet-food'),
      },
      {
        kind: 'positive',
        slug: 'summoning-items',
        label: 'Summoning Items',
        matches: (row) => (row.functions ?? []).includes('summon'),
      },
      {
        kind: 'positive',
        slug: 'reward-containers',
        label: 'Reward Containers',
        matches: (row) => (row.functions ?? []).includes('reward-container'),
      },
      {
        kind: 'positive',
        slug: 'potions',
        label: 'Potions',
        matches: (row) => (row.types ?? []).includes('potion'),
      },
      {
        kind: 'positive',
        slug: 'food-buffs',
        label: 'Food & Buffs',
        matches: (row) => (row.types ?? []).includes('food-buff'),
      },
      {
        kind: 'positive',
        slug: 'monster-cards',
        label: 'Monster Cards',
        matches: (row) => (row.functions ?? []).includes('monster-card'),
      },
      {
        kind: 'positive',
        slug: 'skill-books',
        label: 'Skill & Mastery Books',
        matches: (row) => (row.functions ?? []).includes('skill'),
      },
      {
        kind: 'positive',
        slug: 'meso-pouches',
        label: 'Meso Pouches',
        matches: (row) => (row.types ?? []).includes('meso-pouch'),
      },
      {
        kind: 'other',
        slug: 'other-use-items',
        label: 'Other Use Items',
      },
    ],
  },
  {
    slug: 'etc',
    label: 'ETC',
    itemClasses: ['etc'],
    children: [
      {
        kind: 'positive',
        slug: 'quest-items',
        label: 'Quest Items',
        matches: (row) => (row.neededForQuestCount ?? 0) > 0,
      },
      {
        kind: 'positive',
        slug: 'crafting',
        label: 'Crafting',
        matches: (row) =>
          (row.usedInRecipeCount ?? 0) > 0 || (row.madeByRecipeCount ?? 0) > 0,
      },
      {
        kind: 'positive',
        slug: 'ores',
        label: 'Ores',
        matches: (row) => (row.types ?? []).includes('ore'),
      },
      {
        kind: 'positive',
        slug: 'gems',
        label: 'Gems & Jewels',
        matches: (row) => (row.types ?? []).includes('gem'),
      },
      {
        kind: 'positive',
        slug: 'refined-materials',
        label: 'Refined Materials',
        matches: (row) => (row.types ?? []).includes('refined-material'),
      },
      {
        kind: 'positive',
        slug: 'monster-materials',
        label: 'Monster Materials',
        matches: (row) => (row.types ?? []).includes('monster-material'),
      },
      {
        kind: 'other',
        slug: 'other-etc-items',
        label: 'Other ETC Items',
      },
    ],
  },
  {
    slug: 'setup',
    label: 'Set-up',
    itemClasses: ['setup'],
    children: [
      {
        kind: 'positive',
        slug: 'chairs',
        label: 'Chairs',
        matches: (row) => (row.types ?? []).includes('chair'),
      },
      {
        kind: 'positive',
        slug: 'holiday-ornaments',
        label: 'Holiday Ornaments',
        matches: (row) => (row.types ?? []).includes('holiday-ornament'),
      },
      {
        kind: 'positive',
        slug: 'furniture',
        label: 'Furniture',
        matches: (row) => (row.types ?? []).includes('furniture'),
      },
      {
        kind: 'positive',
        slug: 'crafting-stations',
        label: 'Crafting Stations',
        matches: (row) => (row.types ?? []).includes('crafting-station'),
      },
      {
        kind: 'other',
        slug: 'other-setup-items',
        label: 'Other Set-up Items',
      },
    ],
  },
  {
    slug: 'cash',
    label: 'Cash/Pet',
    itemClasses: ['cash', 'pet'],
    children: [
      {
        kind: 'positive',
        slug: 'pets',
        label: 'Pets',
        matches: (row) => row.itemClass === 'pet',
      },
      {
        kind: 'positive',
        slug: 'cash-items',
        label: 'Cash Items',
        matches: (row) => row.itemClass === 'cash',
      },
    ],
  },
];
