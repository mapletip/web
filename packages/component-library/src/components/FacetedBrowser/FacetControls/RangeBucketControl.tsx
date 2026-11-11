import { Checkbox, Stack } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  isNumericRangeFilter,
  type FacetFilterValue,
} from '@/components/FacetedBrowser/hooks/filterTypes';

import { OptionList } from './OptionList';
import classes from './RangeBucketControl.module.css';
import { bucketContains } from './rangeBucketFilterFn';
import { RangeControl } from './RangeControl';
import type { FacetOptionWithCount, FacetRangeBucket } from './types';

const DEFAULT_VISIBLE_BUCKETS = 3;

/** Counts arrive keyed by `String(value)`; ignore anything non-numeric. */
function numericCountKey(key: string): number | undefined {
  const trimmed = key.trim();
  if (trimmed === '') return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

function bucketCount(
  bucket: FacetRangeBucket,
  counts: ReadonlyMap<string, number>,
): number {
  let total = 0;
  for (const [key, count] of counts) {
    const value = numericCountKey(key);
    if (value !== undefined && bucketContains(bucket, value)) total += count;
  }
  return total;
}

export interface RangeBucketControlProps {
  readonly label: string;
  readonly labelContent?: ReactNode | undefined;
  readonly buckets: readonly FacetRangeBucket[];
  readonly counts: ReadonlyMap<string, number>;
  readonly value: FacetFilterValue;
  readonly onChange: (value: FacetFilterValue) => void;
  /** Number of buckets shown before "See more". Defaults to 3. */
  readonly limit?: number;
}

/**
 * Bounded numeric facet renderer with data-derived presets.
 *
 * Buckets are an `OptionList` checkbox group and OR together. `Custom` swaps the
 * selection for inclusive min/max inputs; the two filter shapes never coexist.
 */
export function RangeBucketControl({
  label,
  labelContent,
  buckets,
  counts,
  value,
  onChange,
  limit = DEFAULT_VISIBLE_BUCKETS,
}: RangeBucketControlProps): ReactElement {
  const [customChosen, setCustomChosen] = useState(false);

  // Choosing Custom leaves `value` undefined, so only a *committed* range
  // disappearing means the Custom UI is stale (a chip was removed). A global
  // reset remounts this control instead of being inferred here.
  const previousValue = useRef(value);
  useEffect(() => {
    const rangeWasCleared =
      previousValue.current !== undefined && value === undefined;
    previousValue.current = value;
    if (rangeWasCleared) setCustomChosen(false);
  }, [value]);

  const range = isNumericRangeFilter(value) ? value : undefined;
  const selectedBuckets = Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
  const showCustom = range !== undefined || customChosen;

  const options = useMemo<readonly FacetOptionWithCount[]>(
    () =>
      buckets.map((bucket) => ({
        value: bucket.value,
        label: bucket.label,
        count: bucketCount(bucket, counts),
      })),
    [buckets, counts],
  );

  const handleBucketsChange = (next: string[]) => {
    setCustomChosen(false);
    onChange(next.length > 0 ? next : undefined);
  };

  const handleCustomChange = (checked: boolean) => {
    // Checking Custom replaces checked buckets with an empty range. Recording
    // the transition in the ref keeps the reset effect from closing the inputs
    // that this click just revealed. Unchecking clears the custom range.
    previousValue.current = undefined;
    setCustomChosen(checked);
    onChange(undefined);
  };

  return (
    <OptionList
      label={labelContent ?? label}
      options={options}
      value={selectedBuckets}
      onChange={handleBucketsChange}
      limit={limit}
      footer={
        <Stack gap="xs">
          <Checkbox
            label="Custom"
            checked={showCustom}
            onChange={(event) =>
              handleCustomChange(event.currentTarget.checked)
            }
          />
          {showCustom ? (
            <div className={classes['customRange']}>
              <RangeControl
                label={label}
                value={value}
                onChange={onChange}
                hideLabel
              />
            </div>
          ) : null}
        </Stack>
      }
    />
  );
}
