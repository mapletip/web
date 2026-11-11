import type { Row } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';

import {
  bucketContains,
  createRangeBucketFilterFn,
} from '@/components/FacetedBrowser/FacetControls/rangeBucketFilterFn';
import type { FacetRangeBucket } from '@/components/FacetedBrowser/FacetControls/types';
import { facetedBrowserFeatures } from '@/components/FacetedBrowser/hooks/tableFeatures';

type TestRecord = Record<string, unknown>;
type TestRow = Row<typeof facetedBrowserFeatures, TestRecord>;

function row(value: unknown): TestRow {
  return { getValue: () => value } as unknown as TestRow;
}

// IDs are opaque: `-20-5` is a valid bucket id but cannot be parsed as numbers.
const buckets: readonly FacetRangeBucket[] = [
  { value: '-20-5', label: '−20–5', min: -20, max: 5 },
  { value: '6-10', label: '6–10', min: 6, max: 10 },
  { value: '11-20', label: '11–20', min: 11, max: 20 },
];

const filter = createRangeBucketFilterFn<TestRecord>(buckets);

describe('createRangeBucketFilterFn', () => {
  it('passes everything through when no numeric filter is active', () => {
    expect(filter(row(5), 'level', undefined)).toBe(true);
    expect(filter(row(5), 'level', null)).toBe(true);
    expect(filter(row(5), 'level', [])).toBe(true);
    expect(filter(row(undefined), 'level', undefined)).toBe(true);
  });

  it('ORs selected bucket ids and uses their inclusive bounds', () => {
    expect(filter(row(-20), 'level', ['-20-5', '11-20'])).toBe(true);
    expect(filter(row(5), 'level', ['-20-5', '11-20'])).toBe(true);
    expect(filter(row(11), 'level', ['-20-5', '11-20'])).toBe(true);
    expect(filter(row(20), 'level', ['-20-5', '11-20'])).toBe(true);
    expect(filter(row(6), 'level', ['-20-5', '11-20'])).toBe(false);
    expect(filter(row(10), 'level', ['-20-5', '11-20'])).toBe(false);
  });

  it('rounds decimal values consistently for bucket counts and filters', () => {
    const decimalBuckets: readonly FacetRangeBucket[] = [
      {
        value: 'low',
        label: '0.3–0.5',
        min: 0.3,
        max: 0.5,
        decimalPlaces: 2,
      },
      {
        value: 'high',
        label: '0.51–0.75',
        min: 0.51,
        max: 0.75,
        decimalPlaces: 2,
      },
    ];
    const decimalFilter = createRangeBucketFilterFn<TestRecord>(decimalBuckets);

    expect(bucketContains(decimalBuckets[0]!, 0.504)).toBe(true);
    expect(decimalFilter(row(0.504), 'ratio', ['low'])).toBe(true);
    expect(bucketContains(decimalBuckets[1]!, 0.505)).toBe(true);
    expect(decimalFilter(row(0.505), 'ratio', ['high'])).toBe(true);
    expect(decimalFilter(row(0.505), 'ratio', ['low'])).toBe(false);
    expect(bucketContains(decimalBuckets[1]!, 0.754)).toBe(true);
    expect(bucketContains(decimalBuckets[1]!, 0.755)).toBe(false);
  });

  it('does not parse negative bucket ids back into numbers', () => {
    expect(filter(row(-10), 'level', ['-20-5'])).toBe(true);
    expect(filter(row(7), 'level', ['-20-5'])).toBe(false);
    expect(filter(row(7), 'level', ['6-10'])).toBe(true);
    expect(filter(row(7), 'level', ['unknown-bucket'])).toBe(false);
  });

  it('applies inclusive between semantics to a custom range', () => {
    expect(filter(row(6), 'level', { min: 6, max: 10 })).toBe(true);
    expect(filter(row(10), 'level', { min: 6, max: 10 })).toBe(true);
    expect(filter(row(5), 'level', { min: 6, max: 10 })).toBe(false);
    expect(filter(row(11), 'level', { min: 6, max: 10 })).toBe(false);
    expect(filter(row(1), 'level', { min: 1 })).toBe(true);
    expect(filter(row(99), 'level', { max: 10 })).toBe(false);
  });

  it('never matches a non-numeric row value against a numeric filter', () => {
    expect(filter(row(undefined), 'level', ['-20-5'])).toBe(false);
    expect(filter(row(null), 'level', ['-20-5'])).toBe(false);
    expect(filter(row('7'), 'level', ['6-10'])).toBe(false);
    expect(filter(row('7'), 'level', { min: 6, max: 10 })).toBe(false);
    expect(filter(row(Number.NaN), 'level', { min: 6, max: 10 })).toBe(false);
  });
});
