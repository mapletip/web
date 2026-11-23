/** Query fields, search fields and sort options of Map Browse. */
import type {
  BrowseSortOption,
  QueryFieldDefinition,
} from '@mapletip/component-library';

import type { MapBrowseRecord } from './records';

export const MAP_SORT_OPTIONS = [
  { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
  { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
  {
    label: 'Monster level: low to high',
    field: 'lowestMonsterLevel',
    direction: 'asc',
  },
  {
    label: 'Monster level: high to low',
    field: 'highestMonsterLevel',
    direction: 'desc',
  },
  { label: 'Most spawn points', field: 'spawnPointCount', direction: 'desc' },
] as const satisfies readonly BrowseSortOption[];

function names(
  inhabitants: MapBrowseRecord['monsters'] | MapBrowseRecord['npcs'],
): string[] {
  return inhabitants.flatMap(({ entry }) =>
    entry.name === undefined ? [] : [entry.name],
  );
}

export const MAP_QUERY_FIELDS: readonly QueryFieldDefinition<MapBrowseRecord>[] =
  [
    'name',
    { id: 'streetName', accessor: 'streetName', sortable: false },
    { id: 'activity', accessor: 'activity', sortable: false },
    { id: 'regionLabel', accessor: 'regionLabel', sortable: false },
    { id: 'areaLabel', accessor: 'areaLabel', sortable: false },
    { id: 'collectionLabel', accessor: 'collectionLabel', sortable: false },
    {
      id: 'inhabitants',
      accessor: (record) => [...names(record.monsters), ...names(record.npcs)],
      sortable: false,
    },
    { id: 'locationKeys', accessor: 'locationKeys', sortable: false },
    'lowestMonsterLevel',
    'highestMonsterLevel',
    'spawnPointCount',
  ];

export const MAP_SEARCH_FIELDS = [
  'name',
  'streetName',
  'activity',
  'regionLabel',
  'areaLabel',
  'collectionLabel',
  'inhabitants',
] as const satisfies readonly string[];
