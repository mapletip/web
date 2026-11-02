import type {
  DataTableProps,
  DataTableRowClickHandler,
} from 'mantine-datatable';
import type { ReactNode } from 'react';

export interface TableColumn<TRow extends Record<string, unknown>> {
  readonly accessor: keyof TRow & string;
  /** The visible column label. */
  readonly title: string;
  /** Full spoken expansion when the visible title is abbreviated. */
  readonly fullLabel?: string;
  readonly sortable?: boolean;
  readonly firstSortDirection?: 'asc' | 'desc';
  readonly numeric?: boolean;
  readonly textAlign?: 'left' | 'center' | 'right';
  readonly width?: number | string;
  readonly nowrap?: boolean;
  readonly ellipsis?: boolean;
  readonly cellClassName?: string;
  readonly headerClassName?: string;
  readonly resizable?: boolean;
  readonly render?: (record: TRow) => ReactNode;
}

/** A DataTable has no caption prop; callers provide the table's accessible name. */
export type TableName =
  | {
      readonly ariaLabelledBy: string;
      readonly ariaLabel?: never;
    }
  | {
      readonly ariaLabel: string;
      readonly ariaLabelledBy?: never;
    };

export type SortIntent = {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
};

export type TableProps<TRow extends Record<string, unknown>> = {
  /** Current-page records, already ordered by the host (TanStack). Never re-sorted here. */
  readonly records: readonly TRow[];
  readonly columns: readonly TableColumn<TRow>[];
  readonly idAccessor: keyof TRow & string;
  /** Identity column: rendered first and pinned left by DataTable. */
  readonly identityColumnAccessor?: keyof TRow & string;
  /** Controlled sort state; Table reports intent and never sorts rows itself. */
  readonly sortStatus?: SortIntent;
  readonly onSortChange?: (sort: SortIntent) => void;

  readonly height?: string | number;
  readonly minHeight?: string | number;
  /** Bounded height keeps DataTable's header visible within its own scroll region. */
  readonly maxHeight?: string | number;
  readonly minWidth?: string | number;
  /** Enables DataTable's published column-resize handles. */
  readonly resizable?: boolean;
  /**
   * Optional stable, nonempty namespaced override for persisted DataTable widths.
   * Omit to use the derived per-shape bucket.
   */
  readonly storeColumnsKey?: string;

  /** Forwarded to DataTable's documented style-slot class names. */
  readonly classNames?: DataTableProps<TRow>['classNames'];

  readonly withTableBorder?: boolean;
  readonly withColumnBorders?: boolean;
  readonly withRowBorders?: boolean;
  readonly borderRadius?: DataTableProps<TRow>['borderRadius'];
  readonly horizontalSpacing?: DataTableProps<TRow>['horizontalSpacing'];
  readonly verticalSpacing?: DataTableProps<TRow>['verticalSpacing'];
  readonly striped?: boolean;
  readonly highlightOnHover?: boolean;

  readonly fetching?: boolean;
  readonly emptyState?: ReactNode;
  readonly noRecordsText?: string;
  /** Host-owned detail content rendered through DataTable's rowExpansion API. */
  readonly rowExpansionContent?: (record: TRow) => ReactNode;
  /** Controlled DataTable record identities currently expanded. */
  readonly expandedRowIds?: readonly unknown[];
  readonly onExpandedRowIdsChange?: (recordIds: readonly unknown[]) => void;
  readonly allowMultipleExpandedRows?: boolean;

  readonly onRowClick?: DataTableRowClickHandler<TRow>;
  readonly rowClassName?: DataTableProps<TRow>['rowClassName'];
  readonly className?: string;
} & TableName;
