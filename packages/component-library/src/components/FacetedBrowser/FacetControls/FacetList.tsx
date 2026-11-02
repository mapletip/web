import { Divider } from '@mantine/core';
import type { ReactElement } from 'react';

import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';

import { FacetControl } from './FacetControl';
import type { FacetDefinition, FacetSurface } from './types';

export interface FacetListProps<TRecord extends Record<string, unknown>> {
  readonly facets: readonly FacetDefinition<TRecord>[];
  readonly values: Readonly<Record<string, FacetFilterValue>>;
  readonly records: readonly TRecord[];
  readonly surface: FacetSurface;
  readonly getCounts: (field: string) => ReadonlyMap<string, number>;
  readonly onChange: (field: string, value: FacetFilterValue) => void;
}

/** Renders the same facet definitions on the rail and staged drawer. */
export function FacetList<TRecord extends Record<string, unknown>>({
  facets,
  values,
  records,
  surface,
  getCounts,
  onChange,
}: FacetListProps<TRecord>): ReactElement {
  return (
    <>
      {facets.map((facet, index) => (
        <div key={`${surface}-${facet.id}`}>
          {index > 0 ? (
            <Divider my="sm" color="var(--mapletip-color-border-subtle)" />
          ) : null}
          <FacetControl
            facet={facet}
            value={values[facet.field]}
            counts={getCounts(facet.field)}
            records={records}
            surface={surface}
            onChange={(value) => onChange(facet.field, value)}
          />
        </div>
      ))}
    </>
  );
}
