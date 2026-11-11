import type { ReactNode } from 'react';

import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';

export type FacetSurface = 'rail' | 'drawer';

export interface FacetOption {
  readonly value: string;
  readonly label: string;
  /** The host must keep each group's options contiguous; headings follow option order. */
  readonly group?: string;
}

export interface FacetOptionWithCount extends FacetOption {
  readonly count: number;
}

export interface FacetRangeBucket {
  /** Stable option id, unique within the facet. */
  readonly value: string;
  /** Human label, e.g. "1–20" or "35%". */
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
  /** Optional decorative icon shared by the rail, drawer and mobile shortcut. */
  readonly icon?: ReactNode;
  /** Boolean facets are removed only when every record has the same value. */
  readonly kind: 'multi-select' | 'range' | 'boolean';
  /** Optional labels and ordering for categorical values; values remain strings. */
  readonly options?: readonly FacetOption[];
  /**
   * Formats labels for options derived from record values when `options` is
   * omitted. The default label is the raw value.
   */
  readonly formatOption?: (options: { readonly value: string }) => string;
  /**
   * Unit appended to generated range bucket labels, such as `%`. It is only
   * used when `buckets` is `'quantile'`.
   */
  readonly unit?: string;
  /** Prefix shown once at the start of generated range labels, such as `+`. */
  readonly valuePrefix?: string;
  /**
   * Range presets for a `kind: 'range'` facet. `'quantile'` creates one exact
   * bucket per distinct value when there are at most six; above six it derives
   * readable equal-population buckets from the field's values (finite,
   * non-negative integers). It is also the facet's filtering semantics. Omit
   * for bare min/max inputs.
   */
  readonly buckets?: readonly FacetRangeBucket[] | 'quantile';
  /** Specialized controls receive the current canonical or draft value and setter. */
  readonly renderControl?: (context: FacetControlContext<TRecord>) => ReactNode;
}
