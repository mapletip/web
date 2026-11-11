import { NumberInput, Stack, Text } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import {
  isInvalidNumericRange,
  isNumericRangeFilter,
  type FacetFilterValue,
  type NumericRangeFilter,
} from '@/components/FacetedBrowser/hooks/filterTypes';

function toNumber(value: number | string): number | undefined {
  if (value === '') return undefined;
  if (typeof value === 'number') return value;
  return Number(value);
}

export interface RangeControlProps {
  readonly label: string;
  readonly labelContent?: ReactNode | undefined;
  readonly value: FacetFilterValue;
  readonly onChange: (value: FacetFilterValue) => void;
  /**
   * Suppress the visible facet heading. Parents that already show the facet
   * name (e.g. a bucketed control nesting these inputs under `Custom`) opt out;
   * standalone range facets keep it so the facet stays identifiable.
   */
  readonly hideLabel?: boolean;
}

/** Bounded numeric facet renderer shared by rail and drawer surfaces. */
export function RangeControl({
  label,
  labelContent,
  value,
  onChange,
  hideLabel = false,
}: RangeControlProps): ReactElement {
  const range: NumericRangeFilter = isNumericRangeFilter(value) ? value : {};
  const invalid = isInvalidNumericRange(value);
  const minValue =
    typeof range.min === 'number' && Number.isFinite(range.min)
      ? range.min
      : '';
  const maxValue =
    typeof range.max === 'number' && Number.isFinite(range.max)
      ? range.max
      : '';

  const updatePart = (part: 'min' | 'max', nextValue: number | string) => {
    const numeric = toNumber(nextValue);
    if (numeric !== undefined && !Number.isFinite(numeric)) return;
    const nextRange: { min?: number; max?: number } = { ...range };
    if (numeric === undefined) delete nextRange[part];
    else nextRange[part] = numeric;
    onChange(
      nextRange.min === undefined && nextRange.max === undefined
        ? undefined
        : nextRange,
    );
  };

  return (
    <Stack gap="xs">
      {hideLabel ? null : (
        <Text size="sm" fw={600} component="p" m={0}>
          {labelContent ?? label}
        </Text>
      )}
      {/* Visible labels are short ("From"/"To"); the facet name stays in the
          accessible name so several range facets on one page stay distinct. */}
      <Stack gap="xs">
        <NumberInput
          label="From"
          aria-label={`${label} from`}
          value={minValue}
          hideControls
          onChange={(next) => updatePart('min', next)}
          error={invalid ? 'Minimum must not exceed maximum.' : undefined}
        />
        <NumberInput
          label="To"
          aria-label={`${label} to`}
          value={maxValue}
          hideControls
          onChange={(next) => updatePart('max', next)}
          error={invalid ? 'Maximum must be at least the minimum.' : undefined}
        />
      </Stack>
    </Stack>
  );
}
