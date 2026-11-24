/**
 * Client-side records for FacetedBrowser: each compact row joined with the
 * monster and NPC directories and the location labels it points to, so query
 * fields, facets and cards read plain values.
 */
import type {
  MapActivityType,
  MapBrowseData,
  MapBrowseMonster,
  MapBrowseNpc,
  MapBrowseRow,
} from './project';

/** Navigation node id of the root location, shared by every record. */
export const ALL_MAPS = 'all';

export interface MapBrowseInhabitant<TEntry> {
  readonly entry: TEntry;
  readonly spawnPointCount?: number;
}

export interface MapBrowseRecord extends Record<string, unknown> {
  readonly publicId: string;
  readonly slug: string;
  readonly name?: string;
  readonly streetName?: string;
  readonly regionLabel?: string;
  readonly areaLabel?: string;
  readonly collectionLabel?: string;
  /** Navigation node ids: "all", then region and area, or collection. */
  readonly locationKeys: readonly string[];
  readonly activity?: string;
  readonly activityType?: MapActivityType;
  readonly minimapId?: string;
  readonly monsterCount?: number;
  readonly spawnPointCount?: number;
  readonly npcCount?: number;
  readonly monsters: readonly MapBrowseInhabitant<MapBrowseMonster>[];
  readonly npcs: readonly MapBrowseInhabitant<MapBrowseNpc>[];
  /** Facet fields; their ids are the address keys. */
  readonly monster: readonly string[];
  readonly npc: readonly string[];
  readonly level: readonly number[];
  readonly lowestMonsterLevel?: number;
  readonly highestMonsterLevel?: number;
  /** Unknown when the count is not published, so neither Yes nor No matches. */
  readonly hasMonsters?: boolean;
  readonly hasNpcs?: boolean;
}

function locationLabels(
  geography: MapBrowseData['geography'],
): ReadonlyMap<string, string> {
  return new Map([
    ...geography.regions.flatMap((region) => [
      [region.key, region.label] as const,
      ...region.areas.map((area) => [area.key, area.label] as const),
    ]),
    ...geography.collections.map(
      (collection) => [collection.key, collection.label] as const,
    ),
  ]);
}

function record({
  row,
  data,
  labels,
}: {
  readonly row: MapBrowseRow;
  readonly data: MapBrowseData;
  readonly labels: ReadonlyMap<string, string>;
}): MapBrowseRecord {
  const { monsters: monsterPairs, npcs: npcIndexes, ...fields } = row;
  const monsters = monsterPairs.flatMap(([index, spawnPointCount]) => {
    const entry = data.monsters[index];
    return entry === undefined ? [] : [{ entry, spawnPointCount }];
  });
  const npcs = npcIndexes.flatMap((index) => {
    const entry = data.npcs[index];
    return entry === undefined ? [] : [{ entry }];
  });
  const levels = monsters.flatMap(({ entry }) =>
    entry.level === undefined ? [] : [entry.level],
  );
  const label = (key: string | undefined) =>
    key === undefined ? undefined : labels.get(key);
  const regionLabel = label(row.regionKey);
  const areaLabel = label(row.areaKey);
  const collectionLabel = label(row.collectionKey);

  return {
    ...fields,
    ...(regionLabel === undefined ? {} : { regionLabel }),
    ...(areaLabel === undefined ? {} : { areaLabel }),
    ...(collectionLabel === undefined ? {} : { collectionLabel }),
    locationKeys: [
      ALL_MAPS,
      ...[row.regionKey, row.areaKey, row.collectionKey].filter(
        (key): key is string => key !== undefined,
      ),
    ],
    monsters,
    npcs,
    monster: monsters.map(({ entry }) => entry.key),
    npc: npcs.map(({ entry }) => entry.key),
    level: levels,
    ...(levels.length === 0
      ? {}
      : {
          lowestMonsterLevel: Math.min(...levels),
          highestMonsterLevel: Math.max(...levels),
        }),
    ...(row.monsterCount === undefined
      ? {}
      : { hasMonsters: row.monsterCount > 0 }),
    ...(row.npcCount === undefined ? {} : { hasNpcs: row.npcCount > 0 }),
  };
}

/** Expand the page data into one record per map. */
export function mapBrowseRecords(data: MapBrowseData): MapBrowseRecord[] {
  const labels = locationLabels(data.geography);
  return data.rows.map((row) => record({ row, data, labels }));
}
