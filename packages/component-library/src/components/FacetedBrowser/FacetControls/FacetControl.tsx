import { Group } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';

import { BooleanControl } from './BooleanControl';
import { FacetContainer } from './FacetContainer';
import { OptionList } from './OptionList';
import { RangeBucketControl } from './RangeBucketControl';
import { RangeControl } from './RangeControl';
import type {
  FacetControlContext,
  FacetDefinition,
  FacetOptionWithCount,
} from './types';

export interface FacetControlProps<TRecord extends Record<string, unknown>> {
  readonly facet: FacetDefinition<TRecord>;
  readonly value: FacetFilterValue;
  readonly counts: ReadonlyMap<string, number>;
  readonly records: readonly TRecord[];
  readonly surface: FacetControlContext<TRecord>['surface'];
  readonly onChange: (value: FacetFilterValue) => void;
}

function facetLabel(label: string, icon: ReactNode | undefined): ReactNode {
  if (icon === undefined) return label;
  return (
    <Group component="span" gap={6} wrap="nowrap">
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Group>
  );
}

/** Dispatches a facet definition to its shared renderer. */
export function FacetControl<TRecord extends Record<string, unknown>>({
  facet,
  value,
  counts,
  records,
  surface,
  onChange,
}: FacetControlProps<TRecord>): ReactElement {
  const labelContent = facetLabel(facet.label, facet.icon);

  if (facet.renderControl) {
    const control = facet.renderControl({
      value,
      onChange,
      counts,
      records,
      surface,
    });
    if (facet.icon === undefined) return <div>{control}</div>;

    return <FacetContainer label={labelContent}>{control}</FacetContainer>;
  }

  if (facet.kind === 'multi-select') {
    const selected = Array.isArray(value) ? Array.from(value) : [];
    const options: readonly FacetOptionWithCount[] = facet.options
      ? facet.options.map((option) => ({
          ...option,
          count: counts.get(option.value) ?? 0,
        }))
      : [...counts.entries()]
          .map(([optionValue, count]) => ({
            value: optionValue,
            label: optionValue,
            count,
          }))
          .sort((left, right) => left.label.localeCompare(right.label));

    return (
      <OptionList
        label={labelContent}
        options={options}
        value={selected}
        onChange={(next) => onChange(next.length > 0 ? next : undefined)}
      />
    );
  }

  if (facet.kind === 'range') {
    // FacetedBrowser resolves 'quantile' into concrete buckets before rendering.
    const buckets =
      typeof facet.buckets === 'string' ? undefined : facet.buckets;
    if (buckets !== undefined && buckets.length > 0) {
      return (
        <RangeBucketControl
          label={facet.label}
          labelContent={labelContent}
          buckets={buckets}
          counts={counts}
          value={value}
          onChange={onChange}
        />
      );
    }

    return (
      <RangeControl
        label={facet.label}
        labelContent={labelContent}
        value={value}
        onChange={onChange}
      />
    );
  }

  return (
    <BooleanControl
      label={labelContent}
      value={value}
      counts={counts}
      onChange={onChange}
    />
  );
}
