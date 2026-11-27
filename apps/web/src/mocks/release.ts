import type {
  ItemBrowseCoverage,
  ItemBrowseRecordV2_2,
  ItemRelatedEntityBrowsePack,
} from '@mapletip/data/items';
import type { MapGeographyModelV1_1 } from '@mapletip/data/map-geography';
import type {
  MapBrowseRowV1_1,
  MapBrowseV1_1,
  MapPagePackV1_2,
  MapPageRecordV1_2,
  StaticMapBrowseRoster,
} from '@mapletip/data/maps';
import type {
  MonsterCatalogV2_5,
  MonsterDropBrowseV1_2,
  MonsterLocationBrowseV1_4,
  MonsterPagePackV1_4,
  MonsterPageRecordV1_4,
} from '@mapletip/data/monsters';

import type {
  FixtureBuild,
  FixtureFact,
  FixtureLocation,
  FixtureMap,
  FixtureMapPoint,
  FixtureMonster,
  FixtureEvidenceKind,
  FixtureItem,
  FixtureItemQuestUse,
  FixtureQuest,
  SpriteCase,
} from './world';
import { FIXTURE_EVIDENCE_KINDS, spriteDimensions, world } from './world';

type MapBrowseRosterV1_1 = Extract<
  StaticMapBrowseRoster,
  { readonly contractVersion: '1.1' }
>;

/**
 * Stage pixels per game pixel on every fixture stage: a minimap scale of 4,
 * MapleKit's known answer (64 game px -> 4 stage px).
 */
const FIXTURE_STAGE_SCALE = 0.0625;
const encoder = new TextEncoder();
const ZERO = '0'.repeat(64);
const FNV1A_64_OFFSET = 14695981039346656037n;
const FNV1A_64_PRIME = 1099511628211n;
const BASE36_8_MOD = 36n ** 8n;

interface FileDescriptor {
  readonly path: string;
  readonly sha256: string;
  readonly byteLength: number;
}

interface FixtureBuildArtifacts {
  readonly productManifest: FileDescriptor;
  readonly catalog: FileDescriptor;
  readonly dropBrowse: FileDescriptor;
  readonly pagePack: FileDescriptor;
  readonly locationBrowse: FileDescriptor;
  readonly mapProductManifest: FileDescriptor;
  readonly mapPagePack: FileDescriptor;
  readonly mapBrowseRows: FileDescriptor;
  readonly itemProductManifest: FileDescriptor;
  readonly itemCatalog: FileDescriptor;
  readonly itemBrowse: FileDescriptor;
  readonly itemDescriptions: FileDescriptor;
  readonly itemRelatedEntityBrowse: Readonly<Record<string, FileDescriptor>>;
}

interface FixtureRelease {
  readonly files: ReadonlyMap<string, Uint8Array>;
  readonly pin: {
    readonly format: 'mapletip.local-release-pin';
    readonly releaseId: string;
    readonly path: string;
    readonly sha256: string;
    readonly byteLength: number;
  };
  readonly builds: ReadonlyMap<string, FixtureBuildArtifacts>;
  readonly spriteIds: ReadonlyMap<string, string>;
  readonly minimapIds: ReadonlySet<string>;
  readonly markIds: ReadonlySet<string>;
}

type RangeDescriptor = {
  readonly count: number;
  readonly firstKey: string;
  readonly lastKey: string;
};

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function wireFact<T>(fact: FixtureFact<T>): FixtureFact<T> {
  return fact;
}

function mapNonEmpty<T, U>(
  values: readonly [T, ...T[]],
  project: (value: T) => U,
): [U, ...U[]] {
  const [first, ...rest] = values;
  return [project(first), ...rest.map(project)];
}

function known<T>(value: T): FixtureFact<T> {
  return { state: 'known', value };
}

function fixturePublicId(reference: string): string {
  let hash = FNV1A_64_OFFSET;
  for (const byte of encoder.encode(reference)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * FNV1A_64_PRIME);
  }
  return (hash % BASE36_8_MOD).toString(36).padStart(8, '0');
}

export function monsterPublicId(sourceId: string): string {
  return fixturePublicId(`monster:${sourceId}`);
}

export function mapPublicId(options: { readonly sourceId: string }): string {
  return fixturePublicId(`map:${options.sourceId}`);
}

export function monsterSlug(
  name: string | undefined,
  publicId: string,
): string {
  const segments = name?.toLowerCase().match(/[a-z0-9]+/gu);
  return segments && segments.length > 0
    ? segments.join('-')
    : `monster-${publicId}`;
}

function mapSlug(name: string | undefined): string {
  const segments = name?.toLowerCase().match(/[a-z0-9]+/gu);
  return segments && segments.length > 0 ? segments.join('-') : 'map';
}

function locationMapFixtures(build: FixtureBuild): readonly FixtureMap[] {
  const locations = new Map<
    string,
    {
      readonly location: FixtureLocation;
      readonly monsters: FixtureMap['monsters'][number][];
    }
  >();
  for (const monster of build.monsters) {
    for (const location of monster.locations ?? []) {
      const existing = locations.get(location.mapKey);
      if (
        existing !== undefined &&
        (existing.location.name !== location.name ||
          existing.location.minimapContentId !== location.minimapContentId)
      ) {
        throw new Error(
          `Fixture Map identity "${location.mapKey}" has conflicting location data.`,
        );
      }
      const placement = {
        monsterId: monster.id,
        points: [...(location.points ?? [])],
      };
      if (existing === undefined) {
        locations.set(location.mapKey, { location, monsters: [placement] });
      } else {
        existing.monsters.push(placement);
      }
    }
  }

  return [...locations.values()].map(({ location, monsters }) => ({
    id: location.mapKey,
    key: location.mapKey,
    ...(location.name === undefined ? {} : { name: location.name }),
    ...(location.streetName === undefined
      ? {}
      : { streetName: location.streetName }),
    ...(location.regionKey === undefined && location.regionLabel === undefined
      ? {}
      : {
          geography: {
            ...(location.regionKey === undefined
              ? {}
              : { regionKey: location.regionKey }),
            ...(location.regionLabel === undefined
              ? {}
              : { regionLabel: location.regionLabel }),
          },
        }),
    ...(location.minimapContentId === undefined
      ? {}
      : {
          stage: {
            assetId: location.mapKey,
            contentId: location.minimapContentId,
            width: 900,
            height: 600,
          },
        }),
    monsters: monsters.map((monster) => ({
      ...monster,
      points:
        monster.points.length > 0
          ? monster.points
          : Array.from({ length: location.placementCount }, (_, index) => ({
              x: 120 + index * 35,
              y: 240 + (index % 3) * 45,
            })),
    })),
    npcs: [],
    connections: [{ mapId: 'lantern-square', points: [{ x: 450, y: 300 }] }],
    returnMapId: 'lantern-square',
  }));
}

function projectMonster(
  build: FixtureBuild,
  monster: FixtureMonster,
  key: string,
  publicId: string,
  slug: string,
  spriteId: string | undefined,
  dropCount: number,
): MonsterCatalogV2_5['records'][number] {
  const level = monster.level;
  const stats = [
    known(level),
    wireFact(monster.hp),
    wireFact(monster.mp),
    wireFact(monster.exp),
    known(level * 3),
    known(level * 2),
    known(level),
    known(level * 2),
    known(level),
    known(level),
    known(level * 10),
    known(level),
  ] as MonsterCatalogV2_5['records'][number]['stats'];
  const traits = [
    wireFact(monster.boss),
    wireFact(monster.undead),
    known(false),
    known(0),
    known(false),
    known(false),
    known(0),
    known(0),
    known('fixture'),
  ] as MonsterCatalogV2_5['records'][number]['traits'];
  const firstElement = monster.elements?.[0];
  const elements =
    firstElement === undefined
      ? { state: 'unknown' as const }
      : ({
          state: 'known' as const,
          items: [
            {
              code: firstElement.code,
              effect: firstElement.effect,
              meaning: known(firstElement.meaning),
              multiplier: known(firstElement.multiplier),
              resistance: known(firstElement.resistance),
            },
            ...(monster.elements?.slice(1).map((element) => ({
              code: element.code,
              effect: element.effect,
              meaning: known(element.meaning),
              multiplier: known(element.multiplier),
              resistance: known(element.resistance),
            })) ?? []),
          ],
        } as MonsterCatalogV2_5['records'][number]['elements']);

  let sprite: MonsterCatalogV2_5['records'][number]['sprite'];
  if (monster.sprite === 'unknown') {
    sprite = { state: 'unknown' };
  } else if (monster.sprite === 'absent') {
    sprite = { state: 'absent', coverageKey: 'fixture:sprite-coverage' };
  } else {
    sprite = { state: 'known', value: spriteId ?? '' };
  }
  let nativeDrops: MonsterCatalogV2_5['records'][number]['drops']['native'];
  if (build.buildId === 'gms-v83' && dropCount > 0) {
    nativeDrops = { state: 'known', count: dropCount, lowerBound: true };
  } else {
    nativeDrops = { state: 'unknown' };
  }

  return {
    key,
    publicId,
    slug,
    name:
      monster.name === undefined ? { state: 'unknown' } : known(monster.name),
    stats,
    traits,
    hpRecovery: wireFact(monster.hpRecovery ?? { state: 'unknown' }),
    mpRecovery: wireFact(monster.mpRecovery ?? { state: 'unknown' }),
    elements,
    relationships: { state: 'unknown' },
    sprite,
    drops: {
      native: nativeDrops,
      ...(build.historicalDrops === 'supported'
        ? {
            historical:
              dropCount === 0
                ? { state: 'absent' as const }
                : {
                    state: 'known' as const,
                    count: dropCount,
                    sourceBuilds: ['gms-v83'],
                  },
          }
        : {}),
    },
    locations: projectMonsterLocationSummary(monster),
  };
}

