/**
 * Search matching and exact-ID notice computation for Items Browse.
 */
import { BUILDS, type BuildId } from '@/config/maplekit';

import {
  ITEM_SCOPE_SLUGS,
  ITEM_SCOPES,
  matchesCategory,
  type ItemCategoryScope,
} from './categories';
import type { ItemRow } from './project';
import type { ItemCategorySelection } from './routing';

export function matchSourceId(sourceId: string, query: string): boolean {
  const trimmedQuery = query.trim();
  if (!/^\d+$/.test(trimmedQuery) || !/^\d+$/.test(sourceId)) {
    return false;
  }
  return Number.parseInt(trimmedQuery, 10) === Number.parseInt(sourceId, 10);
}

function getOwningScope(row: ItemRow): ItemCategoryScope {
  for (const slug of ITEM_SCOPE_SLUGS) {
    if (slug === 'all') continue;
    const scope = ITEM_SCOPES[slug];
    if (scope.itemClasses.includes(row.itemClass)) {
      return scope;
    }
  }
  return ITEM_SCOPES.cash;
}

export type ExactIdNoticeState =
  | {
      readonly kind: 'outside-category';
      readonly item: ItemRow;
      readonly owningScope: ItemCategoryScope;
      readonly query: string;
    }
  | {
      readonly kind: 'none';
      readonly query: string;
      readonly buildLabel: string;
    }
  | {
      readonly kind: 'multiple';
      readonly query: string;
      readonly items: readonly {
        readonly item: ItemRow;
        readonly owningScope: ItemCategoryScope;
      }[];
    };

export function findExactIdNotice(
  query: string,
  allRows: readonly ItemRow[],
  currentCategory: ItemCategorySelection,
  buildId: BuildId,
): ExactIdNoticeState | null {
  const trimmed = query.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const matches = allRows.filter((row) => matchSourceId(row.sourceId, trimmed));

  if (matches.length === 0) {
    const queryLower = trimmed.toLowerCase();
    const hasNameMatch = allRows.some((row) =>
      row.name?.toLowerCase().includes(queryLower),
    );
    if (hasNameMatch) {
      return null;
    }
    return {
      kind: 'none',
      query: trimmed,
      buildLabel: BUILDS[buildId].label,
    };
  }

  const [firstMatch, secondMatch] = matches;
  if (firstMatch && !secondMatch) {
    if (
      matchesCategory(firstMatch, currentCategory.scope, currentCategory.child)
    ) {
      return null;
    }
    return {
      kind: 'outside-category',
      item: firstMatch,
      owningScope: getOwningScope(firstMatch),
      query: trimmed,
    };
  }

  return {
    kind: 'multiple',
    query: trimmed,
    items: matches.map((item) => ({
      item,
      owningScope: getOwningScope(item),
    })),
  };
}
