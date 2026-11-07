import { describe, expect, it } from 'vitest';

import { buildRangeBuckets } from '../range-buckets';

describe('range-buckets', () => {
  it('omits facet when fewer than two distinct values exist', () => {
    expect(buildRangeBuckets([])).toBeUndefined();
    expect(buildRangeBuckets([10])).toBeUndefined();
    expect(buildRangeBuckets([10, 10, 10])).toBeUndefined();
  });

  it('generates exact-value buckets for 2 to 6 distinct values', () => {
    const buckets = buildRangeBuckets([50, 100, 200, 100]);
    expect(buckets).toBeDefined();
    expect(buckets).toHaveLength(3);
    expect(buckets).toEqual([
      { value: '50', label: '50', min: 50, max: 50 },
      { value: '100', label: '100', min: 100, max: 100 },
      { value: '200', label: '200', min: 200, max: 200 },
    ]);
  });

  it('generates quantile buckets when there are more than 6 distinct values', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const buckets = buildRangeBuckets(values);
    expect(buckets).toBeDefined();
    expect(buckets!.length).toBeGreaterThan(0);
    // Quantile buckets have min and max covering ranges
    for (const bucket of buckets!) {
      expect(bucket.min).toBeDefined();
      expect(bucket.max).toBeDefined();
      expect(bucket.min!).toBeLessThanOrEqual(bucket.max!);
    }
  });

  it('filters out non-integer, negative, or invalid numeric values', () => {
    const buckets = buildRangeBuckets([10, 20, -5, 1.5, NaN]);
    expect(buckets).toBeDefined();
    expect(buckets).toHaveLength(2);
    expect(buckets![0]?.min).toBe(10);
    expect(buckets![1]?.min).toBe(20);
  });
});
