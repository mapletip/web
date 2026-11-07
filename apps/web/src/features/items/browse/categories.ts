/**
 * The single category registry for MapleStory Items Browse.
 *
 * Provides functions that return a category's population and per-category counts.
 *
 * Membership is always scope AND predicate.
 */
import type {
  ItemBrowseClass,
  ItemBrowseFunction,
  ItemBrowseType,
  ItemRow,
} from './project';

export const ITEM_SCOPE_SLUGS = ['all', 'use', 'etc', 'setup', 'cash'] as const;
export type ItemScopeSlug = (typeof ITEM_SCOPE_SLUGS)[number];

export interface ItemPositiveChild {
  readonly kind: 'positive';
  readonly slug: string;
  readonly label: string;
  readonly matches: (row: ItemRow) => boolean;
  readonly iconSourceIds?: readonly string[];
}

export interface ItemOtherChild {
  readonly kind: 'other';
  readonly slug: string;
  readonly label: string;
  readonly iconSourceIds?: readonly string[];
}

export type ItemCategoryChild = ItemPositiveChild | ItemOtherChild;

export interface ItemCategoryScope {
  readonly slug: ItemScopeSlug;
  readonly label: string;
  readonly itemClasses: readonly ItemBrowseClass[];
  readonly children: readonly ItemCategoryChild[];
}

const byType = (
  slug: string,
  label: string,
  type: ItemBrowseType,
  iconSourceIds?: readonly string[],
): ItemPositiveChild => ({
  kind: 'positive',
  slug,
  label,
  matches: (row) => row.types?.includes(type) ?? false,
  ...(iconSourceIds ? { iconSourceIds } : {}),
});

const byFunction = (
  slug: string,
  label: string,
  fn: ItemBrowseFunction,
  iconSourceIds?: readonly string[],
): ItemPositiveChild => ({
  kind: 'positive',
  slug,
  label,
  matches: (row) => row.functions?.includes(fn) ?? false,
  ...(iconSourceIds ? { iconSourceIds } : {}),
});

const otherChild = (
  slug: string,
  label: string,
  iconSourceIds?: readonly string[],
): ItemOtherChild => ({
  kind: 'other',
  slug,
  label,
  ...(iconSourceIds ? { iconSourceIds } : {}),
});