function projectMonsterLocationSummary(
  monster: FixtureMonster,
): MonsterCatalogV2_5['records'][number]['locations'] {
  const maps = monster.locations ?? [];
  const state =
    monster.locationsState ?? (maps.length > 0 ? 'known' : 'absent');
  return state === 'absent'
    ? { state }
    : {
        state,
        mapCount: maps.length,
        placementCount: maps.reduce(
          (count, map) => count + map.placementCount,
          0,
        ),
      };
}

function projectMonsterPage(
  scope: MonsterPageRecordV1_4['scope'],
  catalogRecord: MonsterCatalogV2_5['records'][number],
  entries: MonsterPageRecordV1_4['drops']['entries'],
  monster: FixtureMonster,
  itemById: ReadonlyMap<
    string,
    { readonly item: FixtureBuild['items'][number]; readonly key: string }
  >,
): MonsterPageRecordV1_4 {
  const [
    level,
    hp,
    mp,
    exp,
    paDamage,
    maDamage,
    pdDamage,
    mdDamage,
    acc,
    eva,
    pushed,
    speed,
  ] = catalogRecord.stats;
  const locationFixtures = monster.locations ?? [];
  const locationEntries: MonsterPageRecordV1_4['locations']['entries'] =
    locationFixtures.map((location: FixtureLocation) => {
      const points = location.points ?? [];
      const hasStage = location.minimapContentId !== undefined;
      let pointsState: MonsterPageRecordV1_4['locations']['entries'][number]['points']['state'];
      if (!hasStage) {
        pointsState = 'absent';
      } else if (points.length === location.placementCount) {
        pointsState = 'known';
      } else {
        pointsState = 'partial';
      }
      return {
        mapKey: location.mapKey,
        mapSourceId: location.mapKey,
        mapName:
          location.name === undefined
            ? { state: 'unknown' }
            : known(location.name),
        publicId: mapPublicId({
          sourceId: `${scope.build_id}:${location.mapKey}`,
        }),
        slug: mapSlug(location.name),
        ...(location.streetName === undefined
          ? {}
          : { streetName: location.streetName }),
        ...(location.regionKey === undefined &&
        location.regionLabel === undefined
          ? {}
          : {
              geography: {
                ...(location.regionKey === undefined
                  ? {}
                  : { regionKey: location.regionKey }),
                ...(location.regionLabel === undefined
                  ? {}
                  : { regionLabel: location.regionLabel }),
                provenance: 'reviewed-overlay' as const,
                status: 'verified' as const,
              },
            }),
        placementCount: location.placementCount,
        stage: hasStage
          ? {
              state: 'known' as const,
              value: {
                contentId: location.minimapContentId,
                width: 900,
                height: 600,
                scale: FIXTURE_STAGE_SCALE,
              },
            }
          : {
              state: 'absent' as const,
              coverageKey: `fixture:map:${location.mapKey}:stage`,
            },
        points: {
          state: pointsState,
          packedPairs: hasStage ? points.flatMap(({ x, y }) => [x, y]) : [],
        },
      };
    });
  const spriteSize =
    monster.sprite === 'unknown' || monster.sprite === 'absent'
      ? undefined
      : spriteDimensions[monster.sprite];
  locationEntries.sort(
    (left, right) =>
      right.placementCount - left.placementCount ||
      (left.mapName.state === 'known' ? left.mapName.value : '').localeCompare(
        right.mapName.state === 'known' ? right.mapName.value : '',
      ) ||
      left.mapKey.localeCompare(right.mapKey),
  );

  return {
    format: 'mapletip.monster-page',
    contractVersion: '1.4',
    scope,
    key: catalogRecord.key,
    publicId: catalogRecord.publicId,
    slug: catalogRecord.slug,
    name: catalogRecord.name,
    sprite: {
      contentId: catalogRecord.sprite,
      ...(spriteSize === undefined
        ? {}
        : { width: spriteSize[0], height: spriteSize[1] }),
    },
    boss: catalogRecord.traits[0],
    undead: catalogRecord.traits[1],
    hpRecovery: catalogRecord.hpRecovery,
    mpRecovery: catalogRecord.mpRecovery,
    elements: catalogRecord.elements,
    stats: {
      level,
      hp,
      mp,
      exp,
      paDamage,
      maDamage,
      pdDamage,
      mdDamage,
      acc,
      eva,
      pushed,
      speed,
    },
    drops: {
      // The page count includes every projected entry, including evidence kinds outside catalog summaries.
      summary: { ...catalogRecord.drops, count: entries.length },
      entries,
    },
    locations: {
      summary: catalogRecord.locations,
      entries: locationEntries,
    },
    quests: monster.quests ?? { state: 'absent', entries: [] },
    summonedByItems: (monster.summonedByItemIds ?? []).map((itemId) => {
      const target = itemById.get(itemId);
      if (target === undefined) {
        throw new Error(
          `Fixture summoned item references unknown item "${itemId}".`,
        );
      }
      return {
        itemRef:
          target.item.id === 'unresolved-token'
            ? { state: 'unresolved' as const }
            : { state: 'resolved' as const, key: target.key },
        name:
          target.item.name === undefined
            ? { state: 'unknown' as const }
            : known(target.item.name),
        icon: { state: 'unknown' as const },
      };
    }),
  };
}

type ResolvedFixtureMap = {
  readonly fixture: FixtureMap;
  readonly key: string;
  readonly publicId: string;
  readonly slug: string;
  readonly markImage: Extract<
    MapPageRecordV1_2['markImage'],
    { readonly state: 'known' | 'absent' }
  >;
  readonly stage?: Extract<
    MapPageRecordV1_2['stage'],
    { readonly state: 'known' }
  >['value'];
};

type MapReference = Extract<
  MapPageRecordV1_2['information']['returnMap'],
  { readonly state: 'known' }
>['value'];

function mapNameFact(name: string | undefined): MapPageRecordV1_2['name'] {
  return name === undefined ? { state: 'unknown' } : known(name);
}

function mapReference(map: ResolvedFixtureMap): MapReference {
  return {
    key: map.key,
    publicId: map.publicId,
    slug: map.slug,
    name: mapNameFact(map.fixture.name),
    markImage: map.markImage,
  };
}

function mapPoints(
  points: readonly FixtureMapPoint[],
  positionsPublished: boolean,
): MapPageRecordV1_2['connections']['items'][number]['points'] {
  if (!positionsPublished) return { state: 'unknown', items: [] };
  return {
    state: points.length === 0 ? 'absent' : 'known',
    items: [...points],
  };
}

async function resolveFixtureMaps(options: {
  readonly build: FixtureBuild;
  readonly maps: readonly FixtureMap[];
  readonly key: (prefix: string, id: string) => Promise<string>;
}): Promise<readonly ResolvedFixtureMap[]> {
  const { build, maps, key } = options;
  return Promise.all(
    maps.map(async (fixture): Promise<ResolvedFixtureMap> => {
      const publicId = mapPublicId({
        sourceId: `${build.buildId}:${fixture.id}`,
      });
      return {
        fixture,
        key:
          fixture.key ?? (await key('map', `${build.buildId}:${fixture.id}`)),
        publicId,
        slug: mapSlug(fixture.name),
        markImage:
          fixture.noMark === true
            ? {
                state: 'absent',
                coverageKey: `fixture:map:${fixture.id}:mark`,
              }
            : {
                state: 'known',
                value: await sha256Hex(
                  encoder.encode(
                    `fixture:map-mark:${build.buildId}:${fixture.id}`,
                  ),
                ),
              },
        ...(fixture.stage === undefined
          ? {}
          : {
              stage: {
                contentId:
                  fixture.stage.contentId ??
                  (await sha256Hex(
                    encoder.encode(
                      `fixture:map-stage:${build.buildId}:${fixture.stage.assetId}`,
                    ),
                  )),
                width: fixture.stage.width,
                height: fixture.stage.height,
                scale: FIXTURE_STAGE_SCALE,
              },
            }),
      };
    }),
  );
}

