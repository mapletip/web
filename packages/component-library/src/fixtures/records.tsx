import { VisuallyHidden } from '@mantine/core';
import type { ReactElement } from 'react';

import type { TableColumn } from '@/components/Table/types';
import recordImageStress from '@/fixtures/record-image-stress.svg?url';

export interface DemoRecord extends Record<string, unknown> {
  readonly id: string;
  readonly name: string;
  readonly href: string;
  readonly image: string | null;
  readonly group: string;
  readonly region: string;
  readonly status: string;
  readonly value1: number | null;
  readonly value2: number | null;
  readonly value3: number | null;
  readonly value4: number | null;
  readonly value5: number | null;
  readonly value6: number | null;
  readonly value7: number | null;
  readonly value8: number | null;
  readonly value9: number | null;
  readonly value10: number | null;
}

/**
 * Neutral synthetic examples follow the observed browse shape: 11 table columns,
 * 100 rows per page, 12 category values, and a 22-character name P90.
 * Names, categories, and values are generic synthetic data.
 */
export const demoRowsPerPage = 100;

/**
 * Closed-form deterministic calculation for synthetic metrics.
 * Uses a pure hash of index and column to guarantee that each cell value
 * is strictly independent, immutable, and snapshot-stable without PRNG state.
 */
function deterministicMetric(index: number, column: number): number {
  let state = (index + 1) * 0x9e3779b9 + column * 0x6d2b79f5;
  state = Math.imul(state ^ (state >>> 15), state | 1);
  state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
  return ((state ^ (state >>> 14)) >>> 0) / 4_294_967_296;
}

const demoCategoryWeights = [42, 31, 25, 19, 17, 15, 13, 11, 9, 7, 6, 5];
const demoRegionWeights = [38, 29, 24, 20, 17, 14, 13, 12, 10, 9, 8, 6];
const demoStatusWeights = [45, 38, 30, 25, 21, 17, 14, 10];

/** Deterministically picks a weighted value so facet counts are intentionally uneven. */
function weightedValue(
  index: number,
  column: number,
  values: readonly string[],
  weights: readonly number[],
): string {
  const target =
    deterministicMetric(index, column) *
    weights.reduce((total, weight) => total + weight, 0);
  let boundary = 0;
  for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
    boundary += weights[valueIndex]!;
    if (target < boundary) return values[valueIndex]!;
  }
  return values[values.length - 1]!;
}

const placeholderImage =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Crect width="24" height="24" rx="4" fill="%23d0d5dd"/%3E%3C/svg%3E';
const demoNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

export function formatDemoNumber(value: number): string {
  return demoNumberFormatter.format(value);
}

export const demoCategoryValues = [
  'Alpha',
  'Beta',
  'Gamma',
  'Delta',
  'Epsilon',
  'Zeta',
  'Eta',
  'Theta',
  'Iota',
  'Kappa',
  'Lambda',
  'Omega',
] as const;

export const demoRegionValues = [
  'North',
  'South',
  'East',
  'West',
  'Central',
  'Coastal',
  'Upper',
  'Lower',
  'Northwest',
  'Northeast',
  'Southwest',
  'Southeast',
] as const;

export const demoStatusValues = [
  'Active',
  'Pending',
  'Under review',
  'Scheduled',
  'In progress',
  'Paused',
  'Completed',
  'Archived',
] as const;

function demoRecordName(index: number, id: string): string {
  if (index === 0 || index === 4) return `Record ${id}`;
  if (index === 7) {
    return 'A Very Long Record Name That Wraps Within The Identity Column Without Expanding It';
  }
  if (index >= 181) {
    return index === 199
      ? `Record ${id} - Extended reference entry with a longer description for narrow table layouts`
      : `Record ${id} - Extended reference entry ${String((index % 19) + 1).padStart(2, '0')}`;
  }
  if (index >= 90) {
    return `Record ${id} - Entry ${id}`;
  }
  return `Record ${id} - Sample`;
}

