import {
  isInvalidNumericRange,
  isNumericRangeFilter,
} from '@/components/FacetedBrowser/hooks/filterTypes';
import type { FieldFilterFn } from '@/components/FacetedBrowser/hooks/querySemantics';

import type { FacetRangeBucket } from './types';

/**
 * One authority for inclusive bucket membership, shared by query filtering and
 * by the control that sums the engine's counts. A boundary can therefore never
 * be reported by a count but rejected by the filter.
 */
export function bucketContains(
  bucket: FacetRangeBucket,
  value: number,
): boolean {
  if (bucket.min !== undefined && value < bucket.min) return false;
  if (bucket.max !== undefined && value > bucket.max) return false;
  return true;
}

/**
 * Builds the query-field filter for a bucketed range facet.
 *
 * The bucket definitions and this filter must agree: the same `buckets` array
 * feeds both the control a visitor sees and the query that runs, so neither can
 * drift. Bucket IDs are opaque lookup keys, never parsed back into bounds
 * (negative stats make IDs like `-20-5` ambiguous). Non-numeric row values never
 * match a numeric filter or bucket, so an `unknown` fact cannot satisfy a range
 * query.
 */
export function createRangeBucketFilterFn<
  TRecord extends Record<string, unknown>,
>(buckets: readonly FacetRangeBucket[]): FieldFilterFn<TRecord> {
  const bucketsById = new Map(
    buckets.map((bucket) => [bucket.value, bucket] as const),
  );

  return (row, columnId, filterValue) => {
    if (filterValue === undefined || filterValue === null) return true;

    const dataValue = row.getValue(columnId);

    if (Array.isArray(filterValue)) {
      if (filterValue.length === 0) return true;
      if (typeof dataValue !== 'number' || !Number.isFinite(dataValue)) {
        return false;
      }
      return filterValue.some((bucketId) => {
        if (typeof bucketId !== 'string') return false;
        const bucket = bucketsById.get(bucketId);
        return bucket !== undefined && bucketContains(bucket, dataValue);
      });
    }

    if (!isNumericRangeFilter(filterValue)) return false;
    if (isInvalidNumericRange(filterValue)) return false;
    if (typeof dataValue !== 'number' || !Number.isFinite(dataValue)) {
      return false;
    }

    const { min, max } = filterValue;
    return (
      (min === undefined || dataValue >= min) &&
      (max === undefined || dataValue <= max)
    );
  };
}
