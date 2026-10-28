import { Button, Scroller } from '@mantine/core';
import type { ReactElement } from 'react';

import classes from '@/components/FacetedBrowser/QuickFacets/QuickFacets.module.css';

export interface QuickFacet {
  readonly id: string;
  readonly label: string;
  readonly active: number;
}

export interface QuickFacetsProps {
  readonly facets: readonly QuickFacet[];
  readonly activeTotal: number;
  readonly onOpen: (section: string | null) => void;
}

/** Mobile shortcuts that open the matching section in the filter drawer. */
export function QuickFacets({
  facets,
  activeTotal,
  onOpen,
}: QuickFacetsProps): ReactElement {
  return (
    <Scroller
      role="region"
      aria-label="Quick filters"
      classNames={{ content: classes['content'] }}
    >
      <Button
        variant="default"
        aria-label={`Filters, ${activeTotal} active. Open all filters`}
        onClick={() => onOpen(null)}
      >
        Filters{activeTotal > 0 ? ` (${activeTotal})` : null}
      </Button>
      {facets.map((facet) => (
        <Button
          key={facet.id}
          variant="default"
          aria-label={
            facet.active === 0
              ? `${facet.label}. Open ${facet.label} filters`
              : `${facet.label}, ${facet.active} active filter${facet.active === 1 ? '' : 's'}. Open ${facet.label} filters`
          }
          onClick={() => onOpen(facet.id)}
        >
          {facet.label}
          {facet.active > 0 ? ` (${facet.active})` : null}
        </Button>
      ))}
    </Scroller>
  );
}
