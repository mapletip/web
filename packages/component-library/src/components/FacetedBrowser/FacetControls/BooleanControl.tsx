import { Select } from '@mantine/core';
import type { ReactElement } from 'react';

import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';

export interface BooleanControlProps {
  readonly label: string;
  readonly value: FacetFilterValue;
  readonly counts: ReadonlyMap<string, number>;
  readonly onChange: (value: FacetFilterValue) => void;
}

/** Clearable yes/no facet renderer shared by rail and drawer surfaces. */
export function BooleanControl({
  label,
  value,
  counts,
  onChange,
}: BooleanControlProps): ReactElement {
  return (
    <Select
      label={label}
      clearable
      checkIconPosition="left"
      withAlignedLabels
      value={typeof value === 'boolean' ? String(value) : null}
      w={200}
      data={[
        { value: 'true', label: `Yes (${counts.get('true') ?? 0})` },
        { value: 'false', label: `No (${counts.get('false') ?? 0})` },
      ]}
      onChange={(next) => onChange(next === null ? undefined : next === 'true')}
    />
  );
}