async function projectMapPages(options: {
  readonly build: FixtureBuild;
  readonly scope: MapPageRecordV1_2['scope'];
  readonly resolved: readonly ResolvedFixtureMap[];
  readonly monsters: ReadonlyMap<string, MonsterCatalogV2_5['records'][number]>;
  readonly key: (prefix: string, id: string) => Promise<string>;
}): Promise<readonly MapPageRecordV1_2[]> {
  const { build, scope, resolved, monsters, key } = options;
  const mapsBySourceId = new Map(resolved.map((map) => [map.fixture.id, map]));
  const positionsPublished = (map: FixtureMap): boolean =>
    map.stage !== undefined && map.positionsPublished !== false;

  return Promise.all(
    resolved.map(async (map): Promise<MapPageRecordV1_2> => {
      const fixture = map.fixture;
      const returnTarget = mapsBySourceId.get(fixture.returnMapId);
      if (returnTarget === undefined) {
        throw new Error(
          `Fixture Map "${fixture.id}" returns to unknown Map "${fixture.returnMapId}".`,
        );
      }
      const published = positionsPublished(fixture);
      const mapMonsters = fixture.monsters.map((placement) => {
        const record = monsters.get(placement.monsterId);
        if (record === undefined) {
          throw new Error(
            `Fixture Map "${fixture.id}" references unknown Monster "${placement.monsterId}".`,
          );
        }
        const level = record.stats[0];
        const boss = record.traits[0];
        if (level === undefined || boss === undefined) {
          throw new Error(
            `Fixture Monster "${placement.monsterId}" has no level or boss fact.`,
          );
        }
        if (placement.points.length === 0) {
          throw new Error(
            `Fixture Monster "${placement.monsterId}" needs a placement.`,
          );
        }
        return {
          key: record.key,
          publicId: record.publicId,
          slug: record.slug,
          name: record.name,
          level,
          boss,
          sprite: { contentId: record.sprite },
          placementCount: placement.points.length,
          points: mapPoints(placement.points, published),
          respawn: placement.respawn ?? { kind: 'ordinary' },
          focusToken: fixturePublicId(
            `map-focus:${fixture.id}:monster:${placement.monsterId}`,
          ),
        } satisfies MapPageRecordV1_2['monsters']['items'][number];
      });
      const mapNpcs = await Promise.all(
        fixture.npcs.map(
          async (npc) =>
            ({
              key: await key('npc', `${build.buildId}:${fixture.id}:${npc.id}`),
              name: known(npc.name),
              sprite: {
                contentId:
                  npc.sprite === undefined
                    ? { state: 'unknown' as const }
                    : known(
                        await sha256Hex(
                          encoder.encode(`fixture:sprite:${npc.sprite}`),
                        ),
                      ),
                // Dimensions are published exactly when the sprite is known.
                ...(npc.sprite === undefined
                  ? {}
                  : {
                      width: spriteDimensions[npc.sprite][0],
                      height: spriteDimensions[npc.sprite][1],
                    }),
              },
              questCount: npc.questCount ?? { state: 'known', count: 0 },
              points: mapPoints(npc.points, published),
              focusToken: fixturePublicId(
                `map-focus:${fixture.id}:npc:${npc.id}`,
              ),
            }) satisfies MapPageRecordV1_2['npcs']['items'][number],
        ),
      );
      const connections = fixture.connections.map((connection) => {
        const target = mapsBySourceId.get(connection.mapId);
        if (target === undefined) {
          throw new Error(
            `Fixture Map "${fixture.id}" connects to unknown Map "${connection.mapId}".`,
          );
        }
        return {
          key: target.key,
          publicId: target.publicId,
          slug: target.slug,
          name: mapNameFact(target.fixture.name),
          markImage: target.markImage,
          minimap:
            target.stage === undefined
              ? {
                  state: 'absent' as const,
                  coverageKey: `fixture:map:${target.fixture.id}:minimap`,
                }
              : { state: 'known' as const, value: target.stage.contentId },
          monsterCount: target.fixture.monsters.length,
          npcCount: target.fixture.npcs.length,
          points: mapPoints(connection.points, published),
          focusToken: fixturePublicId(
            `map-focus:${fixture.id}:connection:${connection.mapId}`,
          ),
        } satisfies MapPageRecordV1_2['connections']['items'][number];
      });

      return {
        format: 'mapletip.map-page',
        contractVersion: '1.2',
        scope,
        key: map.key,
        publicId: map.publicId,
        slug: map.slug,
        name: mapNameFact(fixture.name),
        streetName:
          fixture.streetName === undefined
            ? { state: 'unknown' }
            : known(fixture.streetName),
        activity:
          fixture.activity === undefined
            ? { state: 'unknown' }
            : known(fixture.activity),
        description:
          fixture.description === undefined
            ? { state: 'unknown' }
            : known(fixture.description),
        markImage: map.markImage,
        ...(fixture.geography === undefined
          ? {}
          : {
              geography: {
                ...fixture.geography,
                provenance: 'reviewed-overlay' as const,
                status: 'verified' as const,
              },
            }),
        information: {
          flying: fixture.information?.flying ?? { state: 'unknown' },
          forcedReturnMap: { state: 'unknown' },
          hpDrain: { state: 'unknown' },
          hpDrainProtectionItem: { state: 'unknown' },
          levelLimit: { state: 'unknown' },
          music: fixture.information?.music ?? { state: 'unknown' },
          returnMap: { state: 'known', value: mapReference(returnTarget) },
          swimming: fixture.information?.swimming ?? { state: 'unknown' },
          timeLimitSeconds: fixture.information?.timeLimitSeconds ?? {
            state: 'unknown',
          },
        },
        stage:
          map.stage === undefined
            ? {
                state: 'absent',
                coverageKey: `fixture:map:${fixture.id}:stage`,
              }
            : { state: 'known', value: map.stage },
        monsters: {
          state: mapMonsters.length === 0 ? 'absent' : 'known',
          items: mapMonsters,
        },
        npcs: {
          state: mapNpcs.length === 0 ? 'absent' : 'known',
          items: mapNpcs,
        },
        connections: {
          state: connections.length === 0 ? 'absent' : 'known',
          items: connections,
        },
        warps: {
          state:
            fixture.warps === undefined || fixture.warps.length === 0
              ? 'absent'
              : 'known',
          items: (fixture.warps ?? []).map((warp, index) => ({
            ends: [...warp.ends],
            focusToken: fixturePublicId(
              `map-focus:${fixture.id}:warp:${index}`,
            ),
          })),
        },
      } satisfies MapPageRecordV1_2;
    }),
  );
}

interface MapBrowseArtifacts {
  readonly rows: MapBrowseV1_1;
  readonly roster: MapBrowseRosterV1_1;
  readonly geography: MapGeographyModelV1_1;
}

function absentFact(coverageKey: string): {
  readonly state: 'absent';
  readonly coverageKey: string;
} {
  return { state: 'absent', coverageKey };
}

function countFact(count: number): MapBrowseRowV1_1['monsterCount'] {
  return known(count);
}

type GeographyRegion = MapGeographyModelV1_1['regions'][number];

/** Regions, areas and collections before each area's mark is resolved. */
interface UnmarkedGeography {
  readonly regions: readonly (Omit<GeographyRegion, 'areas'> & {
    readonly areas: readonly Omit<GeographyRegion['areas'][number], 'mark'>[];
  })[];
  readonly collections: MapGeographyModelV1_1['collections'];
}

/** Group fixture geography into the model's regions, areas and collections. */
function projectGeography(maps: readonly FixtureMap[]): UnmarkedGeography {
  const regions = new Map<
    string,
    {
      label: string;
      mapCount: number;
      areas: Map<string, { label: string; mapCount: number }>;
    }
  >();
  const collections = new Map<string, { label: string; mapCount: number }>();
  for (const { geography } of maps) {
    if (geography?.regionKey !== undefined) {
      const region = regions.get(geography.regionKey) ?? {
        label: geography.regionLabel ?? geography.regionKey,
        mapCount: 0,
        areas: new Map<string, { label: string; mapCount: number }>(),
      };
      region.mapCount += 1;
      if (geography.areaKey !== undefined) {
        const area = region.areas.get(geography.areaKey) ?? {
          label: geography.areaLabel ?? geography.areaKey,
          mapCount: 0,
        };
        area.mapCount += 1;
        region.areas.set(geography.areaKey, area);
      }
      regions.set(geography.regionKey, region);
    } else if (geography?.collectionKey !== undefined) {
      const collection = collections.get(geography.collectionKey) ?? {
        label: geography.collectionLabel ?? geography.collectionKey,
        mapCount: 0,
      };
      collection.mapCount += 1;
      collections.set(geography.collectionKey, collection);
    }
  }
  return {
    regions: [...regions].map(([key, region]) => ({
      key,
      label: region.label,
      mapCount: region.mapCount,
      areas: [...region.areas].map(([areaKey, area]) => ({
        key: areaKey,
        ...area,
      })),
    })),
    collections: [...collections].map(([key, collection]) => ({
      key,
      ...collection,
    })),
  };
}

/** Map browse rows, population roster and geography for one fixture build. */
/** Every fixture area has a published mark image, keyed by build and area. */
async function withAreaMarks(
  build: FixtureBuild,
  geography: UnmarkedGeography,
): Promise<Pick<MapGeographyModelV1_1, 'regions' | 'collections'>> {
  return {
    collections: geography.collections,
    regions: await Promise.all(
      geography.regions.map(async (region) => ({
        ...region,
        areas: await Promise.all(
          region.areas.map(async (area) => ({
            ...area,
            mark: known(
              await sha256Hex(
                encoder.encode(
                  `fixture:area-mark:${build.buildId}:${area.key}`,
                ),
              ),
            ),
          })),
        ),
      })),
    ),
  };
}