function demoImage(index: number): string | null {
  if (index === 21) return recordImageStress;
  if (index === 4) return null;
  return placeholderImage;
}

function demoValue1(index: number): number | null {
  if (index === 3) return null;
  if (index === 5) return 0;
  return Math.round(deterministicMetric(index, 1) * 200);
}

function demoValue2(index: number): number | null {
  if (index === 10) return null;
  if (index === 8 || index === 9) return 500;
  return Math.round(deterministicMetric(index, 2) * 987_654_321);
}

export function createDemoRecords(count = 200): DemoRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const id = String(index + 1).padStart(3, '0');
    const name = demoRecordName(index, id);
    return {
      id,
      name,
      href: `/records/record-${id}`,
      image: demoImage(index),
      group: weightedValue(index, 11, demoCategoryValues, demoCategoryWeights),
      region: weightedValue(index, 12, demoRegionValues, demoRegionWeights),
      status: weightedValue(index, 13, demoStatusValues, demoStatusWeights),
      value1: demoValue1(index),
      value2: demoValue2(index),
      value3: Math.round(deterministicMetric(index, 3) * 9_876_543_210),
      value4:
        index % 31 === 0
          ? null
          : Math.round(deterministicMetric(index, 4) * 9_876_543),
      value5:
        index % 29 === 0
          ? 0
          : Math.round((deterministicMetric(index, 5) * 2 - 1) * 1_000_000),
      value6:
        index % 17 === 0
          ? null
          : Math.round(deterministicMetric(index, 6) * 98_765),
      value7: Math.round(deterministicMetric(index, 7) * 87_654),
      value8:
        index % 13 === 0
          ? null
          : Math.round(deterministicMetric(index, 8) * 1_000),
      value9:
        index % 11 === 0 ? 0 : Math.round(deterministicMetric(index, 9) * 999),
      value10: Number(
        (0.25 + deterministicMetric(index, 10) * 2.25).toFixed(2),
      ),
    };
  });
}

export const demoRecords = createDemoRecords();

export function RecordIdentity({
  record,
}: {
  readonly record: DemoRecord;
}): ReactElement {
  return (
    <a href={record.href}>
      {record.image ? (
        <img
          src={record.image}
          alt=""
          width={24}
          height={24}
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <span aria-hidden="true" data-testid="missing-image-placeholder">
          □
        </span>
      )}{' '}
      {record.name}
    </a>
  );
}

export function ValueCell({
  value,
}: {
  readonly value: number | null;
}): ReactElement {
  return value === null ? (
    <span
      data-testid="unknown-value"
      style={{ color: 'var(--mantine-color-text)' }}
    >
      <span aria-hidden="true">N/A</span>
      <VisuallyHidden>Unknown</VisuallyHidden>
    </span>
  ) : (
    <span data-testid="known-value">{formatDemoNumber(value)}</span>
  );
}

export function makeDemoColumns(): TableColumn<DemoRecord>[] {
  const metricColumn = (
    accessor:
      | 'value1'
      | 'value2'
      | 'value3'
      | 'value4'
      | 'value5'
      | 'value6'
      | 'value7'
      | 'value8'
      | 'value9',
    number: number,
  ): TableColumn<DemoRecord> => ({
    accessor,
    title: `Value ${number}`,
    sortable: true,
    firstSortDirection: 'desc',
    numeric: true,
    render: (record) => <ValueCell value={record[accessor]} />,
  });

  return [
    {
      accessor: 'name',
      title: 'Record',
      sortable: true,
      firstSortDirection: 'asc',
      render: (record) => <RecordIdentity record={record} />,
    },
    {
      accessor: 'group',
      title: 'Category',
      sortable: true,
      firstSortDirection: 'asc',
    },
    metricColumn('value1', 1),
    metricColumn('value2', 2),
    metricColumn('value3', 3),
    metricColumn('value4', 4),
    metricColumn('value5', 5),
    metricColumn('value6', 6),
    metricColumn('value7', 7),
    metricColumn('value8', 8),
    metricColumn('value9', 9),
  ];
}
