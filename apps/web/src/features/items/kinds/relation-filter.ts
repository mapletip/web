import type {
  FacetDefinition,
  QueryFieldDefinition,
} from '@mapletip/component-library';

import type { CategorizedItemRow } from '../browse/project';
import type {
  ProjectedRelations,
  ProjectedRelationKind,
} from '../browse/relation-projection';

export function relationFilter({
  relations,
  kind,
  label,
}: {
  readonly relations: ProjectedRelations;
  readonly kind: Exclude<ProjectedRelationKind, 'used-in-recipe'>;
  readonly label: 'Quest' | 'Monster';
}): readonly FacetDefinition<CategorizedItemRow>[] {
  const targets = relations[kind]?.targets;
  if (!targets?.length) return [];
  return [
    {
      id: label.toLowerCase(),
      field: label.toLowerCase(),
      label,
      kind: 'multi-select',
      options: targets.flatMap(({ publicId, name }) =>
        publicId === undefined ? [] : [{ value: publicId, label: name }],
      ),
      picker: {
        placeholder: `Search ${label.toLowerCase()}s`,
        nothingFound: `No ${label.toLowerCase()}s match`,
      },
    },
  ];
}

export function relationQueryField({
  relations,
  kind,
  label,
}: {
  readonly relations: ProjectedRelations;
  readonly kind: Exclude<ProjectedRelationKind, 'used-in-recipe'>;
  readonly label: 'Quest' | 'Monster';
}): Extract<QueryFieldDefinition<CategorizedItemRow>, { readonly id: string }> {
  return {
    id: label.toLowerCase(),
    accessor: (row) =>
      (relations[kind]?.byItem[row.key] ?? [])
        .map((index) => relations[kind]?.targets[index]?.publicId)
        .filter((id) => id !== undefined),
    sortable: false,
  };
}
