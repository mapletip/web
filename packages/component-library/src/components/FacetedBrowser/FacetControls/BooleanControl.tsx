import { Checkbox, Stack } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';

import labelClasses from './FacetLabel.module.css';

export interface BooleanControlProps {
  readonly label: ReactNode;
  readonly value: FacetFilterValue;
  readonly counts: ReadonlyMap<string, number>;
  readonly onChange: (value: FacetFilterValue) => void;
}

/** Clearable yes/no checkbox facet shared by rail and drawer surfaces. */
export function BooleanControl({
  label,
  value,
  counts,
  onChange,
}: BooleanControlProps): ReactElement {
  return (
    <fieldset style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}>
      <legend className={labelClasses['label'] ?? ''}>{label}</legend>
      <Stack gap="xs" mt="xs">
        <Checkbox
          checked={value === true}
          label={`Yes (${counts.get('true') ?? 0})`}
          onChange={(event) =>
            onChange(event.currentTarget.checked ? true : undefined)
          }
        />
        <Checkbox
          checked={value === false}
          label={`No (${counts.get('false') ?? 0})`}
          onChange={(event) =>
            onChange(event.currentTarget.checked ? false : undefined)
          }
        />
      </Stack>
    </fieldset>
  );
}
