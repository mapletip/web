import type { FacetRangeBucket } from './types';

/**
 * Deterministic readable buckets for finite, non-negative integer values.
 *
 * Heavy-tailed numeric fields (monster HP spans 30 → 2.1 billion) make
 * equal-width buckets useless: one bucket holds almost every row and the rest are
 * effectively empty. Quantile cuts keep one bucket from dominating. Small
 * domains use exact values so a preset never combines distinct choices.
 *
 * Raw order statistics ("765–1,721") are then rounded outward onto a shared grid
 * (5s below 100, then 25s, 250s, …) so labels are scannable while staying narrow
 * enough that neighbouring buckets remain distinct. A bucket always ends on a grid
 * line and the next starts at the following integer: ranges are inclusive,
 * contiguous, non-overlapping and every admissible value belongs to exactly one
 * bucket. Rounding up can swallow a narrow quantile range whole; that range then
 * has no value to claim and merges into the bucket above rather than becoming
 * empty or inverted.
 *
 * The supported domain is deliberately explicit: finite, non-negative, integer
 * numbers. Unknown values are excluded by the caller before they reach here, while
 * a present value outside this contract is a programming error rather than
 * something to bucket silently.
 */
const TARGET_BUCKETS = 6;
const MIN_GRID_STEP = 5;
const FORMATTER = new Intl.NumberFormat('en-US');

function formatValue({
  value,
  unit,
  valuePrefix,
}: {
  readonly value: number;
  readonly unit?: string | undefined;
  readonly valuePrefix?: string | undefined;
}): string {
  return `${valuePrefix ?? ''}${FORMATTER.format(value)}${unit ?? ''}`;
}

function assertSupportedValue(value: number): void {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new Error(
      `FacetedBrowser: quantile buckets require finite, non-negative integer values, received ${String(value)}.`,
    );
  }
}

/**
 * Rounding grid for one bound, sized from the bound itself rather than the facet
 * span: one field can span both `1–20` and hundreds of millions, and a shared step
 * would either erase the small buckets or leave the large ones unreadable.
 */
function gridStep(value: number): number {
  if (Math.abs(value) < 100) return MIN_GRID_STEP;
  return 10 ** (Math.floor(Math.log10(Math.abs(value))) - 1) * 2.5;
}

function roundUpToGrid(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

function roundDownToGrid(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

/**
 * Start of the lowest bucket. Flooring the observed minimum widens the range to a
 * grid line (`765` → `750`), except when that would advertise a value the facet
 * cannot hold: a level range starts at 1, not 0.
 */
function firstBound(observedMin: number): number {
  const step = gridStep(observedMin);
  const floored = roundDownToGrid(observedMin, step);
  return observedMin >= step && floored >= 0 ? floored : observedMin;
}

/**
 * Cut points at the requested quantiles of the sorted values. A cut is the first
 * value of the next range, so repeated values make several quantiles coincide; a
 * cut that does not clear the current start would emit an empty or inverted range
 * and is skipped instead.
 */
function cutPoints(sorted: readonly number[]): number[] {
  const cuts: number[] = [];
  for (let index = 1; index < TARGET_BUCKETS; index += 1) {
    const cut = sorted[Math.floor((index * sorted.length) / TARGET_BUCKETS)];
    if (cut === undefined) break;
    if (cut <= (cuts.at(-1) ?? sorted[0]!)) continue;
    cuts.push(cut);
  }
  return cuts;
}

export interface BuildQuantileBucketsOptions {
  readonly values: readonly number[];
  readonly unit?: string | undefined;
  readonly valuePrefix?: string | undefined;
}

export function buildQuantileBuckets({
  values,
  unit,
  valuePrefix,
}: BuildQuantileBucketsOptions): readonly FacetRangeBucket[] {
  for (const value of values) assertSupportedValue(value);
  if (values.length === 0) return [];

  const sorted = [...values].sort((left, right) => left - right);
  const distinct = [...new Set(sorted)];
  if (distinct.length <= TARGET_BUCKETS) {
    return distinct.map((value) => ({
      value: String(value),
      label: formatValue({ value, unit, valuePrefix }),
      min: value,
      max: value,
    }));
  }

  const observedMin = sorted[0]!;
  const observedMax = sorted.at(-1)!;

  const bounds: { min: number; max: number }[] = [];
  let min = firstBound(observedMin);

  // The final cut sits one past the observed maximum so the last range is the
  // remainder, exactly like the quantile cuts before it.
  for (const cut of [...cutPoints(sorted), observedMax + 1]) {
    const rawMax = cut - 1;
    // Absorbed by an earlier rounded bound: this range has no value left.
    if (rawMax < min) continue;

    const max = roundUpToGrid(rawMax, gridStep(rawMax));
    bounds.push({ min, max });
    min = max + 1;
  }

  // Rounding the previous bound upward can absorb this range's first value, so a
  // candidate may contain no value at all. Merge it into the bucket above instead
  // of rendering an empty option; the merged range still ends on its grid line and
  // the next bucket stays contiguous.
  const merged: { min: number; max: number }[] = [];
  for (const bound of bounds) {
    const containsValue = sorted.some(
      (value) => value >= bound.min && value <= bound.max,
    );
    const previous = merged.at(-1);
    if (!containsValue && previous !== undefined) {
      previous.max = bound.max;
      continue;
    }
    merged.push({ ...bound });
  }

  return merged.map((bound) => ({
    value: `${String(bound.min)}-${String(bound.max)}`,
    label: `${formatValue({ value: bound.min, unit, valuePrefix })}–${formatValue({ value: bound.max, unit })}`,
    min: bound.min,
    max: bound.max,
  }));
}
