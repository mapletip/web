/** Deterministic contract-2.1 catalog fixtures for tests. */
import type { MonsterCatalogV2_1 } from '@mapletip/data/monsters';

type MonsterRecord = MonsterCatalogV2_1['records'][number];

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
}: FixtureCatalogInput): MonsterCatalogV2_1 {
  return {
    contractVersion: '2.1',
    format: 'mapletip.monster-catalog-2',
    recordCount: recordCount ?? records.length,
    records: [...records],
    scope: {
      build_id: buildId ?? 'cw-launch',
      family_id: familyId ?? 'classic-world',
    },
  };
}
