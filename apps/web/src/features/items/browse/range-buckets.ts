import {
  buildQuantileBuckets,
  type FacetRangeBucket,
} from '@mapletip/component-library';

const FORMATTER = new Intl.NumberFormat('en-US');

/**
 * Builds range preset buckets for a numeric field.
 *
 * Rules:
 * - Up to 6 distinct values gives exact-value buckets.
 * - More than 6 distinct values derives quantile buckets.
 * - Fewer than 2 distinct values returns undefined (facet is omitted).
 */
export function buildRangeBuckets(
  values: readonly number[],
): readonly FacetRangeBucket[] | undefined {
  const valid = values.filter(
    (v) =>
      typeof v === 'number' &&
      Number.isFinite(v) &&
      v >= 0 &&
      Number.isInteger(v),
  );
  const distinct = Array.from(new Set(valid)).sort((a, b) => a - b);
  if (distinct.length < 2) {
    return undefined;
  }
  if (distinct.length <= 6) {
    return distinct.map((val) => ({
      value: String(val),
      label: FORMATTER.format(val),
      min: val,
      max: val,
    }));
  }
  return buildQuantileBuckets(valid);
}
