import type { CategorizedItemRow } from '../browse/project';

import type { ItemKind } from './types';

/** Resolve a category's sort accessor once for each shelf. */
export function kindSortValue({
  kind,
  field,
}: {
  readonly kind: ItemKind;
  readonly field: keyof CategorizedItemRow | 'typeRank';
}): (row: CategorizedItemRow) => unknown {
  const queryField = kind.card
    ?.queryFields?.({ coverage: undefined, relations: {} })
    .find((entry) => typeof entry !== 'string' && entry.id === field);
  const accessor =
    queryField && typeof queryField !== 'string'
      ? (queryField.accessor ?? field)
      : field;
  if (typeof accessor === 'function') return accessor;
  if (accessor === 'typeRank') return () => undefined;
  return (row) => row[accessor];
}
