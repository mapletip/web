import { Checkbox } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';

import { FacetContainer } from './FacetContainer';
import { FacetOptionGroup } from './FacetOptionGroup';

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
    <FacetContainer label={label}>
      {(labelId) => (
        <FacetOptionGroup labelId={labelId}>
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
        </FacetOptionGroup>
      )}
    </FacetContainer>
  );
}
