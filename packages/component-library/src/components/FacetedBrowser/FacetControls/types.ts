import type { ReactNode } from 'react';

import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';

export type FacetSurface = 'rail' | 'drawer';

export interface FacetOption {
  readonly value: string;
  readonly label: string;
}

export interface FacetOptionWithCount extends FacetOption {
  readonly count: number;
}

export interface FacetRangeBucket {
  /** Stable option id, unique within the facet. */
  readonly value: string;
  /** Human label, e.g. "1–20". */
  readonly label: string;
  readonly min?: number;
  readonly max?: number;
}

export interface FacetControlContext<TRecord extends Record<string, unknown>> {
  readonly value: FacetFilterValue;
  readonly onChange: (value: FacetFilterValue) => void;
  readonly counts: ReadonlyMap<string, number>;
  readonly records: readonly TRecord[];
  readonly surface: FacetSurface;
}

export interface FacetDefinition<TRecord extends Record<string, unknown>> {
  /** Unique UI identifier used by quick facets. */
  readonly id: string;
  /** Registered TanStack query-field ID used by the canonical filter state. */
  readonly field: string;
  readonly label: string;
  readonly kind: 'multi-select' | 'range' | 'boolean';
  readonly quick?: boolean;
  /** Optional labels and ordering for categorical values; values remain strings. */
  readonly options?: readonly FacetOption[];
  /**
   * Range presets for a `kind: 'range'` facet. `'quantile'` derives six readable
   * equal-population buckets from the field's values (finite, non-negative
   * integers) and is also the facet's filtering semantics. Omit for bare
   * min/max inputs.
   */
  readonly buckets?: readonly FacetRangeBucket[] | 'quantile';
  /** Specialized controls receive the current canonical or draft value and setter. */
  readonly renderControl?: (context: FacetControlContext<TRecord>) => ReactNode;
}