export const ITEM_SCOPES: Readonly<Record<ItemScopeSlug, ItemCategoryScope>> = {
  all: {
    slug: 'all',
    label: 'All Items',
    itemClasses: ['consume', 'etc', 'setup', 'cash', 'pet'],
    children: [],
  },
  use: {
    slug: 'use',
    label: 'Use',
    itemClasses: ['consume'],
    children: [
      byType('upgrade-scrolls', 'Upgrade Scrolls', 'upgrade-scroll', [
        '02040000',
        '02040001',
      ]),
      byFunction('recovery', 'Recovery', 'recovery', [
        '02000000',
        '02000002',
        '02000001',
      ]),
      byType('throwing-stars', 'Throwing Stars', 'throwing-star', [
        '02070000',
        '02070006',
        '02070005',
      ]),
      byType('arrows', 'Arrows', 'arrow', ['02060000', '02061000', '02060001']),
      byType('bullets', 'Bullets', 'bullet', [
        '02330000',
        '02330001',
        '02330002',
      ]),
      byType('pet-food', 'Pet Food', 'pet-food', ['02120000']),
      byFunction('summoning-items', 'Summoning Items', 'summon', [
        '02100000',
        '02100007',
      ]),
      byFunction('reward-containers', 'Reward Containers', 'reward-container', [
        '02022428',
        '02022336',
      ]),
      byType('potions', 'Potions', 'potion', [
        '02000003',
        '02000001',
        '02000006',
      ]),
      byType('food-buffs', 'Food & Buffs', 'food-buff', [
        '02022002',
        '02012000',
        '02020006',
      ]),
      byFunction('monster-cards', 'Monster Cards', 'monster-card', [
        '02380001',
        '02380007',
        '02380005',
      ]),
      byFunction('skill-items', 'Skill Items', 'skill', [
        '02290053',
        '02290084',
        '02280010',
      ]),
      byType('meso-pouches', 'Meso Pouches', 'meso-pouch', [
        '02028000',
        '02028001',
      ]),
      otherChild('other-use-items', 'Other Use Items', [
        '02030000',
        '02030004',
      ]),
    ],
  },
  etc: {
    slug: 'etc',
    label: 'ETC',
    itemClasses: ['etc'],
    children: [
      {
        kind: 'positive',
        slug: 'quest-items',
        label: 'Quest Items',
        matches: (row) => (row.neededForQuestCount ?? 0) > 0,
        iconSourceIds: ['04031039', '04031040', '04031041'],
      },
      {
        kind: 'positive',
        slug: 'crafting',
        label: 'Crafting',
        matches: (row) =>
          (row.usedInRecipeCount ?? 0) > 0 || (row.madeByRecipeCount ?? 0) > 0,
        iconSourceIds: ['04020000', '04020007'],
      },
      byType('ores', 'Ores', 'ore', ['04010006', '04010001', '04010000']),
      byType('gems', 'Gems & Jewels', 'gem', ['04020107', '04021007']),
      byType('refined-materials', 'Refined Materials', 'refined-material', [
        '04010101',
        '04011001',
      ]),
      byType('monster-materials', 'Monster Materials', 'monster-material', [
        '04000009',
      ]),
      otherChild('other-etc-items', 'Other ETC Items'),
    ],
  },
  setup: {
    slug: 'setup',
    label: 'Set-up',
    itemClasses: ['setup'],
    children: [
      byType('chairs', 'Chairs', 'chair', ['03010000', '03010008', '03010007']),
      byType('holiday-ornaments', 'Holiday Ornaments', 'holiday-ornament', [
        '03992024',
        '03992021',
        '03992026',
      ]),
      byType('furniture', 'Furniture', 'furniture', ['03000005', '03000006']),
      byType('crafting-stations', 'Crafting Stations', 'crafting-station', [
        '03030000',
        '03030001',
      ]),
      otherChild('other-setup-items', 'Other Set-up Items'),
    ],
  },
  cash: {
    slug: 'cash',
    label: 'Cash/Pet',
    itemClasses: ['cash', 'pet'],
    children: [
      {
        kind: 'positive',
        slug: 'pets',
        label: 'Pets',
        matches: (row) => row.itemClass === 'pet',
        iconSourceIds: ['5000000', '5000001', '5000002'],
      },
      {
        kind: 'positive',
        slug: 'cash-items',
        label: 'Cash Items',
        matches: (row) => row.itemClass === 'cash',
        iconSourceIds: ['05120002', '05010000', '05010002'],
      },
    ],
  },
};

export function isItemScope(slug: string): slug is ItemScopeSlug {
  return Object.hasOwn(ITEM_SCOPES, slug);
}

/**
 * Single predicate determining whether an item row belongs to a scope and optional child.
 *
 * Membership is always scope AND child predicate.
 * When child is an 'other' child, matches only if the row belongs to the scope
 * and matches NONE of the scope's positive children.
 */
export function matchesCategory(
  row: ItemRow,
  scope: ItemCategoryScope,
  child?: ItemCategoryChild,
): boolean {
  if (!scope.itemClasses.includes(row.itemClass)) {
    return false;
  }
  if (!child) {
    return true;
  }
  if (child.kind === 'positive') {
    return child.matches(row);
  }
  return !scope.children.some((c) => c.kind === 'positive' && c.matches(row));
}

export function getCategoryRows(
  rows: readonly ItemRow[],
  scope: ItemCategoryScope,
  child?: ItemCategoryChild,
): readonly ItemRow[] {
  return rows.filter((row) => matchesCategory(row, scope, child));
}

export interface ScopeCountSummary {
  readonly total: number;
  readonly children: Readonly<Record<string, number>>;
}

export type CategoryCounts = Readonly<Record<ItemScopeSlug, ScopeCountSummary>>;

function computeScopeCounts(
  rows: readonly ItemRow[],
  scope: ItemCategoryScope,
): ScopeCountSummary {
  const scopeRows = rows.filter((row) => matchesCategory(row, scope));
  const childCounts: Record<string, number> = {};
  for (const child of scope.children) {
    childCounts[child.slug] = scopeRows.filter((row) =>
      matchesCategory(row, scope, child),
    ).length;
  }
  return {
    total: scopeRows.length,
    children: childCounts,
  };
}

export function getCategoryCounts(rows: readonly ItemRow[]): CategoryCounts {
  return {
    all: computeScopeCounts(rows, ITEM_SCOPES.all),
    use: computeScopeCounts(rows, ITEM_SCOPES.use),
    etc: computeScopeCounts(rows, ITEM_SCOPES.etc),
    setup: computeScopeCounts(rows, ITEM_SCOPES.setup),
    cash: computeScopeCounts(rows, ITEM_SCOPES.cash),
  };
}
