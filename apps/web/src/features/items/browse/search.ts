/** Search matching and exact-ID notice computation for Items Browse. */
import { BUILDS, type BuildId } from '@/config/maplekit';

import { matchesCategory } from './assignment';
import { ITEM_SCOPE_SLUGS, ITEM_SCOPES } from './categories';
import type { ItemRow } from './project';
import type { ItemCategorySelection } from './routing';

export interface MatchSourceIdOptions {
  readonly sourceId: string;
  readonly query: string;
}

/** Matches digit-only IDs by numeric value, including leading zeroes. */
export function matchSourceId({
  sourceId,
  query,
}: MatchSourceIdOptions): boolean {
  const trimmedQuery = query.trim();
  if (!/^\d+$/.test(trimmedQuery) || !/^\d+$/.test(sourceId)) return false;
  return BigInt(sourceId) === BigInt(trimmedQuery);
}

interface GetOwningScopeOptions {
  readonly row: ItemRow;
}

function getOwningScope({ row }: GetOwningScopeOptions) {
  const slug = ITEM_SCOPE_SLUGS.find(
    (candidate) =>
      candidate !== 'all' &&
      matchesCategory({ row, scope: ITEM_SCOPES[candidate] }),
  );
  return slug && slug !== 'all' ? ITEM_SCOPES[slug] : undefined;
}

export type ExactIdNoticeState =
  | {
      readonly kind: 'outside-category';
      readonly item: ItemRow;
      readonly owningScope: ReturnType<typeof getOwningScope>;
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
        readonly owningScope: ReturnType<typeof getOwningScope>;
      }[];
    };

export interface FindExactIdNoticeOptions {
  readonly query: string;
  readonly rows: readonly ItemRow[];
  readonly category: ItemCategorySelection;
  readonly buildId: BuildId;
}

/** Finds exact numeric ID matches outside the selected category. */
export function findExactIdNotice({
  query,
  rows,
  category,
  buildId,
}: FindExactIdNoticeOptions): ExactIdNoticeState | null {
  const trimmedQuery = query.trim();
  if (!/^\d+$/.test(trimmedQuery)) return null;

  const matches = rows.filter((row) =>
    matchSourceId({ sourceId: row.sourceId, query: trimmedQuery }),
  );

  if (matches.length === 0) {
    const hasNameMatch = rows.some((row) =>
      row.name?.toLowerCase().includes(trimmedQuery.toLowerCase()),
    );
    if (hasNameMatch) return null;
    return {
      kind: 'none',
      query: trimmedQuery,
      buildLabel: BUILDS[buildId].label,
    };
  }

  if (
    matches.every((row) =>
      matchesCategory({
        row,
        scope: category.scope,
        child: category.child,
      }),
    )
  ) {
    return null;
  }

  const [firstMatch, secondMatch] = matches;
  if (firstMatch && !secondMatch) {
    return {
      kind: 'outside-category',
      item: firstMatch,
      owningScope: getOwningScope({ row: firstMatch }),
      query: trimmedQuery,
    };
  }

  return {
    kind: 'multiple',
    query: trimmedQuery,
    items: matches.map((item) => ({
      item,
      owningScope: getOwningScope({ row: item }),
    })),
  };
}
