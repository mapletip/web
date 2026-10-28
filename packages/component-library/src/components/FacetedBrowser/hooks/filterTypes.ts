/** Renderer-independent canonical filter shapes used by the query engine. */
export type NumericRangeFilter = {
  readonly min?: number;
  readonly max?: number;
};

export function isNumericRangeFilter(
  value: unknown,
): value is NumericRangeFilter {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isInvalidNumericRange(value: unknown): boolean {
  if (!isNumericRangeFilter(value)) return false;
  const hasMin = value.min !== undefined;
  const hasMax = value.max !== undefined;
  if (hasMin && typeof value.min !== 'number') return true;
  if (hasMax && typeof value.max !== 'number') return true;
  if (hasMin && !Number.isFinite(value.min)) return true;
  if (hasMax && !Number.isFinite(value.max)) return true;
  return (
    typeof value.min === 'number' &&
    typeof value.max === 'number' &&
    value.min > value.max
  );
}

export type FacetFilterValue =
  | string
  | number
  | boolean
  | readonly string[]
  | NumericRangeFilter
  | undefined
  | null;
