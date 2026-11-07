import type { ReactNode } from 'react';

import type { FacetDefinition } from '@/components/FacetedBrowser/FacetControls/types';
import type { BrowseState } from '@/components/FacetedBrowser/hooks/browseState';
import type { QueryFieldDefinition } from '@/components/FacetedBrowser/hooks/querySemantics';
import type { TableColumn } from '@/components/Table';

export interface BrowseSortOption {
  readonly label: string;
  readonly field: string;
  readonly direction: 'asc' | 'desc';
}

export interface StateChangeDetails {
  readonly reason?: 'clamp' | undefined;
}

interface CommonProps<TRecord extends Record<string, unknown>> {
  readonly title: ReactNode;
  readonly records: readonly TRecord[];
  readonly idAccessor: keyof TRecord & string;
  readonly queryFields?: readonly QueryFieldDefinition<TRecord>[];
  readonly searchFields?: readonly (keyof TRecord & string)[];
  readonly facets?: readonly FacetDefinition<TRecord>[];
  readonly sortOptions?: readonly BrowseSortOption[];
  readonly railNavigation?: ReactNode;
  readonly recordNoun?: string;
  /**
   * Visible noun for the result count, when the descriptive `recordNoun` is too
   * long to scan. `recordNoun` still names the records everywhere else.
   */
  readonly summaryNoun?: {
    readonly one: string;
    readonly other: string;
  };
  /**
   * Result summary shape. `page-window` (default) names the visible slice, e.g.
   * `1–25 of 98 records`; `total` names only the matching count, e.g.
   * `98 records`. Consumers opt in; the default is unchanged for existing hosts.
   */
  readonly summaryMode?: 'page-window' | 'total';
  readonly resultsLabel?: string;
  readonly searchLabel?: string;
  readonly pageSizeOptions?: readonly number[];
  /** Replaces result presentation while loading or displaying an error/unavailable state. */
  readonly status?: ReactNode;
  readonly loading?: boolean;
  readonly error?: ReactNode;
  readonly unavailable?: ReactNode;
  readonly onRetry?: () => void;
  readonly emptyState?: ReactNode;
  readonly drawerContent?: ReactNode;
  readonly getPageHref?: (page: number, nextState: BrowseState) => string;
  /**
   * Optional stable host/domain namespace for persisted DataTable widths.
   * Omit for the derived per-table-schema bucket.
   */
  readonly tableStorageKey?: string;
  /**
   * Opt-in layout: hand the leftover height to the results region instead of letting it
   * grow to its content. Pair with a host-bounded height to turn the table's own scroll
   * region into the page's vertical scroll region. Defaults to `false`, which keeps the
   * document-scrolling layout every existing consumer has.
   */
  readonly fillHeight?: boolean;
}

type StateProps =
  | {
      readonly state: BrowseState;
      readonly onStateChange: (
        nextState: BrowseState,
        details?: StateChangeDetails,
      ) => void;
      readonly defaultState?: never;
    }
  | {
      readonly state?: never;
      readonly onStateChange?: (
        nextState: BrowseState,
        details?: StateChangeDetails,
      ) => void;
      readonly defaultState?: BrowseState;
    };

type DrawerStateProps =
  | {
      readonly drawerOpened: boolean;
      readonly onDrawerOpenedChange: (opened: boolean) => void;
    }
  | {
      readonly drawerOpened?: never;
      readonly onDrawerOpenedChange?: never;
    };

type PresentationProps<TRecord extends Record<string, unknown>> =
  | {
      readonly presentation: 'comparison';
      readonly columns: readonly TableColumn<TRecord>[];
      readonly identityField: keyof TRecord & string;
      readonly renderCard: (record: TRecord) => ReactNode;
      readonly tableLabel?: string;
      /** Optional maximum height for DataTable's internal table scroll area. */
      readonly tableMaxHeight?: number | string;
      readonly rowExpansionContent?: (record: TRecord) => ReactNode;
    }
  | {
      readonly presentation: 'cards';
      readonly renderCard: (record: TRecord) => ReactNode;
      readonly columns?: never;
      readonly identityField?: never;
    }
  | {
      readonly presentation: 'custom';
      readonly renderResults: (args: {
        readonly records: readonly TRecord[];
        readonly state: BrowseState;
      }) => ReactNode;
      readonly columns?: never;
      readonly identityField?: never;
      readonly renderCard?: never;
    };

export type FacetedBrowserProps<TRecord extends Record<string, unknown>> =
  CommonProps<TRecord> &
    StateProps &
    DrawerStateProps &
    PresentationProps<TRecord>;
