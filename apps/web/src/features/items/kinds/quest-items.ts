import { relationFilter, relationQueryField } from './relation-filter';
import type { ItemKind } from './types';

export const questItems = {
  id: 'quest-items',
  group: 'etc',
  slug: 'quest-items',
  label: 'Quest Items',
  iconContentId:
    '63df4ceb3580419b2ae1db57f001573eac4fe068edfe5aeea17c4ce734de0f7a',
  matches: (row) => row.itemClass === 'etc' && row.questFlag === true,
  relations: ['needed-for-quest'],
  card: {
    lead: (row, { coverage, relations }) => {
      const relation = relations['needed-for-quest'];
      const indices = relation?.byItem[row.sourceId] ?? [];
      const firstIndex = indices[0];
      if (indices.length === 1 && firstIndex !== undefined) {
        const name = relation?.targets[firstIndex]?.name;
        if (name !== undefined)
          return [
            { text: 'For the quest ', emphasis: false },
            { text: name, emphasis: 'primary' },
          ];
      }
      const count = row.neededForQuestCount ?? 0;
      if (count > 0) return `For ${count} ${count === 1 ? 'quest' : 'quests'}`;
      return coverage?.relationships['needed-for-quest'] === 'complete'
        ? 'No known quest'
        : undefined;
    },
    facets: ({ coverage, relations }) => [
      {
        id: 'quest-status',
        field: 'questStatus',
        label: 'Quest status',
        kind: 'multi-select',
        placement: 'results',
        options: [
          { value: 'required', label: 'Required by a quest' },
          ...(coverage?.relationships['needed-for-quest'] === 'complete'
            ? [{ value: 'unknown', label: 'No known quest' }]
            : []),
        ],
      },
      ...relationFilter({
        relations,
        kind: 'needed-for-quest',
        label: 'Quest',
      }),
    ],
    queryFields: ({ relations }) => [
      {
        id: 'questStatus',
        accessor: (row) =>
          (row.neededForQuestCount ?? 0) > 0 ? 'required' : 'unknown',
        sortable: false,
      },
      relationQueryField({
        relations,
        kind: 'needed-for-quest',
        label: 'Quest',
      }),
    ],
  },
} satisfies ItemKind;
