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
 * - If unit is provided (e.g. '%'), labels include the unit.
 * - Fewer than 2 distinct values returns undefined (facet is omitted).
 */
export function buildRangeBuckets(
  values: readonly number[],
  unit?: string,
  formatValue?: (value: number) => string,
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
  const unitSuffix = unit ?? '';
  const format =
    formatValue ?? ((value: number) => `${FORMATTER.format(value)}${unitSuffix}`);
  if (distinct.length <= 6) {
    return distinct.map((val) => ({
      value: String(val),
      label: format(val),
      min: val,
      max: val,
    }));
  }
  const quantiles = buildQuantileBuckets({ values: valid });
  return quantiles.map((bucket) =>
    bucket.min !== undefined && bucket.max !== undefined
      ? {
          ...bucket,
          label: `${format(bucket.min)}–${format(bucket.max)}`,
        }
      : bucket,
  );
}