async function projectMapBrowse(options: {
  readonly build: FixtureBuild;
  readonly scope: MapPageRecordV1_2['scope'];
  readonly resolved: readonly ResolvedFixtureMap[];
  readonly monsters: ReadonlyMap<string, MonsterCatalogV2_5['records'][number]>;
  readonly key: (prefix: string, id: string) => Promise<string>;
}): Promise<MapBrowseArtifacts> {
  const { build, scope, resolved, monsters, key } = options;
  const rosterMonsters: MapBrowseRosterV1_1['monsters'] = [];
  const monsterIndex = new Map<string, number>();
  const rosterNpcs: MapBrowseRosterV1_1['npcs'] = [];
  const records: MapBrowseRosterV1_1['records'] = {};

  const ordered = [...resolved].sort((left, right) =>
    left.key.localeCompare(right.key),
  );
  for (const map of ordered) {
    const fixture = map.fixture;
    const entries = fixture.monsters.map((placement) => {
      const record = monsters.get(placement.monsterId);
      if (record === undefined) {
        throw new Error(
          `Fixture Map "${fixture.id}" references unknown Monster "${placement.monsterId}".`,
        );
      }
      let index = monsterIndex.get(record.key);
      if (index === undefined) {
        index = rosterMonsters.length;
        monsterIndex.set(record.key, index);
        rosterMonsters.push({
          key: record.key,
          publicId: record.publicId,
          slug: record.slug,
          name: record.name,
          level: record.stats[0] ?? { state: 'unknown' },
          sprite: record.sprite,
          boss: record.traits[0],
        });
      }
      return { monster: index, spawnPointCount: placement.points.length };
    });
    const npcEntries = await Promise.all(
      fixture.npcs.map(
        async (npc): Promise<MapBrowseRosterV1_1['npcs'][number]> => ({
          key: await key('npc', `${build.buildId}:${fixture.id}:${npc.id}`),
          name: known(npc.name),
          sprite:
            npc.sprite === undefined
              ? { state: 'unknown' }
              : known(
                  await sha256Hex(
                    encoder.encode(`fixture:sprite:${npc.sprite}`),
                  ),
                ),
        }),
      ),
    );
    const npcs = npcEntries.map((entry) => rosterNpcs.push(entry) - 1);
    records[map.key] = { monsters: entries, npcs };
  }

  const rows = ordered.map((map): MapBrowseRowV1_1 => {
    const fixture = map.fixture;
    const coverage = `fixture:map:${fixture.id}`;
    const geography = fixture.geography;
    const player = fixture.player ?? {};
    const fact = <T>(name: string, value: T | undefined) =>
      value === undefined ? absentFact(`${coverage}:${name}`) : known(value);
    return {
      key: map.key,
      publicId: map.publicId,
      slug: map.slug,
      name:
        fixture.name === undefined ? { state: 'unknown' } : known(fixture.name),
      streetName:
        fixture.streetName === undefined
          ? { state: 'unknown' }
          : known(fixture.streetName),
      geography:
        geography === undefined
          ? { provenance: 'none' }
          : {
              ...geography,
              provenance:
                fixture.placement === undefined
                  ? 'source-map-mark'
                  : 'reviewed-overlay',
              status: 'verified',
            },
      activity:
        fixture.activity === undefined
          ? absentFact(`${coverage}:activity`)
          : known(fixture.activity),
      minimap:
        map.stage === undefined
          ? absentFact(`${coverage}:minimap`)
          : known(map.stage.contentId),
      monsterCount: countFact(fixture.monsters.length),
      spawnPointCount: countFact(
        fixture.monsters.reduce(
          (total, placement) => total + placement.points.length,
          0,
        ),
      ),
      npcCount: countFact(fixture.npcs.length),
      markImage: map.markImage,
      music: fixture.information?.music ?? absentFact(`${coverage}:music`),
      entryLevel: fact('entry-level', player.entryLevel),
      levelCap: fact('level-cap', player.levelCap),
      hpDrain: fact('hp-drain', player.hpDrain?.amount),
      hpDrainProtectionItem: fact(
        'hp-drain-protection',
        player.hpDrain?.protectionItem,
      ),
      underwater: fact('underwater', player.underwater),
      timeLimitSeconds: fact('time-limit', player.timeLimitSeconds),
      partyOnly: fact('party-only', player.partyOnly),
      town:
        player.town === undefined ? { state: 'unknown' } : known(player.town),
      restrictions: fact(
        'restrictions',
        player.restrictions === undefined
          ? undefined
          : [...player.restrictions],
      ),
    };
  });

  return {
    rows: {
      format: 'mapletip.map-browse',
      contractVersion: '1.1',
      scope,
      records: rows,
    },
    roster: {
      format: 'mapletip.map-browse-roster',
      contractVersion: '1.1',
      scope,
      monsters: rosterMonsters,
      npcs: rosterNpcs,
      records,
    },
    geography: {
      format: 'mapletip.map-geography',
      contractVersion: '1.1',
      scope,
      ...(await withAreaMarks(
        build,
        projectGeography(ordered.map(({ fixture }) => fixture)),
      )),
      placements: ordered.flatMap(({ fixture, key: mapKey }) =>
        fixture.placement === undefined
          ? []
          : [
              {
                mapKey,
                classification: fixture.placement.classification,
                activity: fixture.activity ?? null,
                rationale: 'Synthetic fixture review.',
                reviewId: `fixture:${fixture.id}`,
                reviewedStreetName: fixture.streetName ?? '',
                sourceMapId: fixture.id,
                status: 'verified' as const,
              },
            ],
      ),
    },
  };
}

interface BuildMapProductOptions {
  readonly build: FixtureBuild;
  readonly scope: MapPageRecordV1_2['scope'];
  readonly maps: readonly FixtureMap[];
  readonly monsters: ReadonlyMap<string, MonsterCatalogV2_5['records'][number]>;
  readonly key: (prefix: string, id: string) => Promise<string>;
  readonly put: (dir: string, value: unknown) => Promise<FileDescriptor>;
  readonly minimapIds: Set<string>;
  readonly markIds: Set<string>;
}

interface BuiltMapProduct {
  readonly pagePack: FileDescriptor;
  readonly browseRows: FileDescriptor;
  readonly productManifest: FileDescriptor;
  readonly productDescriptor: Record<string, unknown>;
}

async function buildMapProduct(
  options: BuildMapProductOptions,
): Promise<BuiltMapProduct> {
  const { build, scope, maps, monsters, key, put, minimapIds, markIds } =
    options;
  const resolved = await resolveFixtureMaps({ build, maps, key });
  const mapPages = [
    ...(await projectMapPages({ build, scope, resolved, monsters, key })),
  ].sort((left, right) => left.publicId.localeCompare(right.publicId));
  const mapPagePackRange: RangeDescriptor = {
    count: mapPages.length,
    firstKey: mapPages[0]?.publicId ?? '',
    lastKey: mapPages.at(-1)?.publicId ?? '',
  };
  const pagePack = await put('v2/maps/page-packs', {
    format: 'mapletip.map-page-pack',
    contractVersion: '1.2',
    recordKind: 'map-page',
    scope,
    records: Object.fromEntries(mapPages.map((page) => [page.publicId, page])),
  } satisfies MapPagePackV1_2);
  for (const page of mapPages) {
    if (page.stage.state === 'known') {
      minimapIds.add(page.stage.value.contentId);
    }
    if (page.markImage.state === 'known') markIds.add(page.markImage.value);
  }

  // getMapPage reads the manifest and page pack; the Maps catalog is required by
  // the product-manifest schema but its records are not used for page lookup.
  const mapCatalog = await put('v2/catalogs', {
    format: 'mapletip.domain-catalog/1',
    contractVersion: '2.1',
    scope,
    domain: 'maps',
    coverage: 'partial',
    recordCount: 0,
    records: [],
  });
  const mapCatalogRange: RangeDescriptor = {
    count: 0,
    firstKey: '',
    lastKey: '',
  };
  const browse = await projectMapBrowse({
    build,
    scope,
    resolved,
    monsters,
    key,
  });
  for (const region of browse.geography.regions) {
    for (const area of region.areas) {
      if (area.mark.state === 'known') markIds.add(area.mark.value);
    }
  }
  const rows = await put('v2/maps/browse', browse.rows);
  const roster = await put('v2/maps/browse-rosters', browse.roster);
  const geography = await put('v2/maps/geography', browse.geography);
  const rowKeys = browse.rows.records.map((row) => row.key);
  const rosterKeys = Object.keys(browse.roster.records);
  const mapCapabilities = [
    'evidence-pages-v2',
    'map-browse-v1',
    'map-geography-v1',
    'map-page-v1',
    'maps-v1',
    'wire-2.0',
  ];
  const mapProductId = `maps-${ZERO}`;
  const productManifest = await put('v2/products', {
    format: 'mapletip.product-manifest',
    contractVersion: '2.0',
    scope,
    productId: 'maps',
    coverage: 'partial',
    identity: {
      identityFormat: 'mapletip-product-id-v2',
      productId: mapProductId,
      inputFingerprint: ZERO,
      semanticFingerprint: ZERO,
      schemaFingerprint: ZERO,
      producerFingerprint: ZERO,
      optionsFingerprint: ZERO,
      projectionRevision: 'fixture',
      productDigest: ZERO,
    },
    requiredClientCapabilities: mapCapabilities,
    packingPolicy: { targetBytes: 524288, maxBytes: 1048576 },
    catalog: { ...mapCatalog, ...mapCatalogRange },
    detailPacks: [],
    pagePacks: [{ ...pagePack, ...mapPagePackRange }],
    relationshipPacks: [],
    totalEntityCount: mapPages.length,
    geography,
    mapBrowse: {
      rows: {
        ...rows,
        count: rowKeys.length,
        firstKey: rowKeys[0] ?? '',
        lastKey: rowKeys.at(-1) ?? '',
      },
      roster: {
        ...roster,
        count: rosterKeys.length,
        firstKey: rosterKeys[0] ?? '',
        lastKey: rosterKeys.at(-1) ?? '',
      },
    },
  });
  return {
    pagePack,
    browseRows: rows,
    productManifest,
    productDescriptor: {
      productId: mapProductId,
      familyId: build.familyId,
      buildId: build.buildId,
      productDigest: ZERO,
      contractVersion: '2.0',
      schemaSha256: ZERO,
      coverage: 'partial',
      completionClass: 'local-diagnostic',
      requiredClientCapabilities: mapCapabilities,
      productManifest,
      productAlias: productManifest,
      catalog: mapCatalog,
      catalogAlias: mapCatalog,
    },
  };
}

