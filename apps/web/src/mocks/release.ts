import type {
  MonsterCatalogV2_5,
  MonsterDropBrowseV1,
  MonsterPagePackV1,
  MonsterPageRecordV1,
} from '@mapletip/data/monsters';

import type {
  FixtureBuild,
  FixtureFact,
  FixtureLocation,
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

export function monsterPublicId(sourceId: string): string {
  let hash = FNV1A_64_OFFSET;
  for (const byte of encoder.encode(`monster:${sourceId}`)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * FNV1A_64_PRIME);
  }
  return (hash % BASE36_8_MOD).toString(36).padStart(8, '0');
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
  scope: MonsterPageRecordV1['scope'],
  catalogRecord: MonsterCatalogV2_5['records'][number],
  entries: MonsterPageRecordV1['drops']['entries'],
  monster: FixtureMonster,
): MonsterPageRecordV1 {
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
  const locationEntries: MonsterPageRecordV1['locations']['entries'] =
    locationFixtures.map((location: FixtureLocation) => ({
      mapKey: location.mapKey,
      name:
        location.name === undefined
          ? { state: 'unknown' }
          : known(location.name),
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
              provenance: 'reviewed-overlay' as const,
              status: 'verified' as const,
            },
          }),
      placementCount: location.placementCount,
      minimap:
        location.minimapContentId === undefined
          ? { state: 'absent', coverageKey: 'fixture:minimap' }
          : known(location.minimapContentId),
    }));

  return {
    format: 'mapletip.monster-page',
    contractVersion: '1.0',
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
    quests: {
      state: 'absent',
      entries: [],
    },
    summonedByItems: [],
  };
}

export async function buildRelease(fixtureWorld: {
  readonly builds: readonly FixtureBuild[];
}): Promise<FixtureRelease> {
  const files = new Map<string, Uint8Array>();
  const builds = new Map<string, FixtureBuildArtifacts>();
  const spriteIds = new Map<string, string>();
  const minimapIds = new Set<string>();

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
        const entries: MonsterPageRecordV1['drops']['entries'] = drops.map(
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
        return projectMonsterPage(scope, record, entries, monster);
      })
      .sort((left, right) => left.publicId.localeCompare(right.publicId));
    const pagePackRange: RangeDescriptor = {
      count: pageRecords.length,
      firstKey: pageRecords[0]?.publicId ?? '',
      lastKey: pageRecords.at(-1)?.publicId ?? '',
    };
    const pagePack = await put('v2/monsters/page-packs', {
      format: 'mapletip.monster-page-pack',
      contractVersion: '1.0',
      recordKind: 'monster-page',
      scope,
      records: Object.fromEntries(
        pageRecords.map((record) => [record.publicId, record]),
      ),
    } satisfies MonsterPagePackV1);
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
    const capabilities = [
      'evidence-pages-v2',
      'monster-core-v1',
      'monster-drop-browse-v1',
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
      productCapabilities: ['monster-core-v1'],
      products: [descriptor],
    });
    builds.set(build.buildId, {
      productManifest,
      catalog,
      dropBrowse,
      pagePack,
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
      'monster-page-v1',
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
  };
}

export const fixtureRelease = await buildRelease(world);
