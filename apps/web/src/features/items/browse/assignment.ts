/**
 * Assignment and counting logic for MapleStory Item categories.
 *
 * Scopes are disjoint by itemClass. Membership is always scope AND assignment.
 * Within a scope, positive children are evaluated in declared precedence order;
 * the first match wins. If no positive child matches, an item falls through
 * to the scope's Other child (if present).
 */
import {
  ITEM_SCOPES,
  type ItemCategoryChild,
  type ItemCategoryScope,
  type ItemScopeSlug,
} from './categories';
import type { ItemRow } from './project';

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

export interface MatchesCategoryOptions {
  readonly row: ItemRow;
  readonly scope: ItemCategoryScope;
  readonly child?: ItemCategoryChild | undefined;
}

/**
 * Predicate determining whether an item row belongs to a scope and optional child.
 *
 * When child is provided, matches if and only if the item belongs to the scope
 * and is assigned to that exact child by precedence.
 */
export function matchesCategory({
  row,
  scope,
  child,
}: MatchesCategoryOptions): boolean {
  if (!scope.itemClasses.includes(row.itemClass)) {
    return false;
  }
  if (!child) {
    return true;
  }
  return assignChild(row, scope) === child;
}

export interface GetCategoryRowsOptions {
  readonly rows: readonly ItemRow[];
  readonly scope: ItemCategoryScope;
  readonly child?: ItemCategoryChild | undefined;
}

export function getCategoryRows({
  rows,
  scope,
  child,
}: GetCategoryRowsOptions): readonly ItemRow[] {
  return rows.filter((row) => matchesCategory({ row, scope, child }));
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
