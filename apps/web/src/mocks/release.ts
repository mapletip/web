import type {
  MonsterCatalogV2_4,
  MonsterDropBrowseV1,
} from '@mapletip/data/monsters';

import type { FixtureBuild, FixtureFact, FixtureMonster } from './world';
import { world } from './world';

const encoder = new TextEncoder();
const ZERO = '0'.repeat(64);

export interface FileDescriptor {
  readonly path: string;
  readonly sha256: string;
  readonly byteLength: number;
}

export interface FixtureBuildArtifacts {
  readonly productManifest: FileDescriptor;
  readonly catalog: FileDescriptor;
  readonly dropBrowse: FileDescriptor;
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

function projectMonster(
  build: FixtureBuild,
  monster: FixtureMonster,
  key: string,
  spriteId: string | undefined,
  dropCount: number,
): MonsterCatalogV2_4['records'][number] {
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
  ] as MonsterCatalogV2_4['records'][number]['stats'];
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
  ] as MonsterCatalogV2_4['records'][number]['traits'];

  let sprite: MonsterCatalogV2_4['records'][number]['sprite'];
  if (monster.sprite === 'unknown') {
    sprite = { state: 'unknown' };
  } else if (monster.sprite === 'absent') {
    sprite = { state: 'absent', coverageKey: 'fixture:sprite-coverage' };
  } else {
    sprite = { state: 'known', value: spriteId ?? '' };
  }
  let nativeDrops: MonsterCatalogV2_4['records'][number]['drops']['native'];
  if (build.buildId === 'gms-v83' && dropCount > 0) {
    nativeDrops = { state: 'known', count: dropCount, lowerBound: true };
  } else {
    nativeDrops = { state: 'unknown' };
  }

  return {
    key,
    name:
      monster.name === undefined ? { state: 'unknown' } : known(monster.name),
    stats,
    traits,
    hpRecovery: wireFact(monster.hpRecovery ?? { state: 'unknown' }),
    mpRecovery: wireFact(monster.mpRecovery ?? { state: 'unknown' }),
    elements: { state: 'unknown' },
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

export async function buildRelease(fixtureWorld: {
  readonly builds: readonly FixtureBuild[];
}): Promise<FixtureRelease> {
  const files = new Map<string, Uint8Array>();
  const builds = new Map<string, FixtureBuildArtifacts>();
  const spriteIds = new Map<string, string>();

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
    const itemIndices = new Map(
      sortedItems.map(({ item }, index) => [item.id, index] as const),
    );

    const monsters = await Promise.all(
      build.monsters.map(async (monster) => ({
        monster,
        key: await key('monster', `${build.buildId}:${monster.id}`),
        spriteId:
          monster.sprite === 'unknown' || monster.sprite === 'absent'
            ? undefined
            : await sha256Hex(
                encoder.encode(`fixture:sprite:${monster.sprite}`),
              ),
      })),
    );
    for (const { monster, spriteId } of monsters) {
      if (spriteId !== undefined) spriteIds.set(spriteId, monster.sprite);
    }
    const recordDrops = Object.entries(build.drops);
    const dropCountByMonster = new Map(
      recordDrops.map(
        ([monsterId, drops]) => [monsterId, drops.length] as const,
      ),
    );
    const records = monsters
      .map(({ monster, key: monsterKey, spriteId }) =>
        projectMonster(
          build,
          monster,
          monsterKey,
          spriteId,
          dropCountByMonster.get(monster.id) ?? 0,
        ),
      )
      .sort((left, right) => left.key.localeCompare(right.key));
    const range: RangeDescriptor = {
      count: records.length,
      firstKey: records[0]?.key ?? '',
      lastKey: records.at(-1)?.key ?? '',
    };

    const catalog = await put('v2/catalogs', {
      format: 'mapletip.monster-catalog-2',
      contractVersion: '2.4',
      scope,
      browseCoverage: {
        historicalDrops: build.historicalDrops,
        locationScope: 'client-placements',
      },
      recordCount: records.length,
      records,
    });
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
    builds.set(build.buildId, { productManifest, catalog, dropBrowse });
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
  };
}

export const fixtureRelease = await buildRelease(world);
