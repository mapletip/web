import { describe, expect, it } from 'vitest';

import type { FacetRangeBucket } from '@/components/FacetedBrowser';
import { buildQuantileBuckets } from '@/components/FacetedBrowser/FacetControls/quantileBuckets';

/** How many admissible values fall inside each bucket's inclusive bounds. */
function bucketCounts(
  values: readonly number[],
  buckets: readonly FacetRangeBucket[],
): readonly number[] {
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
function expectWellFormed(
  buckets: readonly FacetRangeBucket[],
  values: readonly number[],
): void {
  for (const bucket of buckets) {
    expect(bucket.min).toBeDefined();
    expect(bucket.max).toBeDefined();
    expect(bucket.min!).toBeLessThanOrEqual(bucket.max!);
    expect('count' in bucket).toBe(false);
  }

  expect(bucketCounts(values, buckets).every((count) => count > 0)).toBe(true);

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
    expect(buildQuantileBuckets([])).toEqual([]);
  });

  it('splits by population instead of width', () => {
    const values = [1, 5, 12, 30, 45, 60, 88, 120, 199, 200];
    const buckets = buildQuantileBuckets(values);

    expect(buckets.map((bucket) => bucket.label)).toEqual([
      '1–5',
      '6–30',
      '31–60',
      '61–90',
      '91–200',
    ]);
    expect(bucketCounts(values, buckets)).toEqual([2, 2, 2, 1, 3]);
    expectWellFormed(buckets, values);
  });

  it('covers every value exactly once', () => {
    const values = [1, 5, 12, 30, 45, 60, 88, 120, 199, 200];
    const buckets = buildQuantileBuckets(values);

    expect(
      bucketCounts(values, buckets).reduce((total, count) => total + count, 0),
    ).toBe(values.length);
    expect(buckets[0]?.min).toBeLessThanOrEqual(Math.min(...values));
    expect(buckets.at(-1)?.max).toBeGreaterThanOrEqual(Math.max(...values));
  });

  it('rounds bounds onto a readable grid', () => {
    expect(buildQuantileBuckets([765, 1721]).map((b) => b.label)).toEqual([
      '750–1,750',
    ]);
    const small = Array.from({ length: 40 }, (_, index) => index + 1);
    expect(buildQuantileBuckets(small).map((b) => b.label)).toEqual([
      '1–10',
      '11–15',
      '16–20',
      '21–30',
      '31–35',
      '36–40',
    ]);
  });

  it('spreads a heavy tail instead of collapsing it', () => {
    const bulk = Array.from({ length: 90 }, (_, index) => index + 1);
    const values = [...bulk, 2_000_000];
    const buckets = buildQuantileBuckets(values);

    expect(buckets.map((bucket) => bucket.label)).toEqual([
      '1–15',
      '16–30',
      '31–45',
      '46–60',
      '61–75',
      '76–2,000,000',
    ]);
    expect(bucketCounts(values, buckets)).toEqual([15, 15, 15, 15, 15, 16]);
    expectWellFormed(buckets, values);
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
    const buckets = buildQuantileBuckets(values);

    expect(buckets.map((bucket) => bucket.label)).toEqual(['0–0', '1–10']);
    expect(bucketCounts(values, buckets)).toEqual([50, 10]);
    expectWellFormed(buckets, values);
  });

  it('merges tied quantiles instead of emitting empty or inverted buckets', () => {
    const values = [1, 1, 1, 2, 2];
    const buckets = buildQuantileBuckets(values);

    expect(buckets.map((bucket) => bucket.label)).toEqual(['1–5']);
    expect(bucketCounts(values, buckets)).toEqual([5]);
    expectWellFormed(buckets, values);
  });

  it('merges a candidate that rounding emptied', () => {
    // The first snapped bucket absorbs 12, and 25 (the next range's only value)
    // is absorbed by the second, which would leave `26–40` empty.
    const values = [5, 12, 25, 41, 60, 90];
    const buckets = buildQuantileBuckets(values);

    expect(buckets.map((bucket) => bucket.label)).toEqual([
      '5–15',
      '16–40',
      '41–60',
      '61–90',
    ]);
    expect(bucketCounts(values, buckets)).toEqual([2, 1, 2, 1]);
    expectWellFormed(buckets, values);
  });

  it('handles a single repeated value', () => {
    const buckets = buildQuantileBuckets([7, 7, 7]);

    expect(buckets).toHaveLength(1);
    expect(buckets[0]).toMatchObject({ min: 5, max: 10 });
    expectWellFormed(buckets, [7]);
  });

  it('is independent of input order', () => {
    const values = [3, 1, 2, 500, 250, 1];
    const reordered = [500, 1, 250, 2, 1, 3];

    expect(buildQuantileBuckets(reordered)).toEqual(
      buildQuantileBuckets(values),
    );
  });

  it('rejects values outside the supported numeric contract', () => {
    for (const invalid of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => buildQuantileBuckets([1, invalid])).toThrow(
        /finite, non-negative integer values/u,
      );
    }
  });

  it('is exported from the package root', async () => {
    const root = await import('@/index');
    expect(typeof root.buildQuantileBuckets).toBe('function');
    expect(root.buildQuantileBuckets).toBe(buildQuantileBuckets);
  });
});