type FixtureItemRelationshipKind = keyof ItemBrowseCoverage['relationships'];
interface FixtureItemBrowsePackV2_2 {
  readonly format: 'item-browse-pack/1';
  readonly contractVersion: '2.2';
  readonly scope: MonsterPageRecordV1_4['scope'];
  readonly coverage: ItemBrowseCoverage;
  readonly records: Record<string, ItemBrowseRecordV2_2 | undefined>;
  readonly scrollTargetIcons: Readonly<Record<string, string>>;
}

type ItemQuestBrowsePack = Extract<
  ItemRelatedEntityBrowsePack,
  { readonly relationshipKind: 'needed-for-quest' }
>;
type ItemQuestRewardBrowsePack = Extract<
  ItemRelatedEntityBrowsePack,
  { readonly relationshipKind: 'quest-reward' }
>;
type ItemRecipeBrowsePack = Extract<
  ItemRelatedEntityBrowsePack,
  { readonly relationshipKind: 'used-in-recipe' }
>;
type ItemMadeByRecipeBrowsePack = Extract<
  ItemRelatedEntityBrowsePack,
  { readonly relationshipKind: 'made-by-recipe' }
>;
type ItemContainerBrowsePack = Extract<
  ItemRelatedEntityBrowsePack,
  { readonly relationshipKind: 'found-in-container' }
>;
type ItemCashShopBrowsePack = Extract<
  ItemRelatedEntityBrowsePack,
  { readonly relationshipKind: 'cash-shop-listing' }
>;
type ItemMonsterDropBrowsePack = Extract<
  ItemRelatedEntityBrowsePack,
  { readonly relationshipKind: 'monster-drop' }
>;

interface BuiltItemProduct {
  readonly catalog: FileDescriptor;
  readonly browse: FileDescriptor;
  readonly descriptions: FileDescriptor;
  readonly relatedEntityBrowse: Readonly<Record<string, FileDescriptor>>;
  readonly productManifest: FileDescriptor;
  readonly productDescriptor: Record<string, unknown>;
}

interface BuildItemProductOptions {
  readonly build: FixtureBuild;
  readonly scope: MonsterPageRecordV1_4['scope'];
  readonly itemById: ReadonlyMap<
    string,
    { readonly item: FixtureItem; readonly key: string }
  >;
  readonly monsters: readonly {
    readonly monster: FixtureMonster;
    readonly key: string;
    readonly publicId: string;
    readonly spriteId?: string;
  }[];
  readonly monsterRecords: ReadonlyMap<
    string,
    MonsterCatalogV2_5['records'][number]
  >;
  readonly key: (prefix: string, id: string) => Promise<string>;
  readonly put: (dir: string, value: unknown) => Promise<FileDescriptor>;
  readonly spriteIds: Map<string, string>;
}

function rangeForKeys(keys: readonly string[]): RangeDescriptor {
  return {
    count: keys.length,
    firstKey: keys[0] ?? '',
    lastKey: keys.at(-1) ?? '',
  };
}

function itemRelationshipCounts(options: {
  readonly itemId: string;
  readonly build: FixtureBuild;
  readonly monstersByItem: ReadonlyMap<string, ReadonlySet<string>>;
}): ItemBrowseRecordV2_2['relationships'] {
  const { itemId, build, monstersByItem } = options;
  const neededQuestIds = new Set<string>();
  const notEstablishedQuestIds = new Set<string>();
  const rewardQuestIds = new Set<string>();
  const item = build.items.find((candidate) => candidate.id === itemId);
  for (const use of item?.questUses ?? []) {
    if (
      use.roles.some(({ role }) =>
        ['turned-in', 'held-to-complete', 'held-to-start'].includes(role),
      )
    ) {
      neededQuestIds.add(use.quest.id);
    }
    if (use.roles.some(({ role }) => role === 'not-established')) {
      notEstablishedQuestIds.add(use.quest.id);
    }
  }
  for (const quest of item?.questRewards ?? []) rewardQuestIds.add(quest.id);

  const usedRecipeIds = new Set<string>();
  const madeRecipeIds = new Set<string>();
  for (const recipe of build.recipes) {
    if (
      recipe.ingredients.some(
        ({ itemId: ingredientId }) => ingredientId === itemId,
      )
    ) {
      usedRecipeIds.add(recipe.id);
    }
    if (recipe.products.some(({ itemId: productId }) => productId === itemId)) {
      madeRecipeIds.add(recipe.id);
    }
  }
  const containerCount = build.containers.filter(({ itemIds }) =>
    itemIds.includes(itemId),
  ).length;
  const cashShopListingCount = build.cashShopListings.filter(({ itemIds }) =>
    itemIds.includes(itemId),
  ).length;
  const counts: NonNullable<ItemBrowseRecordV2_2['relationships']> = {};
  const setPositive = (
    key: FixtureItemRelationshipKind | 'needed-for-quest-not-established',
    value: number,
  ) => {
    if (value > 0) counts[key] = value;
  };
  setPositive('needed-for-quest', neededQuestIds.size);
  setPositive('needed-for-quest-not-established', notEstablishedQuestIds.size);
  setPositive('quest-reward', rewardQuestIds.size);
  setPositive('used-in-recipe', usedRecipeIds.size);
  setPositive('made-by-recipe', madeRecipeIds.size);
  setPositive('found-in-container', containerCount);
  setPositive('cash-shop-listing', cashShopListingCount);
  if (
    build.itemBrowseCoverage.relationships['monster-drop'] !== 'unsupported'
  ) {
    setPositive('monster-drop', monstersByItem.get(itemId)?.size ?? 0);
  }
  return Object.keys(counts).length === 0 ? undefined : counts;
}

