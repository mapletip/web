import type { DrawerProps, StyleProp } from '@mantine/core';
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

/** Present when the navigation declares a `field`. */
interface FacetedBrowserNavigationCounts {
  /**
   * Records under each node that match the active search and committed
   * filters; a node with no match is absent (zero).
   */
  readonly counts?: ReadonlyMap<string, number> | undefined;
}

export type FacetedBrowserNavigationRenderContext =
  FacetedBrowserNavigationCounts &
    (
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
        }
    );

export type NavigationOpenedChangeReason = 'open' | 'dismiss' | 'navigate';

interface FacetedBrowserNavigationCommon {
  readonly label: string;
  readonly currentLabel: string;
  /**
   * Decorative icon for the current navigation node, shown on the mobile chip.
   */
  readonly currentIcon?: ReactNode;
  readonly currentId: string;
  /** Defaults to the current node's count when `field` is set. */
  readonly currentCount?: number | undefined;
  /**
   * Registered query field whose values are each record's navigation node
   * ids. When set, the host passes every record; FacetedBrowser lists only the
   * current node's records and gives `render` filter-aware node `counts`.
   */
  readonly field?: string | undefined;
  readonly apply: (id: string, options: { readonly replace: true }) => void;
  readonly render: (
    context: FacetedBrowserNavigationRenderContext,
  ) => ReactNode;
}

export type FacetedBrowserNavigation = FacetedBrowserNavigationCommon &
  (
    | {
        readonly opened?: never;
        readonly onOpenedChange?: never;
      }
    | {
        /** Controlled open state. Paired with `onOpenedChange`. */
        readonly opened: boolean;
        readonly onOpenedChange: (
          opened: boolean,
          reason: NavigationOpenedChangeReason,
        ) => void;
      }
  );

/**
 * Context for a browser card. Both fields exist only when the host
 * supplies record details content, so a card without details keeps its plain
 * one-argument renderer.
 */
export interface RecordCardContext {
  readonly openDetails?: () => void;
  /** True only for the card whose record owns the open details drawer. */
  readonly isDetailsOpen?: boolean;
}

/**
 * Shared content context for inline table expansion and the record drawer.
 * `surface` identifies the surrounding controls and heading.
 */
export interface RecordDetailsContentContext {
  readonly onClose: () => void;
  readonly surface: 'table' | 'drawer';
}

export type RecordDetailsChangeReason = 'open' | 'dismiss' | 'invalidate';

/**
 * Optional host-controlled record-details drawer selection. The identity is
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
  readonly reason?: 'clamp' | 'apply' | undefined;
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
  /** Drawer heading. Defaults to the record's `identityField` value in comparison mode. */
  readonly recordDetailsTitle?: (record: TRecord) => ReactNode;
  /** Optional host-controlled drawer selection. */
  readonly recordDetails?: RecordDetailsSelection;
  /** Drawer content for a selected record. Comparison mode can use row expansion content instead. */
  readonly recordDetailsContent?: (
    record: TRecord,
    context: RecordDetailsContentContext,
  ) => ReactNode;
  /** Use a side drawer at the table breakpoint. Defaults to a bottom sheet. */
  readonly recordDetailsSideOnDesktop?: boolean;
  /** Size of the record details bottom sheet. */
  readonly recordDetailsBottomSize?: DrawerProps['size'];
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
      readonly cardColumns?: never;
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
      readonly rowExpansionControl?: RowExpansionControl<TRecord>;
    }
  | {
      readonly presentation: 'cards';
      readonly renderCard: (
        record: TRecord,
        context: RecordCardContext,
      ) => ReactNode;
      /** Responsive card columns, such as `{ base: 1, md: 2 }`; one column by default. */
      readonly cardColumns?: StyleProp<number>;
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
      readonly cardColumns?: never;
    };

export type FacetedBrowserProps<TRecord extends Record<string, unknown>> =
  CommonProps<TRecord> &
    StateProps &
    DrawerStateProps &
    PresentationProps<TRecord>;
