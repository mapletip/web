/**
 * Server-side projection of one build's Map browse read into the compact data
 * the page ships: flat rows that point into one monster and one NPC directory,
 * plus the location list. Nothing here derives game data; it only joins the
 * published rows, roster and geography by key.
 */
import type { MapBrowse, MapBrowseRosterNpcV1 } from '@mapletip/data/maps';

type Fact<T> =
  | { readonly state: 'known'; readonly value: T }
  | { readonly state: 'unknown' }
  | { readonly state: 'absent'; readonly coverageKey: string }
  | { readonly state: 'unsupported' };

/** Player wording for reviewed placement classifications players look for. */
export const MAP_ACTIVITY_TYPES = {
  'party-quest': 'Party quest',
  'jump-quest': 'Jump quest',
  'job-advancement-test': 'Job advancement test',
  'quest-instance': 'Quest map',
  instance: 'Instance',
} as const satisfies Readonly<Record<string, string>>;

export type MapActivityType =
  (typeof MAP_ACTIVITY_TYPES)[keyof typeof MAP_ACTIVITY_TYPES];

export interface MapBrowseMonster {
  readonly publicId?: string;
  readonly name?: string;
  readonly level?: number;
  readonly spriteId?: string;
}

export interface MapBrowseNpc {
  readonly key: string;
  readonly name?: string;
  readonly spriteId?: string;
}

export interface MapBrowseLocation {
  readonly key: string;
  readonly label: string;
  readonly mapCount: number;
  /** The area's map mark content id; regions and collections have none. */
  readonly markId?: string;
}

export interface MapBrowseRegion extends MapBrowseLocation {
  readonly areas: readonly MapBrowseLocation[];
}

export interface MapBrowseGeography {
  readonly regions: readonly MapBrowseRegion[];
  readonly collections: readonly MapBrowseLocation[];
}

/** One map as shipped to the page; monsters and NPCs index the directories. */
export interface MapBrowseRow {
  readonly publicId: string;
  readonly slug: string;
  readonly name?: string;
  readonly streetName?: string;
  readonly regionKey?: string;
  readonly areaKey?: string;
  readonly collectionKey?: string;
  readonly activity?: string;
  readonly activityType?: MapActivityType;
  readonly minimapId?: string;
  /** The map's mark content id (Map browse 1.1). */
  readonly markId?: string;
  readonly music?: string;
  readonly entryLevel?: number;
  readonly levelCap?: number;
  readonly monsterCount?: number;
  readonly spawnPointCount?: number;
  readonly npcCount?: number;
  /** `[monster directory index, spawn points on this map]` pairs. */
  readonly monsters: readonly (readonly [number, number])[];
  /** NPC directory indexes. */
  readonly npcs: readonly number[];
}

export interface MapBrowseData {
  readonly rows: readonly MapBrowseRow[];
  readonly monsters: readonly MapBrowseMonster[];
  readonly npcs: readonly MapBrowseNpc[];
  readonly geography: MapBrowseGeography;
}

function knownValue<T>(fact: Fact<T>): T | undefined {
  return fact.state === 'known' ? fact.value : undefined;
}

/** Undefined-valued properties become omitted optional properties. */
type Defined<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<
    T[K],
    undefined
  >;
};

/** Drop unknown facts so the shipped payload carries only known values. */
function defined<T extends Record<string, unknown>>(value: T): Defined<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Defined<T>;
}

function activityTypeOf(classification: string): MapActivityType | undefined {
  return Object.hasOwn(MAP_ACTIVITY_TYPES, classification)
    ? MAP_ACTIVITY_TYPES[classification as keyof typeof MAP_ACTIVITY_TYPES]
    : undefined;
}

function projectMonster(
  monster: MapBrowse['roster']['monsters'][number],
): MapBrowseMonster {
  return defined({
    publicId: 'publicId' in monster ? monster.publicId : undefined,
    name: knownValue(monster.name),
    level: knownValue(monster.level),
    spriteId: knownValue(monster.sprite),
  });
}

function projectNpc(npc: MapBrowseRosterNpcV1): MapBrowseNpc {
  return defined({
    key: npc.key,
    name: knownValue(npc.name),
    spriteId: knownValue(npc.sprite),
  });
}

function projectRow({
  row,
  activityTypes,
  roster,
}: {
  readonly row: MapBrowse['rows']['records'][number];
  readonly activityTypes: ReadonlyMap<string, MapActivityType>;
  readonly roster: MapBrowse['roster']['records'][string];
}): MapBrowseRow {
  const geography = row.geography;
  return defined({
    publicId: row.publicId,
    slug: row.slug,
    name: knownValue(row.name),
    streetName: knownValue(row.streetName),
    regionKey: geography?.regionKey ?? undefined,
    areaKey: geography?.areaKey ?? undefined,
    collectionKey: geography?.collectionKey ?? undefined,
    activity: knownValue(row.activity),
    activityType: activityTypes.get(row.key),
    minimapId: knownValue(row.minimap),
    markId: 'markImage' in row ? knownValue(row.markImage) : undefined,
    music: 'music' in row ? knownValue(row.music) : undefined,
    entryLevel: 'entryLevel' in row ? knownValue(row.entryLevel) : undefined,
    levelCap: 'levelCap' in row ? knownValue(row.levelCap) : undefined,
    monsterCount: knownValue(row.monsterCount),
    spawnPointCount: knownValue(row.spawnPointCount),
    npcCount: knownValue(row.npcCount),
    monsters: (roster?.monsters ?? []).map(
      ({ monster, spawnPointCount }) => [monster, spawnPointCount] as const,
    ),
    npcs: roster?.npcs ?? [],
  });
}

/** Project one `getMapBrowse` read into the page's compact data. */
export function projectMapBrowse(browse: MapBrowse): MapBrowseData {
  const activityTypes = new Map(
    browse.geography.placements.flatMap((placement) => {
      const type = activityTypeOf(placement.classification);
      return type === undefined ? [] : [[placement.mapKey, type] as const];
    }),
  );
  const location = ({ key, label, mapCount }: MapBrowseLocation) => ({
    key,
    label,
    mapCount,
  });

  return {
    rows: browse.rows.records.map((row) =>
      projectRow({
        row,
        activityTypes,
        roster: browse.roster.records[row.key],
      }),
    ),
    monsters: browse.roster.monsters.map(projectMonster),
    npcs: browse.roster.npcs.map(projectNpc),
    geography: {
      regions: browse.geography.regions.map((region) => ({
        ...location(region),
        areas: region.areas.map((area) =>
          defined({
            ...location(area),
            // Geography 1.1 gives every area a mark fact.
            markId: 'mark' in area ? knownValue(area.mark) : undefined,
          }),
        ),
      })),
      // The geography artifact supplies the published collection labels.
      collections: browse.geography.collections.map(location),
    },
  };
}