async function buildItemProduct(
  options: BuildItemProductOptions,
): Promise<BuiltItemProduct> {
  const {
    build,
    scope,
    itemById,
    monsters,
    monsterRecords,
    key,
    put,
    spriteIds,
  } = options;
  const sortedItems = [...itemById.values()].sort((left, right) =>
    left.key.localeCompare(right.key),
  );
  const browseItems = sortedItems.filter(
    ({ item }) =>
      item.category.kind === 'item-class' &&
      item.itemClass.state === 'known' &&
      item.name !== undefined,
  );
  const monstersByItem = new Map<string, Set<string>>();
  for (const monster of build.monsters) {
    for (const drop of build.drops[monster.id] ?? []) {
      const sources = monstersByItem.get(drop.itemId) ?? new Set<string>();
      sources.add(monster.id);
      monstersByItem.set(drop.itemId, sources);
    }
  }

  const spriteIdsByCase = new Map<string, string>();
  const spriteIdForCase = async (spriteCase: SpriteCase): Promise<string> => {
    const existing = spriteIdsByCase.get(spriteCase);
    if (existing !== undefined) return existing;
    const contentId = await sha256Hex(
      encoder.encode(`fixture:sprite:${spriteCase}`),
    );
    spriteIdsByCase.set(spriteCase, contentId);
    spriteIds.set(contentId, spriteCase);
    return contentId;
  };
  const scrollLabels = [
    ...new Set(
      browseItems.flatMap(({ item }) =>
        item.scroll?.targetLabel ? [item.scroll.targetLabel] : [],
      ),
    ),
  ].sort();
  const scrollTargetIcons = Object.fromEntries(
    await Promise.all(
      scrollLabels.map(async (label) => {
        const contentId = await sha256Hex(
          encoder.encode(`fixture:sprite:scroll-target:${label}`),
        );
        spriteIds.set(contentId, 'exact');
        return [label, contentId] as const;
      }),
    ),
  );

  const browseRows = await Promise.all(
    browseItems.map(async ({ item, key: itemKey }) => {
      if (item.itemClass.state !== 'known') {
        throw new Error(`Fixture Item "${item.id}" has no known class.`);
      }
      const publicId = fixturePublicId(`item:${build.buildId}:${item.id}`);
      const sprite = item.sprite ?? 'unknown';
      let icon: ItemBrowseRecordV2_2['icon'];
      if (sprite === 'unknown') {
        icon = { state: 'unknown' };
      } else if (sprite === 'absent') {
        icon = {
          state: 'absent',
          coverageKey: `fixture:item:${item.id}:icon`,
        };
      } else {
        icon = { state: 'known', value: await spriteIdForCase(sprite) };
      }
      const sellPrice =
        item.sellPrice?.state === 'known' ? item.sellPrice.value : undefined;
      const projectileAttack =
        item.projectileAttack?.state === 'known'
          ? item.projectileAttack.value
          : undefined;
      const scroll = item.scroll ? { ...item.scroll } : undefined;
      const slugParts = item.name?.toLowerCase().match(/[a-z0-9]+/gu);
      const relationships = itemRelationshipCounts({
        itemId: item.id,
        build,
        monstersByItem,
      });
      const record: ItemBrowseRecordV2_2 = {
        publicId,
        slug:
          slugParts && slugParts.length > 0
            ? slugParts.join('-')
            : `item-${publicId}`,
        sourceId: item.id,
        name: item.name === undefined ? { state: 'unknown' } : known(item.name),
        itemClass: item.itemClass.value,
        icon,
        ...(item.types && item.types.length > 0
          ? { types: [...item.types] }
          : {}),
        ...(item.functions && item.functions.length > 0
          ? { functions: [...item.functions] }
          : {}),
        ...(item.family === undefined ? {} : { family: item.family }),
        ...(item.recovery === undefined ? {} : { recovery: item.recovery }),
        ...(item.seatingRecovery === undefined
          ? {}
          : { seatingRecovery: item.seatingRecovery }),
        ...(item.buff === undefined ? {} : { buff: item.buff }),
        ...(item.petFood === undefined ? {} : { petFood: item.petFood }),
        ...(projectileAttack === undefined ? {} : { projectileAttack }),
        ...(item.maxStack === undefined ? {} : { maxStack: item.maxStack }),
        ...(scroll === undefined ? {} : { scroll }),
        ...(sellPrice === undefined ? {} : { sellPrice }),
        ...(item.cashShopSale === undefined
          ? {}
          : { cashShopSale: item.cashShopSale }),
        ...(item.questFlag === undefined ? {} : { questFlag: item.questFlag }),
        ...(relationships === undefined ? {} : { relationships }),
      };
      return [itemKey, record] as const;
    }),
  );
  const browseRecords = Object.fromEntries(browseRows);
  const browseKeys = browseRows.map(([recordKey]) => recordKey);
  const browsePack = await put('v2/items/browse', {
    format: 'item-browse-pack/1',
    contractVersion: '2.2',
    scope,
    coverage: build.itemBrowseCoverage,
    records: browseRecords,
    scrollTargetIcons,
  } satisfies FixtureItemBrowsePackV2_2);

  const descriptionEntries = sortedItems.flatMap(({ item, key: itemKey }) =>
    item.description === undefined
      ? []
      : [[itemKey, item.description] as const],
  );
  const descriptions = await put('v2/items/descriptions', {
    format: 'item-description-pack/1',
    contractVersion: '1.0',
    scope,
    records: Object.fromEntries(descriptionEntries),
  });
  const descriptionRange = rangeForKeys(
    descriptionEntries.map(([descriptionKey]) => descriptionKey),
  );

  const questById = new Map<string, FixtureQuest>();
  for (const { item } of sortedItems) {
    for (const quest of [
      ...(item.questRewards ?? []),
      ...(item.questUses ?? []).map(({ quest: usedQuest }) => usedQuest),
    ]) {
      const existing = questById.get(quest.id);
      if (existing !== undefined && existing.name !== quest.name) {
        throw new Error(`Fixture Quest "${quest.id}" has conflicting names.`);
      }
      questById.set(quest.id, quest);
    }
  }
  const quests = [...questById.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const questTargets = quests.map((quest) => ({
    key: `quest-${quest.id}`,
    publicId: fixturePublicId(`quest:${quest.id}`),
    displayName: quest.name,
    recurrence: { state: 'unknown' as const },
    startLevel:
      quest.startLevel === undefined
        ? { state: 'unknown' as const }
        : known(quest.startLevel),
    startNpc: { state: 'unknown' as const },
  }));
  const questIndexById = new Map(
    quests.map((quest, index) => [quest.id, index] as const),
  );
  const neededQuestRecords: ItemQuestBrowsePack['records'] = {};
  const rewardRecords: ItemQuestRewardBrowsePack['records'] = {};
  for (const { item, key: itemKey } of sortedItems) {
    const groupedRoles = new Map<string, Map<string, number | undefined>>();
    for (const use of item.questUses ?? []) {
      const roles =
        groupedRoles.get(use.quest.id) ?? new Map<string, number | undefined>();
      for (const { role, amount } of use.roles) roles.set(role, amount);
      groupedRoles.set(use.quest.id, roles);
    }
    const needEdges = [...groupedRoles.entries()].flatMap(
      ([questId, roles]) => {
        const target = questIndexById.get(questId);
        if (target === undefined) return [];
        return [
          {
            target,
            roles: [...roles.entries()].map(([role, amount]) => ({
              role: role as FixtureItemQuestUse['roles'][number]['role'],
              ...(amount === undefined ? {} : { amount }),
            })) as NonNullable<
              ItemQuestBrowsePack['records'][string]
            >[number]['roles'],
          },
        ];
      },
    );
    if (needEdges.length > 0) neededQuestRecords[itemKey] = needEdges;
    const rewardIndices = [
      ...new Set(
        (item.questRewards ?? []).flatMap((quest) => {
          const target = questIndexById.get(quest.id);
          return target === undefined ? [] : [target];
        }),
      ),
    ];
    if (rewardIndices.length > 0) rewardRecords[itemKey] = rewardIndices;
  }
  const recipes = [...build.recipes].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const recipeKeys = await Promise.all(
    recipes.map(({ id }) => key('recipe', `${build.buildId}:${id}`)),
  );
  const recipeTargets = recipes.map((recipe, index) => {
    let fee: ItemRecipeBrowsePack['targets'][number]['fee'];
    switch (recipe.fee.state) {
      case 'known':
        fee = known(recipe.fee.value);
        break;
      case 'absent':
        fee = { state: 'absent', coverageKey: recipe.fee.coverageKey };
        break;
      case 'unknown':
      case 'unsupported':
        fee = { state: recipe.fee.state };
        break;
    }
    return {
      key: recipeKeys[index] ?? '',
      fee,
      products: recipe.products.map((product) => {
        const productKey = product.itemId
          ? itemById.get(product.itemId)?.key
          : undefined;
        return {
          name: known(product.name),
          outcome: product.outcome,
          ...(productKey === undefined
            ? {}
            : { key: productKey, kind: 'item' as const }),
        };
      }) as ItemRecipeBrowsePack['targets'][number]['products'],
    };
  });
  const recipeIndexById = new Map(
    recipes.map((recipe, index) => [recipe.id, index] as const),
  );
  const usedRecipeRecords: ItemRecipeBrowsePack['records'] = {};
  const madeRecipeRecords: ItemMadeByRecipeBrowsePack['records'] = {};
  for (const { item, key: itemKey } of sortedItems) {
    const usedEdges = recipes.flatMap((recipe) => {
      const target = recipeIndexById.get(recipe.id);
      if (target === undefined) return [];
      return recipe.ingredients.flatMap((ingredient) =>
        ingredient.itemId === item.id
          ? [{ target, amount: ingredient.amount }]
          : [],
      );
    });
    if (usedEdges.length > 0) usedRecipeRecords[itemKey] = usedEdges;
    const madeTargets = recipes.flatMap((recipe) => {
      const target = recipeIndexById.get(recipe.id);
      if (target === undefined) return [];
      return recipe.products.some(({ itemId }) => itemId === item.id)
        ? [target]
        : [];
    });
    if (madeTargets.length > 0) madeRecipeRecords[itemKey] = madeTargets;
  }
  const containerTargets = await Promise.all(
    build.containers.map(async ({ id, name }) => ({
      key: await key('container', `${build.buildId}:${id}`),
      displayName: name,
    })),
  );
  const containerRecords: ItemContainerBrowsePack['records'] = {};
  for (const { item, key: itemKey } of sortedItems) {
    const indices = build.containers.flatMap((container, index) =>
      container.itemIds.includes(item.id) ? [index] : [],
    );
    if (indices.length > 0) containerRecords[itemKey] = indices;
  }
  const cashShopTargets = await Promise.all(
    build.cashShopListings.map(async ({ id, name }) => ({
      key: await key('cash-shop-listing', `${build.buildId}:${id}`),
      displayName: name,
    })),
  );
  const cashShopRecords: ItemCashShopBrowsePack['records'] = {};
  for (const { item, key: itemKey } of sortedItems) {
    const indices = build.cashShopListings.flatMap((listing, index) =>
      listing.itemIds.includes(item.id) ? [index] : [],
    );
    if (indices.length > 0) cashShopRecords[itemKey] = indices;
  }
  const monsterTargets = monsters.flatMap(
    ({ monster, key: monsterKey, publicId }) => {
      const record = monsterRecords.get(monster.id);
      return record === undefined
        ? []
        : [
            {
              key: monsterKey,
              publicId,
              ...(monster.name === undefined
                ? {}
                : { displayName: monster.name }),
              level: known(monster.level),
              sprite: record.sprite,
            },
          ];
    },
  );
  const monsterIndexById = new Map(
    monsters.map(({ monster }, index) => [monster.id, index] as const),
  );
  const evidenceKinds: ItemMonsterDropBrowsePack['evidence']['evidenceKinds'] =
    [];
  const kindKeys = new Set<string>();
  const evidenceSources: ItemMonsterDropBrowsePack['evidence']['evidenceSources'] =
    [];
  const monsterDropRecords: ItemMonsterDropBrowsePack['records'] = {};
  for (const monster of build.monsters) {
    const target = monsterIndexById.get(monster.id);
    if (target === undefined) continue;
    for (const drop of build.drops[monster.id] ?? []) {
      const itemTarget = itemById.get(drop.itemId);
      if (itemTarget === undefined) {
        throw new Error(
          `Fixture drop references unknown item "${drop.itemId}".`,
        );
      }
      const edges = monsterDropRecords[itemTarget.key] ?? [];
      const evidence = drop.evidence.map((entry) => {
        kindKeys.add(entry.kind);
        const source = evidenceSources.length;
        evidenceSources.push({
          kind: entry.kind,
          build: entry.build,
          ...(entry.date === undefined ? {} : { date: entry.date }),
          ...(entry.url === undefined ? {} : { url: entry.url }),
        });
        return {
          source,
          ...(entry.startSeconds === undefined
            ? {}
            : { startSeconds: entry.startSeconds }),
        };
      });
      monsterDropRecords[itemTarget.key] = [
        ...edges,
        {
          target,
          evidence: evidence as NonNullable<
            ItemMonsterDropBrowsePack['records'][string]
          >[number]['evidence'],
        },
      ];
    }
  }
  for (const [kind, { label }] of Object.entries(FIXTURE_EVIDENCE_KINDS)) {
    if (kindKeys.has(kind)) evidenceKinds.push({ key: kind, label });
  }
  const relatedEntityPacks: {
    readonly kind: FixtureItemRelationshipKind;
    readonly pack: ItemRelatedEntityBrowsePack;
    readonly keys: readonly string[];
  }[] = [
    {
      kind: 'cash-shop-listing',
      pack: {
        format: 'item-related-entity-browse/1',
        contractVersion: '2.0',
        scope,
        relationshipKind: 'cash-shop-listing',
        records: cashShopRecords,
        targets: cashShopTargets,
      } satisfies ItemCashShopBrowsePack,
      keys: Object.keys(cashShopRecords).sort(),
    },
    {
      kind: 'found-in-container',
      pack: {
        format: 'item-related-entity-browse/1',
        contractVersion: '2.0',
        scope,
        relationshipKind: 'found-in-container',
        records: containerRecords,
        targets: containerTargets,
      } satisfies ItemContainerBrowsePack,
      keys: Object.keys(containerRecords).sort(),
    },
    {
      kind: 'made-by-recipe',
      pack: {
        format: 'item-related-entity-browse/1',
        contractVersion: '2.0',
        scope,
        relationshipKind: 'made-by-recipe',
        records: madeRecipeRecords,
        targets: recipeTargets,
      } satisfies ItemMadeByRecipeBrowsePack,
      keys: Object.keys(madeRecipeRecords).sort(),
    },
    {
      kind: 'needed-for-quest',
      pack: {
        format: 'item-related-entity-browse/1',
        contractVersion: '2.0',
        scope,
        relationshipKind: 'needed-for-quest',
        records: neededQuestRecords,
        targets: questTargets,
      } satisfies ItemQuestBrowsePack,
      keys: Object.keys(neededQuestRecords).sort(),
    },
    {
      kind: 'quest-reward',
      pack: {
        format: 'item-related-entity-browse/1',
        contractVersion: '2.0',
        scope,
        relationshipKind: 'quest-reward',
        records: rewardRecords,
        targets: questTargets,
      } satisfies ItemQuestRewardBrowsePack,
      keys: Object.keys(rewardRecords).sort(),
    },
    {
      kind: 'used-in-recipe',
      pack: {
        format: 'item-related-entity-browse/1',
        contractVersion: '2.0',
        scope,
        relationshipKind: 'used-in-recipe',
        records: usedRecipeRecords,
        targets: recipeTargets,
      } satisfies ItemRecipeBrowsePack,
      keys: Object.keys(usedRecipeRecords).sort(),
    },
  ];
  if (
    build.itemBrowseCoverage.relationships['monster-drop'] !== 'unsupported'
  ) {
    relatedEntityPacks.push({
      kind: 'monster-drop',
      pack: {
        format: 'item-related-entity-browse/1',
        contractVersion: '2.0',
        scope,
        relationshipKind: 'monster-drop',
        evidence: { evidenceKinds, evidenceSources },
        records: monsterDropRecords,
        targets: monsterTargets,
      } satisfies ItemMonsterDropBrowsePack,
      keys: Object.keys(monsterDropRecords).sort(),
    });
  }

  const relatedEntityBrowse: Record<string, FileDescriptor> = {};
  for (const { kind, pack, keys } of relatedEntityPacks) {
    if (keys.length === 0) continue;
    const descriptor = await put('v2/items/related-entity-browse', pack);
    relatedEntityBrowse[kind] = { ...descriptor, ...rangeForKeys(keys) };
  }

  const catalog = await put('v2/catalogs', {
    format: 'item-catalog/1',
    contractVersion: '2.0',
    scope,
    defaultLocale: { state: 'unknown', reason: 'fixture browse-only catalog' },
    recordCount: { state: 'unknown', reason: 'fixture browse-only catalog' },
    records: { state: 'unknown', reason: 'fixture browse-only catalog' },
  });
  const catalogRange: RangeDescriptor = { count: 0, firstKey: '', lastKey: '' };
  const browseRange = rangeForKeys(browseKeys);
  const itemCapabilities = [
    'evidence-pages-v2',
    'item-descriptions-v1',
    'item-player-facts-v1',
    'item-related-entities-v1',
    'items-v1',
    'product-input-identity-v1',
    'record-packs-v1',
    'wire-2.0',
  ];
  const productId = `items-${ZERO}`;
  const productManifest = await put('v2/products', {
    format: 'mapletip.product-manifest',
    contractVersion: '2.0',
    scope,
    productId: 'items',
    coverage: 'partial',
    identity: {
      identityFormat: 'mapletip-product-id-v2',
      productId,
      inputFingerprint: ZERO,
      semanticFingerprint: ZERO,
      schemaFingerprint: ZERO,
      producerFingerprint: ZERO,
      optionsFingerprint: ZERO,
      projectionRevision: 'fixture',
      productDigest: ZERO,
    },
    requiredClientCapabilities: itemCapabilities,
    packingPolicy: { targetBytes: 524288, maxBytes: 1048576 },
    catalog: { ...catalog, ...catalogRange },
    detailPacks: [],
    pagePacks: [],
    relationshipPacks: [],
    browsePacks: [{ ...browsePack, ...browseRange }],
    descriptionPacks: [{ ...descriptions, ...descriptionRange }],
    relatedEntityBrowsePacks: relatedEntityBrowse,
    totalEntityCount: browseRows.length,
  });
  return {
    catalog,
    browse: browsePack,
    descriptions,
    relatedEntityBrowse,
    productManifest,
    productDescriptor: {
      productId,
      familyId: build.familyId,
      buildId: build.buildId,
      productDigest: ZERO,
      contractVersion: '2.0',
      schemaSha256: ZERO,
      coverage: 'partial',
      completionClass: 'local-diagnostic',
      requiredClientCapabilities: itemCapabilities,
      productManifest,
      productAlias: productManifest,
      catalog,
      catalogAlias: catalog,
    },
  };
}

export async function buildRelease(fixtureWorld: {
  readonly builds: readonly FixtureBuild[];
}): Promise<FixtureRelease> {
  const files = new Map<string, Uint8Array>();
  const builds = new Map<string, FixtureBuildArtifacts>();
  const spriteIds = new Map<string, string>();
  const minimapIds = new Set<string>();
  const markIds = new Set<string>();

  async function put(dir: string, value: unknown): Promise<FileDescriptor> {
    const bytes = encoder.encode(JSON.stringify(value));
    const sha256 = await sha256Hex(bytes);
    const path = `${dir}/${sha256}.json`;
    files.set(path, bytes);
    return { path, sha256, byteLength: bytes.byteLength };
  }

  const key = async (prefix: string, id: string): Promise<string> =>
    `${prefix}-${await sha256Hex(encoder.encode(`fixture:${prefix}:${id}`))}`;

  const releaseId = `release-${await sha256Hex(encoder.encode('fixture-release'))}`;
  const buildDescriptors: Array<Record<string, unknown>> = [];

  for (const build of fixtureWorld.builds) {
    const scope = { family_id: build.familyId, build_id: build.buildId };
    const sortedItems = await Promise.all(
      build.items.map(async (item) => ({
        item,
        key: await key('item', item.id),
      })),
    );
    sortedItems.sort((left, right) => left.key.localeCompare(right.key));
    const items = sortedItems.map(({ item, key: itemKey }) => {
      return {
        itemRef:
          item.id === 'unresolved-token'
            ? { state: 'unresolved' }
            : { state: 'resolved', key: itemKey },
        itemName:
          item.name === undefined ? { state: 'unknown' } : known(item.name),
        itemClass: wireFact(item.itemClass),
        category: item.category,
      };
    });
    const itemById = new Map(
      sortedItems.map(
        ({ item, key: itemKey }) => [item.id, { item, key: itemKey }] as const,
      ),
    );
    const itemIndices = new Map(
      sortedItems.map(({ item }, index) => [item.id, index] as const),
    );

    const monsters = await Promise.all(
      build.monsters.map(async (monster) => {
        const publicId = monsterPublicId(monster.id);
        return {
          monster,
          key: await key('monster', `${build.buildId}:${monster.id}`),
          publicId,
          slug: monsterSlug(monster.name, publicId),
          ...(monster.sprite === 'unknown' || monster.sprite === 'absent'
            ? {}
            : {
                spriteId: await sha256Hex(
                  encoder.encode(`fixture:sprite:${monster.sprite}`),
                ),
              }),
        };
      }),
    );
    for (const { monster, spriteId } of monsters) {
      if (spriteId !== undefined) spriteIds.set(spriteId, monster.sprite);
      for (const location of monster.locations ?? []) {
        if (location.minimapContentId !== undefined) {
          minimapIds.add(location.minimapContentId);
        }
      }
    }
    const recordDrops = Object.entries(build.drops);
    const dropCountByMonster = new Map(
      recordDrops.map(
        ([monsterId, drops]) => [monsterId, drops.length] as const,
      ),
    );
    const projectedMonsters = monsters.map(
      ({ monster, key: monsterKey, publicId, slug, spriteId }) => ({
        monster,
        record: projectMonster(
          build,
          monster,
          monsterKey,
          publicId,
          slug,
          spriteId,
          dropCountByMonster.get(monster.id) ?? 0,
        ),
      }),
    );
    const records = projectedMonsters
      .map(({ record }) => record)
      .sort((left, right) => left.key.localeCompare(right.key));
    const range: RangeDescriptor = {
      count: records.length,
      firstKey: records[0]?.key ?? '',
      lastKey: records.at(-1)?.key ?? '',
    };

    const catalog = await put('v2/catalogs', {
      format: 'mapletip.monster-catalog-2',
      contractVersion: '2.5',
      scope,
      browseCoverage: {
        historicalDrops: build.historicalDrops,
        locationScope: 'client-placements',
      },
      recordCount: records.length,
      records,
    });
    const pageRecords = projectedMonsters
      .map(({ monster, record }) => {
        const drops = build.drops[monster.id] ?? [];
        const entries: MonsterPageRecordV1_4['drops']['entries'] = drops.map(
          (drop) => {
            const target = itemById.get(drop.itemId);
            if (target === undefined) {
              throw new Error(
                `Fixture drop references unknown item "${drop.itemId}".`,
              );
            }
            return {
              itemRef:
                target.item.id === 'unresolved-token'
                  ? { state: 'unresolved' }
                  : { state: 'resolved', key: target.key },
              name:
                target.item.name === undefined
                  ? { state: 'unknown' }
                  : known(target.item.name),
              category: target.item.category,
              icon: { state: 'unknown' },
              evidence: mapNonEmpty(drop.evidence, (evidence) => ({
                kind: evidence.kind,
                label: FIXTURE_EVIDENCE_KINDS[evidence.kind].label,
                build: evidence.build,
                ...(evidence.date === undefined ? {} : { date: evidence.date }),
                ...(evidence.url === undefined ? {} : { url: evidence.url }),
                ...(evidence.startSeconds === undefined
                  ? {}
                  : { startSeconds: evidence.startSeconds }),
              })),
            };
          },
        );
        return projectMonsterPage(scope, record, entries, monster, itemById);
      })
      .sort((left, right) => left.publicId.localeCompare(right.publicId));
    const pagePackRange: RangeDescriptor = {
      count: pageRecords.length,
      firstKey: pageRecords[0]?.publicId ?? '',
      lastKey: pageRecords.at(-1)?.publicId ?? '',
    };
    const pagePack = await put('v2/monsters/page-packs', {
      format: 'mapletip.monster-page-pack',
      contractVersion: '1.4',
      recordKind: 'monster-page',
      scope,
      records: Object.fromEntries(
        pageRecords.map((record) => [record.publicId, record]),
      ),
    } satisfies MonsterPagePackV1_4);
    const locationBrowseRecords: MonsterLocationBrowseV1_4['records'] =
      Object.fromEntries(
        pageRecords
          .filter((record) => record.locations.entries.length > 0)
          .map((record) => [record.key, { entries: record.locations.entries }]),
      );
    const locationBrowseKeys = Object.keys(locationBrowseRecords).sort();
    const locationBrowse = await put('v2/browse', {
      format: 'mapletip.monster-location-browse',
      contractVersion: '1.4',
      scope,
      records: locationBrowseRecords,
    } satisfies MonsterLocationBrowseV1_4);
    const locationBrowseRange: RangeDescriptor = {
      count: locationBrowseKeys.length,
      firstKey: locationBrowseKeys[0] ?? '',
      lastKey: locationBrowseKeys.at(-1) ?? '',
    };
    const evidenceSources: MonsterDropBrowseV1_2['evidenceSources'] = [];
    const usedEvidenceKinds = new Set<FixtureEvidenceKind>();
    const dropRecords: MonsterDropBrowseV1_2['records'] = {};
    for (const { monster, key: monsterKey } of monsters) {
      const drops = build.drops[monster.id] ?? [];
      dropRecords[monsterKey] = {
        entries: drops.map((drop) => {
          const item = itemIndices.get(drop.itemId);
          if (item === undefined) {
            throw new Error(
              `Fixture drop references unknown item "${drop.itemId}".`,
            );
          }
          return {
            item,
            evidence: mapNonEmpty(drop.evidence, (evidence) => {
              usedEvidenceKinds.add(evidence.kind);
              const source =
                evidenceSources.push({
                  kind: evidence.kind,
                  build: evidence.build,
                  ...(evidence.date === undefined
                    ? {}
                    : { date: evidence.date }),
                  ...(evidence.url === undefined ? {} : { url: evidence.url }),
                }) - 1;
              return {
                source,
                ...(evidence.startSeconds === undefined
                  ? {}
                  : { startSeconds: evidence.startSeconds }),
              };
            }),
          };
        }),
      };
    }
    const evidenceKinds: MonsterDropBrowseV1_2['evidenceKinds'] =
      Object.entries(FIXTURE_EVIDENCE_KINDS)
        .filter(([kind]) => usedEvidenceKinds.has(kind as FixtureEvidenceKind))
        .map(([key, { label }]) => ({ key, label }));
    const dropBrowse = await put('v2/browse', {
      format: 'mapletip.monster-drop-browse',
      contractVersion: '1.2',
      scope,
      items,
      itemIcons: items.map(() => ({ state: 'unknown' as const })),
      evidenceKinds,
      evidenceSources,
      records: Object.fromEntries(
        Object.entries(dropRecords).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
    });
    const mapsArtifacts = await buildMapProduct({
      build,
      scope,
      maps: [...build.maps, ...locationMapFixtures(build)],
      monsters: new Map(
        projectedMonsters.map(
          ({ monster, record }) => [monster.id, record] as const,
        ),
      ),
      key,
      put,
      minimapIds,
      markIds,
    });
    const itemArtifacts = await buildItemProduct({
      build,
      scope,
      itemById,
      monsters,
      monsterRecords: new Map(
        projectedMonsters.map(
          ({ monster, record }) => [monster.id, record] as const,
        ),
      ),
      key,
      put,
      spriteIds,
    });
    const capabilities = [
      'evidence-pages-v2',
      'monster-core-v1',
      'monster-drop-browse-v1',
      'monster-location-browse-v1',
      'monster-page-v1',
      'product-input-identity-v1',
      'record-packs-v1',
      'wire-2.0',
    ];
    const productId = `monsters-${ZERO}`;
    const productManifest = await put('v2/products', {
      format: 'mapletip.product-manifest',
      contractVersion: '2.0',
      scope,
      productId: 'monsters',
      coverage: 'partial',
      identity: {
        identityFormat: 'mapletip-product-id-v2',
        productId,
        inputFingerprint: ZERO,
        semanticFingerprint: ZERO,
        schemaFingerprint: ZERO,
        producerFingerprint: ZERO,
        optionsFingerprint: ZERO,
        projectionRevision: 'fixture',
        productDigest: ZERO,
      },
      requiredClientCapabilities: capabilities,
      packingPolicy: { targetBytes: 524288, maxBytes: 1048576 },
      catalog: { ...catalog, ...range },
      detailPacks: [],
      pagePacks: [{ ...pagePack, ...pagePackRange }],
      relationshipPacks: [],
      dropBrowse: { ...dropBrowse, ...range },
      locationBrowse: { ...locationBrowse, ...locationBrowseRange },
      totalEntityCount: records.length,
    });
    const descriptor = {
      productId,
      familyId: build.familyId,
      buildId: build.buildId,
      productDigest: ZERO,
      contractVersion: '2.0',
      schemaSha256: ZERO,
      coverage: 'partial',
      completionClass: 'local-diagnostic',
      requiredClientCapabilities: capabilities,
      productManifest,
      productAlias: productManifest,
      catalog,
      catalogAlias: catalog,
    };
    buildDescriptors.push({
      familyId: build.familyId,
      buildId: build.buildId,
      productCapabilities: ['items-v1', 'maps-v1', 'monster-core-v1'],
      products: [
        descriptor,
        mapsArtifacts.productDescriptor,
        itemArtifacts.productDescriptor,
      ],
    });
    builds.set(build.buildId, {
      productManifest,
      catalog,
      dropBrowse,
      locationBrowse,
      pagePack,
      mapProductManifest: mapsArtifacts.productManifest,
      mapPagePack: mapsArtifacts.pagePack,
      mapBrowseRows: mapsArtifacts.browseRows,
      itemProductManifest: itemArtifacts.productManifest,
      itemCatalog: itemArtifacts.catalog,
      itemBrowse: itemArtifacts.browse,
      itemDescriptions: itemArtifacts.descriptions,
      itemRelatedEntityBrowse: itemArtifacts.relatedEntityBrowse,
    });
  }

  const buildIndex = await put('v1/build-indexes', {
    format: 'mapletip.release-build-index',
    contractVersion: '2.0',
    releaseId,
    builds: buildDescriptors,
  });
  const manifest = await put('v1/releases', {
    format: 'mapletip.local-release',
    releaseFormat: '1',
    contractVersion: '2.0',
    releaseId,
    releaseClass: 'local-diagnostic',
    coverage: 'partial',
    requiredClientCapabilities: [
      'evidence-pages-v2',
      'item-descriptions-v1',
      'item-player-facts-v1',
      'item-related-entities-v1',
      'items-v1',
      'monster-core-v1',
      'monster-drop-browse-v1',
      'monster-location-browse-v1',
      'monster-page-v1',
      'map-page-v1',
      'maps-v1',
      'product-input-identity-v1',
      'record-packs-v1',
      'release-manifest-v1',
      'wire-2.0',
    ],
    buildIndex,
  });

  return {
    files,
    pin: { format: 'mapletip.local-release-pin', releaseId, ...manifest },
    builds,
    spriteIds,
    minimapIds,
    markIds,
  };
}

export const fixtureRelease = await buildRelease(world);
