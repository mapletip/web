import type { RecordFact } from '@mapletip/component-library';

import type {
  ProjectedRelationKind,
  ProjectedRelations,
} from '../browse/relation-projection';

const WORDING: Record<
  ProjectedRelationKind,
  {
    readonly id: string;
    readonly lead: string;
    readonly singular: string;
    readonly plural: string;
  }
> = {
  'needed-for-quest': {
    id: 'quests',
    lead: 'Required by',
    singular: 'quest',
    plural: 'quests',
  },
  'used-in-recipe': {
    id: 'recipes',
    lead: 'Used in',
    singular: 'recipe',
    plural: 'recipes',
  },
  'monster-drop': {
    id: 'monsters',
    lead: 'Dropped by',
    singular: 'monster',
    plural: 'monsters',
  },
};

export function relationFact({
  row,
  relations,
  kind,
  count,
}: {
  readonly row: { readonly sourceId: string };
  readonly relations: ProjectedRelations;
  readonly kind: ProjectedRelationKind;
  readonly count: number | undefined;
}): RecordFact | undefined {
  if (count === undefined || count === 0) return undefined;
  const relation = relations[kind];
  if (
    kind === 'needed-for-quest' &&
    relation?.unestablished?.includes(row.sourceId)
  )
    return undefined;
  const indices = relation?.byItem[row.sourceId] ?? [];
  const name =
    indices.length === 1
      ? relation?.targets[indices[0] ?? -1]?.name
      : undefined;
  const { id, lead, singular, plural } = WORDING[kind];
  return {
    id,
    label: `${lead} ${count === 1 && name ? name : `${count} ${count === 1 ? singular : plural}`}`,
  };
}
