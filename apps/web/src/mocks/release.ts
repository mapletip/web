import type { MapPagePackV1_1, MapPageRecordV1_1 } from '@mapletip/data/maps';
import type {
  MonsterCatalogV2_5,
  MonsterDropBrowseV1,
  MonsterLocationBrowseV1_3,
  MonsterPagePackV1_2,
  MonsterPageRecordV1_2,
} from '@mapletip/data/monsters';

import type {
  FixtureBuild,
  FixtureFact,
  FixtureLocation,
  FixtureMap,
  FixtureMapPoint,
  FixtureMonster,
} from './world';
import { world } from './world';

const encoder = new TextEncoder();
const ZERO = '0'.repeat(64);
const FNV1A_64_OFFSET = 14695981039346656037n;
const FNV1A_64_PRIME = 1099511628211n;
const BASE36_8_MOD = 36n ** 8n;

export interface FileDescriptor {
  readonly path: string;
  readonly sha256: string;
  readonly byteLength: number;
}

export interface FixtureBuildArtifacts {
  readonly productManifest: FileDescriptor;
  readonly catalog: FileDescriptor;
  readonly dropBrowse: FileDescriptor;
  readonly pagePack: FileDescriptor;
  readonly locationBrowse: FileDescriptor;
  readonly mapProductManifest: FileDescriptor;
  readonly mapPagePack: FileDescriptor;
}

export interface FixtureRelease {
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
    locations: { state: 'absent' },
  };
}

function projectMonsterPage(
  scope: MonsterPageRecordV1_2['scope'],
  catalogRecord: MonsterCatalogV2_5['records'][number],
  entries: MonsterPageRecordV1_2['drops']['entries'],
  monster: FixtureMonster,
  itemById: ReadonlyMap<
    string,
    { readonly item: FixtureBuild['items'][number]; readonly key: string }
  >,
): MonsterPageRecordV1_2 {
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
  const locationsState =
    monster.locationsState ??
    (locationFixtures.length === 0 ? 'absent' : 'known');
  const locationPlacementCount = locationFixtures.reduce(
    (total, location) => total + location.placementCount,
    0,
  );
  const locationEntries: MonsterPageRecordV1_2['locations']['entries'] =
    locationFixtures.map((location: FixtureLocation) => {
      const points = location.points ?? [];
      const hasStage = location.minimapContentId !== undefined;
      let pointsState: MonsterPageRecordV1_2['locations']['entries'][number]['points']['state'];
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
    contractVersion: '1.2',
    scope,
    key: catalogRecord.key,
    publicId: catalogRecord.publicId,
    slug: catalogRecord.slug,
    name: catalogRecord.name,
    sprite: { contentId: catalogRecord.sprite },
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
      summary: catalogRecord.drops,
      entries,
    },
    locations: {
      summary:
        locationsState === 'absent'
          ? { state: 'absent' }
          : {
              state: locationsState,
              mapCount: locationEntries.length,
              placementCount: locationPlacementCount,
            },
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
    MapPageRecordV1_1['markImage'],
    { readonly state: 'known' }
  >;
  readonly stage?: Extract<
    MapPageRecordV1_1['stage'],
    { readonly state: 'known' }
  >['value'];
};

type MapReference = Extract<
  MapPageRecordV1_1['information']['returnMap'],
  { readonly state: 'known' }
>['value'];

function mapNameFact(name: string | undefined): MapPageRecordV1_1['name'] {
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
): MapPageRecordV1_1['connections']['items'][number]['points'] {
  if (!positionsPublished) return { state: 'unknown', items: [] };
  return {
    state: points.length === 0 ? 'absent' : 'known',
    items: [...points],
  };
}

async function projectMapPages(options: {
  readonly build: FixtureBuild;
  readonly scope: MapPageRecordV1_1['scope'];
  readonly maps: readonly FixtureMap[];
  readonly monsters: ReadonlyMap<string, MonsterCatalogV2_5['records'][number]>;
  readonly key: (prefix: string, id: string) => Promise<string>;
}): Promise<readonly MapPageRecordV1_1[]> {
  const { build, scope, maps, monsters, key } = options;
  const resolved = await Promise.all(
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
        markImage: {
          state: 'known',
          value: await sha256Hex(
            encoder.encode(`fixture:map-mark:${build.buildId}:${fixture.id}`),
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
              },
            }),
      };
    }),
  );
  const mapsBySourceId = new Map(resolved.map((map) => [map.fixture.id, map]));
  const positionsPublished = (map: FixtureMap): boolean =>
    map.stage !== undefined && map.positionsPublished !== false;

  return Promise.all(
    resolved.map(async (map): Promise<MapPageRecordV1_1> => {
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
          respawn: { kind: placement.respawn ?? 'ordinary' },
          focusToken: fixturePublicId(
            `map-focus:${fixture.id}:monster:${placement.monsterId}`,
          ),
        } satisfies MapPageRecordV1_1['monsters']['items'][number];
      });
      const mapNpcs = await Promise.all(
        fixture.npcs.map(
          async (npc) =>
            ({
              key: await key('npc', `${build.buildId}:${fixture.id}:${npc.id}`),
              name: known(npc.name),
              sprite:
                npc.sprite === undefined
                  ? { state: 'unknown' as const }
                  : known(
                      await sha256Hex(
                        encoder.encode(`fixture:sprite:${npc.sprite}`),
                      ),
                    ),
              questCount: npc.questCount ?? { state: 'known', count: 0 },
              points: mapPoints(npc.points, published),
              focusToken: fixturePublicId(
                `map-focus:${fixture.id}:npc:${npc.id}`,
              ),
            }) satisfies MapPageRecordV1_1['npcs']['items'][number],
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
        } satisfies MapPageRecordV1_1['connections']['items'][number];
      });

      return {
        format: 'mapletip.map-page',
        contractVersion: '1.1',
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
      } satisfies MapPageRecordV1_1;
    }),
  );
}

