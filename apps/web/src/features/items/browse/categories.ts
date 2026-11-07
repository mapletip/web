/**
 * The single category registry for MapleStory Items Browse.
 *
 * Provides functions that return a category's population and per-category counts.
 *
 * Membership is always scope AND predicate.
 */
import {
  ITEM_SCOPES,
  type ItemCategoryChild,
  type ItemCategoryScope,
  type ItemPositiveChild,
  type ItemScopeSlug,
} from './categoryScopes';
import type { ItemRow } from './project';

export * from './categoryScopes';

const SCOPE_BY_SLUG = new Map<ItemScopeSlug, ItemCategoryScope>(
  ITEM_SCOPES.map((scope) => [scope.slug, scope]),
);

export function isItemScope(slug: string): slug is ItemScopeSlug {
  return SCOPE_BY_SLUG.has(slug as ItemScopeSlug);
}

export function getItemScope(slug: ItemScopeSlug): ItemCategoryScope {
  const scope = SCOPE_BY_SLUG.get(slug);
  if (!scope) {
    throw new Error(`Unknown item scope: ${slug}`);
  }
  return scope;
}

export function getItemScopeChild(
  scopeSlug: ItemScopeSlug,
  childSlug: string,
): ItemCategoryChild | undefined {
  const scope = SCOPE_BY_SLUG.get(scopeSlug);
  if (!scope) return undefined;
  return scope.children.find((child) => child.slug === childSlug);
}

export function isItemScopeChild(
  scopeSlug: ItemScopeSlug,
  childSlug: string,
): boolean {
  return getItemScopeChild(scopeSlug, childSlug) !== undefined;
}

export function getScopeRows(
  rows: readonly ItemRow[],
  scopeSlug: ItemScopeSlug,
): readonly ItemRow[] {
  const scope = getItemScope(scopeSlug);
  return rows.filter((row) => scope.itemClasses.includes(row.itemClass));
}

export function getCategoryRows(
  rows: readonly ItemRow[],
  scopeSlug: ItemScopeSlug,
  childSlug?: string,
): readonly ItemRow[] {
  const scopeRows = getScopeRows(rows, scopeSlug);
  if (!childSlug) return scopeRows;

  const child = getItemScopeChild(scopeSlug, childSlug);
  if (!child) return [];

  if (child.kind === 'positive') {
    return scopeRows.filter((row) => child.matches(row));
  }

  const scope = getItemScope(scopeSlug);
  const positiveChildren = scope.children.filter(
    (c): c is ItemPositiveChild => c.kind === 'positive',
  );
  return scopeRows.filter(
    (row) => !positiveChildren.some((pc) => pc.matches(row)),
  );
}

export interface ScopeCountSummary {
  readonly total: number;
  readonly children: Readonly<Record<string, number>>;
}

export type CategoryCounts = Readonly<Record<ItemScopeSlug, ScopeCountSummary>>;

export function getCategoryCounts(rows: readonly ItemRow[]): CategoryCounts {
  const result: Partial<Record<ItemScopeSlug, ScopeCountSummary>> = {};

  for (const scope of ITEM_SCOPES) {
    const scopeRows = rows.filter((row) =>
      scope.itemClasses.includes(row.itemClass),
    );
    const positiveChildren = scope.children.filter(
      (c): c is ItemPositiveChild => c.kind === 'positive',
    );
    const childCounts: Record<string, number> = {};

    for (const child of scope.children) {
      if (child.kind === 'positive') {
        childCounts[child.slug] = scopeRows.filter((row) =>
          child.matches(row),
        ).length;
      } else {
        childCounts[child.slug] = scopeRows.filter(
          (row) => !positiveChildren.some((pc) => pc.matches(row)),
        ).length;
      }
    }

    result[scope.slug] = {
      total: scopeRows.length,
      children: childCounts,
    };
  }

  return result as CategoryCounts;
}
