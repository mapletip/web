import type { ReactNode } from 'react';

import type { FacetDefinition } from '@/components/FacetedBrowser/FacetControls/types';
import type { BrowseState } from '@/components/FacetedBrowser/hooks/browseState';
import type { QueryFieldDefinition } from '@/components/FacetedBrowser/hooks/querySemantics';
import type {
  PageLinkRenderOptions,
  PageLinkRenderProps,
  PageLinkRenderer,
} from '@/components/FacetedBrowser/Pagination/Pagination';
import type {
  RowExpansionControl,
  TableColumn,
  TableProps,
} from '@/components/Table';

export type { PageLinkRenderOptions, PageLinkRenderProps, PageLinkRenderer };

export interface FacetedBrowserNavigationDrawerNode {
  readonly id: string;
  readonly count?: number | undefined;
}

export interface FacetedBrowserNavigationDrawerMeta {
  readonly isLeaf: boolean;
}

export type FacetedBrowserNavigationRenderContext =
  | {
      readonly mode: 'rail';
      readonly onNavigate?: (() => void) | undefined;
      readonly selectedId?: never;
      readonly onSelect?: never;
    }
  | {
      readonly mode: 'drawer';
      readonly selectedId: string;
      readonly onSelect: (
        node: FacetedBrowserNavigationDrawerNode,
        meta: FacetedBrowserNavigationDrawerMeta,
      ) => void;
      readonly onNavigate?: never;
    };

export type NavigationOpenedChangeReason = 'open' | 'dismiss' | 'navigate';

export interface FacetedBrowserNavigation {
  readonly label: string;
  readonly currentLabel: string;
  /**
   * Decorative icon for the current navigation node, shown on the mobile chip.
   */
  readonly currentIcon?: ReactNode;
  readonly currentId: string;
  readonly currentCount?: number | undefined;
  readonly apply: (id: string, options: { readonly replace: true }) => void;
  /** Optional controlled open state. Omit to keep internal open state. */
  readonly opened?: boolean;
  readonly onOpenedChange?: (
    opened: boolean,
    reason: NavigationOpenedChangeReason,
  ) => void;
  readonly render: (
    context: FacetedBrowserNavigationRenderContext,
  ) => ReactNode;
}

/**
 * Context for a comparison-mode card. Both fields exist only when the host
 * supplies `rowExpansionContent`, so a card without details keeps its plain
 * one-argument renderer.
 */
export interface RecordCardContext {
  readonly openDetails?: () => void;
  /** True only for the card whose record owns the open details drawer. */
  readonly isDetailsOpen?: boolean;
}

/**
 * Host content is rendered inline through DataTable on desktop and in the
 * shared details drawer on mobile. `surface` lets the host vary heading and
 * close chrome without introducing a second content callback.
 */
export interface RecordDetailsContentContext {
  readonly onClose: () => void;
  readonly surface: 'table' | 'drawer';
}

export type RecordDetailsChangeReason = 'open' | 'dismiss' | 'invalidate';

/**
 * Optional host-controlled mobile record-details selection. The identity is
 * normalized to a string so it can round-trip through route location state.
 */
export interface RecordDetailsSelection {
  readonly selectedId: string | null;
  readonly onSelectedIdChange: (
    selectedId: string | null,
    reason: RecordDetailsChangeReason,
  ) => void;
}

export type DrawerOpenedChangeReason =
  'open' | 'dismiss' | 'apply' | 'invalidate';

export interface DrawerOpenedChangeDetails {
  readonly reason: DrawerOpenedChangeReason;
}

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
  /** Hides the desktop rail's visible "Filters" heading while keeping its label. */
  readonly showFilterHeading?: boolean;
  /** Optional label for the filter drawer's apply action. */
  readonly filterDrawerApplyLabel?: string;
  /**
   * Optional responsive category navigation configuration.
   *
   * On md and wider viewports, rendered at the top of the rail above filters.
   * Below md, rendered as a quick-filter navigation chip opening a dedicated
   * navigation drawer.
   */
  readonly navigation?: FacetedBrowserNavigation;
  readonly sortOptions?: readonly BrowseSortOption[];
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
  /**
   * Optional host page-link renderer. When provided, pagination controls and
   * items render through this adapter (e.g. producing TanStack Router `<Link>`
   * elements) instead of plain buttons.
   */
  readonly renderPageLink?: PageLinkRenderer | undefined;
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
      readonly onDrawerOpenedChange: (
        opened: boolean,
        details?: DrawerOpenedChangeDetails,
      ) => void;
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
      readonly renderCard: (
        record: TRecord,
        context: RecordCardContext,
      ) => ReactNode;
      readonly tableLabel?: string;
      /** Optional maximum height for DataTable's internal table scroll area. */
      readonly tableMaxHeight?: number | string;
      /** Vertical padding for comparison-table cells. */
      readonly tableVerticalSpacing?: TableProps<TRecord>['verticalSpacing'];
      readonly rowExpansionContent?: (
        record: TRecord,
        context: RecordDetailsContentContext,
      ) => ReactNode;
      /** Drawer heading. Defaults to the record's `identityField` value. */
      readonly recordDetailsTitle?: (record: TRecord) => ReactNode;
      /** Optional host-controlled mobile selection; desktop expansion is unchanged. */
      readonly recordDetails?: RecordDetailsSelection;
      readonly rowExpansionControl?: RowExpansionControl<TRecord>;
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
