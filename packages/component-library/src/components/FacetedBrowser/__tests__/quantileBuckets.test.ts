import { describe, expect, it } from 'vitest';

import type { FacetRangeBucket } from '@/components/FacetedBrowser';
import { buildQuantileBuckets } from '@/components/FacetedBrowser/FacetControls/quantileBuckets';

/** How many admissible values fall inside each bucket's inclusive bounds. */
function bucketCounts({
  values,
  buckets,
}: {
  readonly values: readonly number[];
  readonly buckets: readonly FacetRangeBucket[];
}): readonly number[] {
  return buckets.map(
    (bucket) =>
      values.filter(
        (value) =>
          (bucket.min === undefined || value >= bucket.min) &&
          (bucket.max === undefined || value <= bucket.max),
      ).length,
  );
}

/** Ascending, contiguous, non-overlapping, none empty, unique ids. */
function expectWellFormed({
  buckets,
  values,
}: {
  readonly buckets: readonly FacetRangeBucket[];
  readonly values: readonly number[];
}): void {
  for (const bucket of buckets) {
    expect(bucket.min).toBeDefined();
    expect(bucket.max).toBeDefined();
    expect(bucket.min!).toBeLessThanOrEqual(bucket.max!);
    expect('count' in bucket).toBe(false);
  }

  expect(bucketCounts({ values, buckets }).every((count) => count > 0)).toBe(
    true,
  );

  for (const [index, bucket] of buckets.entries()) {
    const previous = buckets[index - 1];
    if (previous === undefined) continue;
    expect(previous.max!).toBeLessThan(bucket.min!);
    expect(bucket.min!).toBe(previous.max! + 1);
    expect(previous.value).not.toBe(bucket.value);
  }

  expect(new Set(buckets.map((bucket) => bucket.value)).size).toBe(
    buckets.length,
  );
}

describe('buildQuantileBuckets', () => {
  it('returns no buckets when nothing is admissible', () => {
    expect(buildQuantileBuckets({ values: [] })).toEqual([]);
  });

  it('creates one exact bucket per distinct value at six or fewer', () => {
    const buckets = buildQuantileBuckets({ values: [35, 10, 35, 25, 10] });

    expect(buckets).toEqual([
      { value: '10', label: '10', min: 10, max: 10 },
      { value: '25', label: '25', min: 25, max: 25 },
      { value: '35', label: '35', min: 35, max: 35 },
    ]);
  });

  it('adds a unit to exact and quantile labels only', () => {
    const exact = buildQuantileBuckets({ values: [35], unit: '%' });
    expect(exact[0]?.label).toBe('35%');
    expect(exact[0]?.value).toBe('35');

    const values = [1, 5, 12, 30, 45, 60, 88, 120, 199, 200];
    const quantiles = buildQuantileBuckets({ values, unit: '%' });
    expect(quantiles.map((bucket) => bucket.label)).toEqual([
      '1%–5%',
      '6%–30%',
      '31%–60%',
      '61%–90%',
      '91%–200%',
    ]);
    expect(quantiles.map((bucket) => bucket.value)).toEqual([
      '1-5',
      '6-30',
      '31-60',
      '61-90',
      '91-200',
    ]);
  });

  it('splits larger domains by population instead of width', () => {
    const values = [1, 5, 12, 30, 45, 60, 88, 120, 199, 200];
    const buckets = buildQuantileBuckets({ values });

    expect(buckets.map((bucket) => bucket.label)).toEqual([
      '1–5',
      '6–30',
      '31–60',
      '61–90',
      '91–200',
    ]);
    expect(bucketCounts({ values, buckets })).toEqual([2, 2, 2, 1, 3]);
    expectWellFormed({ buckets, values });
  });

  it('covers every value exactly once', () => {
    const values = [1, 5, 12, 30, 45, 60, 88, 120, 199, 200];
    const buckets = buildQuantileBuckets({ values });

    expect(
      bucketCounts({ values, buckets }).reduce(
        (total, count) => total + count,
        0,
      ),
    ).toBe(values.length);
    expect(buckets[0]?.min).toBeLessThanOrEqual(Math.min(...values));
    expect(buckets.at(-1)?.max).toBeGreaterThanOrEqual(Math.max(...values));
  });

  it('uses readable snapped bounds for larger ranges', () => {
    const values = Array.from({ length: 40 }, (_, index) => index + 1);
    const buckets = buildQuantileBuckets({ values });

    expect(buckets.map((bucket) => bucket.label)).toEqual([
      '1–10',
      '11–15',
      '16–20',
      '21–30',
      '31–35',
      '36–40',
    ]);
    expectWellFormed({ buckets, values });
  });

  it('spreads a heavy tail instead of collapsing it', () => {
    const bulk = Array.from({ length: 90 }, (_, index) => index + 1);
    const values = [...bulk, 2_000_000];
    const buckets = buildQuantileBuckets({ values });

    expect(buckets.map((bucket) => bucket.label)).toEqual([
      '1–15',
      '16–30',
      '31–45',
      '46–60',
      '61–75',
      '76–2,000,000',
    ]);
    expect(bucketCounts({ values, buckets })).toEqual([15, 15, 15, 15, 15, 16]);
    expectWellFormed({ buckets, values });
  });

  it('keeps a known zero instead of treating it as unknown', () => {
    const values = [
      ...Array.from({ length: 50 }, () => 0),
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
    ];
    const buckets = buildQuantileBuckets({ values });

    expect(buckets.map((bucket) => bucket.label)).toEqual(['0–0', '1–10']);
    expect(bucketCounts({ values, buckets })).toEqual([50, 10]);
    expectWellFormed({ buckets, values });
  });

  it('is independent of input order', () => {
    const values = [3, 1, 2, 500, 250, 100, 1];
    const reordered = [500, 1, 250, 2, 1, 3, 100];

    expect(buildQuantileBuckets({ values: reordered })).toEqual(
      buildQuantileBuckets({ values }),
    );
  });

  it('rejects values outside the supported numeric contract', () => {
    for (const invalid of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => buildQuantileBuckets({ values: [1, invalid] })).toThrow(
        /finite, non-negative integer values/u,
      );
    }
  });
});
