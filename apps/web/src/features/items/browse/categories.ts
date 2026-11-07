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

const byType = (
  slug: string,
  label: string,
  type: ItemBrowseType,
): ItemPositiveChild => ({
  kind: 'positive',
  slug,
  label,
  matches: (row) => row.types?.includes(type) ?? false,
});

const byFunction = (
  slug: string,
  label: string,
  fn: ItemBrowseFunction,
): ItemPositiveChild => ({
  kind: 'positive',
  slug,
  label,
  matches: (row) => row.functions?.includes(fn) ?? false,
});

const otherChild = (slug: string, label: string): ItemOtherChild => ({
  kind: 'other',
  slug,
  label,
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
      byType('upgrade-scrolls', 'Upgrade Scrolls', 'upgrade-scroll'),
      byFunction('recovery', 'Recovery', 'recovery'),
      byType('throwing-stars', 'Throwing Stars', 'throwing-star'),
      byType('arrows', 'Arrows', 'arrow'),
      byType('bullets', 'Bullets', 'bullet'),
      byType('pet-food', 'Pet Food', 'pet-food'),
      byFunction('summoning-items', 'Summoning Items', 'summon'),
      byFunction('reward-containers', 'Reward Containers', 'reward-container'),
      byType('potions', 'Potions', 'potion'),
      byType('food-buffs', 'Food & Buffs', 'food-buff'),
      byFunction('monster-cards', 'Monster Cards', 'monster-card'),
      byFunction('skill-books', 'Skill & Mastery Books', 'skill'),
      byType('meso-pouches', 'Meso Pouches', 'meso-pouch'),
      otherChild('other-use-items', 'Other Use Items'),
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
      },
      {
        kind: 'positive',
        slug: 'crafting',
        label: 'Crafting',
        matches: (row) =>
          (row.usedInRecipeCount ?? 0) > 0 || (row.madeByRecipeCount ?? 0) > 0,
      },
      byType('ores', 'Ores', 'ore'),
      byType('gems', 'Gems & Jewels', 'gem'),
      byType('refined-materials', 'Refined Materials', 'refined-material'),
      byType('monster-materials', 'Monster Materials', 'monster-material'),
      otherChild('other-etc-items', 'Other ETC Items'),
    ],
  },
  setup: {
    slug: 'setup',
    label: 'Set-up',
    itemClasses: ['setup'],
    children: [
      byType('chairs', 'Chairs', 'chair'),
      byType('holiday-ornaments', 'Holiday Ornaments', 'holiday-ornament'),
      byType('furniture', 'Furniture', 'furniture'),
      byType('crafting-stations', 'Crafting Stations', 'crafting-station'),
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
      },
      {
        kind: 'positive',
        slug: 'cash-items',
        label: 'Cash Items',
        matches: (row) => row.itemClass === 'cash',
      },
    ],
  },
};

export function isItemScope(slug: string): slug is ItemScopeSlug {
  return Object.hasOwn(ITEM_SCOPES, slug);
}

export function getItemScope(slug: ItemScopeSlug): ItemCategoryScope {
  return ITEM_SCOPES[slug];
}

export function getItemScopeChild(
  scopeSlug: ItemScopeSlug,
  childSlug: string,
): ItemCategoryChild | undefined {
  return ITEM_SCOPES[scopeSlug].children.find(
    (child) => child.slug === childSlug,
  );
}

export function isItemScopeChild(
  scopeSlug: ItemScopeSlug,
  childSlug: string,
): boolean {
  return getItemScopeChild(scopeSlug, childSlug) !== undefined;
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

export function getScopeRows(
  rows: readonly ItemRow[],
  scopeSlug: ItemScopeSlug,
): readonly ItemRow[] {
  const scope = getItemScope(scopeSlug);
  return rows.filter((row) => matchesCategory(row, scope));
}

export function getCategoryRows(
  rows: readonly ItemRow[],
  scopeSlug: ItemScopeSlug,
  childSlug?: string,
): readonly ItemRow[] {
  const scope = getItemScope(scopeSlug);
  const child = childSlug ? getItemScopeChild(scopeSlug, childSlug) : undefined;
  if (childSlug && !child) {
    return [];
  }
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
