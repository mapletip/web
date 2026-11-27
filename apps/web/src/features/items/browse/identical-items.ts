import type { ItemCardContext, ItemKind } from '../kinds/types';

import type { CategorizedItemRow } from './project';

/** Relationship counts: a merged card keeps the largest, so a filter matches when any version does. */
const COUNT_FIELDS = [
  'cashShopListingCount',
  'monsterDropCount',
  'neededForQuestCount',
  'questRewardCount',
  'usedInRecipeCount',
] as const satisfies readonly (keyof CategorizedItemRow)[];

const NOT_IDENTITY = new Set<string>([
  'key',
  'sourceId',
  'versions',
  ...COUNT_FIELDS,
]);

/** Everything a player can see about a row, except where it comes from. */
function identityKey(row: CategorizedItemRow): string {
  return JSON.stringify(
    Object.entries(row)
      .filter(([field]) => !NOT_IDENTITY.has(field))
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

/**
 * Merge rows a player cannot tell apart: same data apart from item ids and how many quests,
 * recipes or monsters link to them. The merged card lists its versions in the drawer.
 */
export function mergeIdenticalItems({
  rows,
}: {
  readonly rows: readonly CategorizedItemRow[];
}): readonly CategorizedItemRow[] {
  const groups = new Map<string, CategorizedItemRow[]>();
  for (const row of rows) {
    const key = identityKey(row);
    const members = groups.get(key);
    if (members === undefined) groups.set(key, [row]);
    else members.push(row);
  }
  return [...groups.values()].map((members) => {
    const [first] = members;
    if (first === undefined) throw new Error('An item group cannot be empty.');
    if (members.length === 1) return first;
    const counts = Object.fromEntries(
      COUNT_FIELDS.flatMap((field) => {
        const largest = Math.max(
          ...members.map((member) => member[field] ?? 0),
        );
        return largest > 0 ? [[field, largest]] : [];
      }),
    );
    return { ...first, ...counts, versions: members };
  });
}

/** Apply each category's grouping (scroll families) or merge identical items, before the browser counts cards. */
export function groupItemRows({
  rows,
  kinds,
  context,
}: {
  readonly rows: readonly CategorizedItemRow[];
  readonly kinds: readonly ItemKind[];
  readonly context: ItemCardContext;
}): readonly CategorizedItemRow[] {
  return kinds.flatMap((kind) => {
    const categoryRows = rows.filter((row) => row.kind === kind.id);
    return (
      kind.card?.group?.({ rows: categoryRows, ...context }) ??
      mergeIdenticalItems({ rows: categoryRows })
    );
  });
}