interface BuildMapProductOptions {
  readonly build: FixtureBuild;
  readonly scope: MapPageRecordV1_1['scope'];
  readonly maps: readonly FixtureMap[];
  readonly monsters: ReadonlyMap<string, MonsterCatalogV2_5['records'][number]>;
  readonly key: (prefix: string, id: string) => Promise<string>;
  readonly put: (dir: string, value: unknown) => Promise<FileDescriptor>;
  readonly minimapIds: Set<string>;
  readonly markIds: Set<string>;
}

interface BuiltMapProduct {
  readonly pagePack: FileDescriptor;
  readonly productManifest: FileDescriptor;
  readonly productDescriptor: Record<string, unknown>;
}

async function buildMapProduct(
  options: BuildMapProductOptions,
): Promise<BuiltMapProduct> {
  const { build, scope, maps, monsters, key, put, minimapIds, markIds } =
    options;
  const mapPages = [
    ...(await projectMapPages({ build, scope, maps, monsters, key })),
  ].sort((left, right) => left.publicId.localeCompare(right.publicId));
  const mapPagePackRange: RangeDescriptor = {
    count: mapPages.length,
    firstKey: mapPages[0]?.publicId ?? '',
    lastKey: mapPages.at(-1)?.publicId ?? '',
  };
  const pagePack = await put('v2/maps/page-packs', {
    format: 'mapletip.map-page-pack',
    contractVersion: '1.1',
    recordKind: 'map-page',
    scope,
    records: Object.fromEntries(mapPages.map((page) => [page.publicId, page])),
  } satisfies MapPagePackV1_1);
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
  const mapCapabilities = [
    'evidence-pages-v2',
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
  });
  return {
    pagePack,
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
          spriteId:
            monster.sprite === 'unknown' || monster.sprite === 'absent'
              ? undefined
              : await sha256Hex(
                  encoder.encode(`fixture:sprite:${monster.sprite}`),
                ),
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
        const entries: MonsterPageRecordV1_2['drops']['entries'] = drops.map(
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
              assertion:
                drop.assertionKind === 'native'
                  ? { kind: 'native' }
                  : {
                      kind: 'historical-overlay',
                      sourceBuild: drop.sourceBuild ?? 'gms-v83',
                      confidence: drop.confidence ?? 'maybe',
                    },
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
      contractVersion: '1.2',
      recordKind: 'monster-page',
      scope,
      records: Object.fromEntries(
        pageRecords.map((record) => [record.publicId, record]),
      ),
    } satisfies MonsterPagePackV1_2);
    const locationBrowseRecords: MonsterLocationBrowseV1_3['records'] =
      Object.fromEntries(
        pageRecords
          .filter((record) => record.locations.entries.length > 0)
          .map((record) => [record.key, { entries: record.locations.entries }]),
      );
    const locationBrowseKeys = Object.keys(locationBrowseRecords).sort();
    const locationBrowse = await put('v2/browse', {
      format: 'mapletip.monster-location-browse',
      contractVersion: '1.3',
      scope,
      records: locationBrowseRecords,
    } satisfies MonsterLocationBrowseV1_3);
    const locationBrowseRange: RangeDescriptor = {
      count: locationBrowseKeys.length,
      firstKey: locationBrowseKeys[0] ?? '',
      lastKey: locationBrowseKeys.at(-1) ?? '',
    };
    const dropRecords: MonsterDropBrowseV1['records'] = {};
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
          return drop.assertionKind === 'native'
            ? { assertionKind: 'native', item }
            : {
                assertionKind: 'historical-overlay',
                item,
                sourceBuild: drop.sourceBuild ?? 'gms-v83',
                confidence: drop.confidence ?? 'maybe',
              };
        }),
      };
    }
    const dropBrowse = await put('v2/browse', {
      format: 'mapletip.monster-drop-browse',
      contractVersion: '1.0',
      scope,
      items,
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
      productCapabilities: ['maps-v1', 'monster-core-v1'],
      products: [descriptor, mapsArtifacts.productDescriptor],
    });
    builds.set(build.buildId, {
      productManifest,
      catalog,
      dropBrowse,
      locationBrowse,
      pagePack,
      mapProductManifest: mapsArtifacts.productManifest,
      mapPagePack: mapsArtifacts.pagePack,
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
