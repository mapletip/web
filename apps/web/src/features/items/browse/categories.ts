/**
 * The single category registry for MapleStory Items Browse.
 *
 * Within a scope, every item belongs to EXACTLY ONE child.
 * Positive children form an ordered list where order defines precedence:
 * an item is assigned to the FIRST positive child whose predicate matches.
 * If no positive child matches, it falls through to the scope's Other child
 * (if present).
 *
 * Scopes are disjoint by itemClass. Membership is always scope AND assignment.
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
      byFunction('recovery', 'Recovery', 'recovery', ['02000002', '02000003']),
      {
        kind: 'positive',
        slug: 'buffs',
        label: 'Buffs',
        matches: (row) =>
          Boolean(
            row.types?.includes('potion') || row.types?.includes('food-buff'),
          ),
        iconSourceIds: ['02012000', '02022002'],
      },
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
      otherChild('other-use-items', 'Other Use Items'),
    ],
  },
  etc: {
    slug: 'etc',
    label: 'ETC',
    itemClasses: ['etc'],
    children: [
      byType('ores', 'Ores', 'ore', ['04010006', '04010001', '04010000']),
      byType('gems', 'Gems & Jewels', 'gem', ['04020107', '04021007']),
      byType('refined-materials', 'Refined Materials', 'refined-material', [
        '04010101',
        '04011001',
      ]),
      byType('monster-materials', 'Monster Materials', 'monster-material', [
        '04001000',
      ]),
      {
        kind: 'positive',
        slug: 'quest-items',
        label: 'Quest Items',
        matches: (row) => (row.neededForQuestCount ?? 0) > 0,
        iconSourceIds: ['04031001', '04031077'],
      },
      otherChild('other-etc-items', 'Other ETC Items'),
    ],
  },
  setup: {
    slug: 'setup',
    label: 'Set-up',
    itemClasses: ['setup'],
    children: [
      byType('chairs', 'Chairs', 'chair', ['03010007', '03010008']),
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
        iconSourceIds: ['5000002', '5000008'],
      },
      {
        kind: 'positive',
        slug: 'cash-items',
        label: 'Cash Items',
        matches: (row) => row.itemClass === 'cash',
        iconSourceIds: ['05070001', '05072000'],
      },
    ],
  },
};

export function isItemScope(slug: string): slug is ItemScopeSlug {
  return Object.hasOwn(ITEM_SCOPES, slug);
}

/**
 * Assigns an item row to its single mutually exclusive child within a scope.
 * Positive children are evaluated in declared precedence order; the first match wins.
 * If no positive child matches, falls through to the scope's Other child (if any).
 */
export function assignChild(
  row: ItemRow,
  scope: ItemCategoryScope,
): ItemCategoryChild | undefined {
  if (!scope.itemClasses.includes(row.itemClass)) {
    return undefined;
  }
  for (const child of scope.children) {
    if (child.kind === 'positive' && child.matches(row)) {
      return child;
    }
  }
  return scope.children.find((c) => c.kind === 'other');
}

/**
 * Predicate determining whether an item row belongs to a scope and optional child.
 *
 * When child is provided, matches if and only if the item belongs to the scope
 * and is assigned to that exact child by precedence.
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
  return assignChild(row, scope) === child;
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

const NON_ALL_SCOPES = [
  ITEM_SCOPES.use,
  ITEM_SCOPES.etc,
  ITEM_SCOPES.setup,
  ITEM_SCOPES.cash,
] as const;

export function getCategoryCounts(rows: readonly ItemRow[]): CategoryCounts {
  const counts: Record<
    ItemScopeSlug,
    { total: number; children: Record<string, number> }
  > = {
    all: { total: 0, children: {} },
    use: {
      total: 0,
      children: Object.fromEntries(
        ITEM_SCOPES.use.children.map((c) => [c.slug, 0]),
      ),
    },
    etc: {
      total: 0,
      children: Object.fromEntries(
        ITEM_SCOPES.etc.children.map((c) => [c.slug, 0]),
      ),
    },
    setup: {
      total: 0,
      children: Object.fromEntries(
        ITEM_SCOPES.setup.children.map((c) => [c.slug, 0]),
      ),
    },
    cash: {
      total: 0,
      children: Object.fromEntries(
        ITEM_SCOPES.cash.children.map((c) => [c.slug, 0]),
      ),
    },
  };

  for (const row of rows) {
    if (ITEM_SCOPES.all.itemClasses.includes(row.itemClass)) {
      counts.all.total++;
    }
    for (const scope of NON_ALL_SCOPES) {
      if (scope.itemClasses.includes(row.itemClass)) {
        counts[scope.slug].total++;
        const child = assignChild(row, scope);
        if (child) {
          counts[scope.slug].children[child.slug] =
            (counts[scope.slug].children[child.slug] ?? 0) + 1;
        }
        break;
      }
    }
  }

  return counts;
}
