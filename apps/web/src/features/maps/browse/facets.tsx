/** Query fields, facets, search fields and sort options of Map Browse. */
import { Thumbnail } from '@mapletip/component-library';
import type {
  BrowseSortOption,
  FacetDefinition,
  FacetOption,
  QueryFieldDefinition,
} from '@mapletip/component-library';
import { mapNpcSpriteUrl } from '@mapletip/data/maps';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';
import { resolveMonsterSpriteUrl } from '@/features/monsters/shared';

import { MAP_ACTIVITY_TYPES, type MapBrowseData } from './project';
import type { MapBrowseRecord } from './records';

const OPTION_ICON_SIZE = 20;

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
    { id: 'monster', accessor: 'monster', sortable: false },
    { id: 'npc', accessor: 'npc', sortable: false },
    { id: 'level', accessor: 'level', sortable: false },
    { id: 'activityType', accessor: 'activityType', sortable: false },
    { id: 'hasMonsters', accessor: 'hasMonsters', sortable: false },
    { id: 'hasNpcs', accessor: 'hasNpcs', sortable: false },
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

function icon(url: string | undefined): Pick<FacetOption, 'icon'> {
  return url === undefined
    ? {}
    : { icon: <Thumbnail src={url} size={OPTION_ICON_SIZE} alt="" /> };
}

function byLabel(left: FacetOption, right: FacetOption): number {
  return left.label.localeCompare(right.label);
}

/** Map Browse facets; options come from the build's roster directories. */
export function mapFacets(
  data: MapBrowseData,
): readonly FacetDefinition<MapBrowseRecord>[] {
  const monsterOptions = data.monsters
    .flatMap(({ key, name, level, spriteId }): FacetOption[] =>
      name === undefined
        ? []
        : [
            {
              value: key,
              label: name,
              ...(level === undefined ? {} : { description: `Lv. ${level}` }),
              ...icon(resolveMonsterSpriteUrl(spriteId)),
            },
          ],
    )
    .sort(byLabel);
  const npcOptions = data.npcs
    .flatMap(({ key, name, spriteId }): FacetOption[] =>
      name === undefined
        ? []
        : [
            {
              value: key,
              label: name,
              ...icon(
                spriteId === undefined
                  ? undefined
                  : mapNpcSpriteUrl(MAPLEKIT_RELEASE.baseUrl, spriteId),
              ),
            },
          ],
    )
    .sort(byLabel);

  return [
    {
      id: 'monster',
      field: 'monster',
      label: 'Monster',
      kind: 'multi-select',
      options: monsterOptions,
      picker: {
        placeholder: 'Search monsters',
        nothingFound: 'No monsters match',
      },
    },
    {
      id: 'npc',
      field: 'npc',
      label: 'NPC',
      kind: 'multi-select',
      options: npcOptions,
      picker: { placeholder: 'Search NPCs', nothingFound: 'No NPCs match' },
    },
    { id: 'level', field: 'level', label: 'Monster level', kind: 'range' },
    {
      id: 'activity-type',
      field: 'activityType',
      label: 'Activity',
      kind: 'multi-select',
      options: Object.values(MAP_ACTIVITY_TYPES).map((type) => ({
        value: type,
        label: type,
      })),
    },
    {
      id: 'has-monsters',
      field: 'hasMonsters',
      label: 'Has monsters',
      kind: 'boolean',
    },
    { id: 'has-npcs', field: 'hasNpcs', label: 'Has NPCs', kind: 'boolean' },
  ];
}
