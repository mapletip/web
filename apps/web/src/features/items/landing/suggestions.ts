import type { CategorizedItemRow } from '../browse/project';

/** Maximum number of item rows suggested below the landing search input. */
export const MAX_ITEM_SUGGESTIONS = 6;

/** Filter and rank item rows for landing search suggestions (at most `limit`). */
export function matchItemSuggestions({
  rows,
  query,
  limit = MAX_ITEM_SUGGESTIONS,
}: {
  readonly rows: readonly CategorizedItemRow[];
  readonly query: string;
  readonly limit?: number;
}): readonly CategorizedItemRow[] {
  const needle = query.trim().toLocaleLowerCase('en');
  if (needle === '' || limit <= 0) return [];

  const matches: CategorizedItemRow[] = [];
  for (const row of rows) {
    if (
      row.name !== undefined &&
      row.name.toLocaleLowerCase('en').includes(needle)
    ) {
      matches.push(row);
    }
  }

  matches.sort((left, right) => {
    const leftName = left.name ?? '';
    const rightName = right.name ?? '';
    const leftPrefix = leftName.toLocaleLowerCase('en').startsWith(needle);
    const rightPrefix = rightName.toLocaleLowerCase('en').startsWith(needle);
    if (leftPrefix !== rightPrefix) return leftPrefix ? -1 : 1;
    const byName = leftName.localeCompare(rightName, 'en');
    if (byName !== 0) return byName;
    return left.sourceId.localeCompare(right.sourceId, 'en');
  });

  return matches.slice(0, limit);
}
