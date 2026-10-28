import type { ReactElement } from 'react';

import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';

import { BooleanControl } from './BooleanControl';
import { OptionList } from './OptionList';
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

/** Dispatches a facet definition to its shared renderer. */
export function FacetControl<TRecord extends Record<string, unknown>>({
  facet,
  value,
  counts,
  records,
  surface,
  onChange,
}: FacetControlProps<TRecord>): ReactElement {
  if (facet.renderControl) {
    return (
      <div>
        {facet.renderControl({ value, onChange, counts, records, surface })}
      </div>
    );
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
        label={facet.label}
        options={options}
        value={selected}
        onChange={(next) => onChange(next.length > 0 ? next : undefined)}
      />
    );
  }

  if (facet.kind === 'range') {
    return (
      <RangeControl label={facet.label} value={value} onChange={onChange} />
    );
  }

  return (
    <BooleanControl
      label={facet.label}
      value={value}
      counts={counts}
      onChange={onChange}
    />
  );
}
