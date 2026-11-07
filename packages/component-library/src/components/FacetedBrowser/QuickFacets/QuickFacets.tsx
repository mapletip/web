import { Button, Scroller } from '@mantine/core';
import { CaretDown } from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import classes from '@/components/FacetedBrowser/QuickFacets/QuickFacets.module.css';

export interface QuickFacet {
  readonly id: string;
  readonly label: string;
  readonly active: number;
}

export interface QuickFacetsNavigation {
  readonly label: string;
  readonly currentLabel: string;
  readonly onOpen: () => void;
}

export interface QuickFacetsProps {
  readonly facets: readonly QuickFacet[];
  readonly activeTotal: number;
  readonly onOpen: (section: string | null) => void;
  readonly navigation?: QuickFacetsNavigation | undefined;
  readonly hasFilters?: boolean | undefined;
}

/** Mobile shortcuts that open the matching section in the filter drawer or navigation drawer. */
export function QuickFacets({
  facets,
  activeTotal,
  onOpen,
  navigation,
  hasFilters = facets.length > 0,
}: QuickFacetsProps): ReactElement {
  return (
    <Scroller
      role="region"
      aria-label="Quick filters"
      classNames={{ content: classes['content'] }}
    >
      {navigation ? (
        <Button
          variant="default"
          rightSection={<CaretDown size={14} aria-hidden="true" />}
          aria-label={`${navigation.label}: ${navigation.currentLabel}. Open ${navigation.label}`}
          onClick={navigation.onOpen}
        >
          {navigation.currentLabel}
        </Button>
      ) : null}
      {hasFilters ? (
        <Button
          variant="default"
          aria-label={`Filters, ${activeTotal} active. Open all filters`}
          onClick={() => onOpen(null)}
        >
          Filters{activeTotal > 0 ? ` (${activeTotal})` : null}
        </Button>
      ) : null}
      {facets.map((facet) => {
        let ariaLabel = `${facet.label}. Open ${facet.label} filters`;
        if (facet.active > 0) {
          const suffix = facet.active === 1 ? '' : 's';
          ariaLabel = `${facet.label}, ${facet.active} active filter${suffix}. Open ${facet.label} filters`;
        }

        return (
          <Button
            key={facet.id}
            variant="default"
            aria-label={ariaLabel}
            onClick={() => onOpen(facet.id)}
          >
            {facet.label}
            {facet.active > 0 ? ` (${facet.active})` : null}
          </Button>
        );
      })}
    </Scroller>
  );
}
