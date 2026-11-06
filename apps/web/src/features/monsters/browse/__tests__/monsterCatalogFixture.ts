/**
 * Deterministic contract-2.0 catalog fixtures for tests.
 *
 * The SDK's narrow entry does not re-export the generated catalog types, so the
 * contract-2 member is extracted from `StaticMonsterCatalog` instead.
 */
import type { StaticMonsterCatalog } from '@mapletip/data/monsters';

export type ContractTwoCatalog = Extract<
  StaticMonsterCatalog,
  { format: 'mapletip.monster-catalog-2' }
>;
export type ContractTwoRecord = ContractTwoCatalog['records'][number];

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
  readonly name: ContractTwoRecord['name'];
  readonly stats: ContractTwoRecord['stats'];
  readonly traits: ContractTwoRecord['traits'];
}

export function fixtureRecord(input: FixtureRecordInput): ContractTwoRecord {
  return {
    key: input.key,
    name: input.name,
    stats: input.stats,
    traits: input.traits,
    elements: { state: 'unknown' },
    relationships: { state: 'unknown' },
  };
}

export interface FixtureCatalogOptions {
  readonly buildId?: string;
  readonly familyId?: string;
  readonly recordCount?: number;
}

export function fixtureCatalog(
  records: readonly ContractTwoRecord[],
  options: FixtureCatalogOptions = {},
): ContractTwoCatalog {
  return {
    contractVersion: '2.0',
    format: 'mapletip.monster-catalog-2',
    recordCount: options.recordCount ?? records.length,
    records: [...records],
    scope: {
      build_id: options.buildId ?? 'cw-launch',
      family_id: options.familyId ?? 'classic-world',
    },
  };
}
