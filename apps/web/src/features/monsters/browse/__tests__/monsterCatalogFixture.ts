/** Deterministic drop-summary catalog fixtures for tests. */
import type {
  MonsterCatalogV2_2,
  MonsterDropBrowseV1,
} from '@mapletip/data/monsters';

type MonsterRecord = MonsterCatalogV2_2['records'][number];

export function knownFact<T>(value: T): { state: 'known'; value: T } {
  return { state: 'known', value };
}

export const UNKNOWN_FACT = { state: 'unknown' } as const;
export const ABSENT_FACT = {
  state: 'absent',
  coverageKey: 'fixture.coverage',
} as const;
export const UNSUPPORTED_FACT = { state: 'unsupported' } as const;

export interface FixtureRecordInput {
  readonly key: string;
  readonly name: MonsterRecord['name'];
  readonly stats: MonsterRecord['stats'];
  readonly traits: MonsterRecord['traits'];
  readonly sprite?: MonsterRecord['sprite'];
}

export function fixtureRecord(input: FixtureRecordInput): MonsterRecord {
  return {
    key: input.key,
    name: input.name,
    stats: input.stats,
    traits: input.traits,
    elements: { state: 'unknown' },
    relationships: { state: 'unknown' },
    drops: { native: { state: 'unknown' } },
    locations: { state: 'absent' },
    sprite: input.sprite ?? UNKNOWN_FACT,
  };
}

export interface FixtureCatalogInput {
  readonly records: readonly MonsterRecord[];
  readonly buildId?: string;
  readonly familyId?: string;
  readonly recordCount?: number;
}

export function fixtureCatalog({
  records,
  buildId,
  familyId,
  recordCount,
}: FixtureCatalogInput): MonsterCatalogV2_2 {
  return {
    contractVersion: '2.2',
    format: 'mapletip.monster-catalog-2',
    recordCount: recordCount ?? records.length,
    browseCoverage: {
      historicalDrops: 'supported',
      locationScope: 'client-placements',
    },
    records: [...records],
    scope: {
      build_id: buildId ?? 'cw-launch',
      family_id: familyId ?? 'classic-world',
    },
  };
}

export function emptyDropBrowseFixture(): MonsterDropBrowseV1 {
  return {
    format: 'mapletip.monster-drop-browse',
    contractVersion: '1.0',
    scope: { build_id: 'cw-launch', family_id: 'classic-world' },
    items: [],
    records: {},
  };
}
