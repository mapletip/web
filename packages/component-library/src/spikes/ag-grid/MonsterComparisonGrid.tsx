import {
  CellStyleModule,
  ClientSideRowModelModule,
  ColumnHoverModule,
  RowAutoHeightModule,
  TooltipModule,
  ValidationModule,
  type CellKeyDownEvent,
  type ColDef,
  type FullWidthCellKeyDownEvent,
  type FirstDataRenderedEvent,
  type Module,
  type PostSortRowsParams,
  type SortChangedEvent,
  type SortDirection,
} from 'ag-grid-community';
import { AgGridReact, type CustomCellRendererProps } from 'ag-grid-react';
import { useCallback, useMemo, type ReactElement } from 'react';

import { comparisonGridTheme } from './comparisonGridTheme';
import type {
  SpikeMonster,
  SpikeMonsterNumericField,
  SpikeSort,
  SpikeSortField,
} from './fixtures';
import classes from './MonsterComparisonGrid.module.css';

const modules: Module[] = [
  ClientSideRowModelModule,
  ColumnHoverModule,
  CellStyleModule,
  RowAutoHeightModule,
  TooltipModule,
  ...(import.meta.env.DEV ? [ValidationModule] : []),
];

export const numericColumns: readonly {
  readonly field: SpikeMonsterNumericField;
  readonly headerName: string;
  readonly headerTooltip?: string;
}[] = [
  { field: 'level', headerName: 'Lv', headerTooltip: 'Level' },
  { field: 'hp', headerName: 'HP' },
  { field: 'exp', headerName: 'EXP' },
  { field: 'expPer100Hp', headerName: 'EXP/100 HP' },
  {
    field: 'weaponAttack',
    headerName: 'W.ATT',
    headerTooltip: 'Weapon attack',
  },
  { field: 'magicAttack', headerName: 'M.ATT', headerTooltip: 'Magic attack' },
  {
    field: 'weaponDefense',
    headerName: 'W.DEF',
    headerTooltip: 'Weapon defense',
  },
  {
    field: 'magicDefense',
    headerName: 'M.DEF',
    headerTooltip: 'Magic defense',
  },
  { field: 'accuracy', headerName: 'ACC', headerTooltip: 'Accuracy' },
  { field: 'avoidability', headerName: 'AVOID', headerTooltip: 'Avoidability' },
];

const numberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

/** Domain cell: unknown is visibly "—" and named "Unknown"; zero stays "0". */
function StatCell({
  value,
}: CustomCellRendererProps<SpikeMonster, number | null>): ReactElement {
  if (value === null || value === undefined) {
    return (
      <span className={classes['unknown']}>
        <span aria-hidden="true">—</span>
        <span className={classes['srOnly']}>Unknown</span>
      </span>
    );
  }
  return <>{numberFormat.format(value)}</>;
}

/** Domain identity cell: sprite (or "?" placeholder), real link, optional trait. */
function IdentityCell({
  data,
}: CustomCellRendererProps<SpikeMonster>): ReactElement | null {
  if (!data) return null;
  return (
    <span className={classes['identity']}>
      {data.sprite ? (
        <img
          className={classes['sprite']}
          src={data.sprite}
          alt=""
          width={28}
          height={28}
        />
      ) : (
        <span className={classes['missingSprite']} aria-hidden="true">
          ?
        </span>
      )}
      <span className={classes['identityText']}>
        <a className={classes['link']} href={data.href}>
          {data.name}
        </a>
        {data.boss ? <span className={classes['trait']}>Boss</span> : null}
      </span>
    </span>
  );
}

function sortFor(
  sort: SpikeSort | null,
  field: SpikeSortField,
): { sort?: SortDirection } {
  return sort?.field === field ? { sort: sort.direction } : {};
}

/**
 * Documented AG Grid hooks for link cells: Enter on a focused cell activates
 * the first link in it (cells, not their contents, receive grid focus).
 */
function activateCellLink(
  event:
    CellKeyDownEvent<SpikeMonster> | FullWidthCellKeyDownEvent<SpikeMonster>,
): void {
  const keyboardEvent = event.event;
  if (
    !(keyboardEvent instanceof KeyboardEvent) ||
    keyboardEvent.key !== 'Enter'
  )
    return;
  const cellElement = (keyboardEvent.target as HTMLElement | null)?.closest(
    '.ag-cell',
  );
  cellElement?.querySelector<HTMLAnchorElement>('a[href]')?.click();
}

/** Rows arrive already sorted by the query layer; keep that order instead of re-sorting. */
function keepSourceOrder({ nodes }: PostSortRowsParams<SpikeMonster>): void {
  nodes.sort((left, right) => left.sourceRowIndex - right.sourceRowIndex);
}

export interface MonsterComparisonGridProps {
  readonly rows: readonly SpikeMonster[];
  readonly sort: SpikeSort | null;
  readonly onSortChange: (sort: SpikeSort | null) => void;
  readonly hiddenColumns?: readonly SpikeMonsterNumericField[];
  /**
   * `fixed`: constant height; grid scrolls internally (header stays visible).
   * `auto`: grows to fit every row; page scrolls (header scrolls away).
   * `bounded`: auto height capped by `autoHeightMaxBodyHeight`; short results
   * fit their content, long results scroll internally like `fixed`.
   */
  readonly layout?: 'fixed' | 'auto' | 'bounded';
  readonly onFirstDataRendered?: (
    event: FirstDataRenderedEvent<SpikeMonster>,
  ) => void;
}

export function MonsterComparisonGrid({
  rows,
  sort,
  onSortChange,
  hiddenColumns = [],
  layout = 'fixed',
  onFirstDataRendered,
}: MonsterComparisonGridProps): ReactElement {
  const columnDefs = useMemo<ColDef<SpikeMonster>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Monster',
        pinned: 'left',
        lockPinned: true,
        width: 240,
        cellRenderer: IdentityCell,
        wrapText: true,
        autoHeight: true,
        sortingOrder: ['asc', 'desc'],
        ...sortFor(sort, 'name'),
      },
      ...numericColumns.map(
        ({ field, headerName, headerTooltip }): ColDef<SpikeMonster> => ({
          field,
          headerName,
          ...(headerTooltip ? { headerTooltip } : {}),
          type: 'rightAligned',
          width: field === 'expPer100Hp' ? 104 : 84,
          cellRenderer: StatCell,
          sortingOrder: field === 'level' ? ['asc', 'desc'] : ['desc', 'asc'],
          ...sortFor(sort, field),
          hide: hiddenColumns.includes(field),
          cellClassRules: {
            [classes['sorted'] ?? 'sorted']: (params) =>
              !!params.column.getSort(),
          },
        }),
      ),
    ],
    [hiddenColumns, sort],
  );

  const handleSortChanged = useCallback(
    (event: SortChangedEvent<SpikeMonster>) => {
      // Only user-initiated header sorts are reported; prop-driven updates are not echoed back.
      if (event.source !== 'uiColumnSorted') return;
      const sorted = event.columns?.find((column) => column.getSort());
      onSortChange(
        sorted
          ? {
              field: sorted.getColId() as SpikeSortField,
              direction: sorted.getSort() === 'asc' ? 'asc' : 'desc',
            }
          : null,
      );
    },
    [onSortChange],
  );

  return (
    <div
      className={`${classes['frame']} ${layout === 'fixed' ? classes['fixedFrame'] : ''} ${layout === 'bounded' ? classes['boundedFrame'] : ''}`}
      data-layout={layout}
    >
      <AgGridReact<SpikeMonster>
        modules={modules}
        theme={comparisonGridTheme}
        rowData={rows as SpikeMonster[]}
        columnDefs={columnDefs}
        getRowId={({ data }) => data.id}
        defaultColDef={{
          sortable: true,
          suppressMovable: true,
          resizable: false,
        }}
        domLayout={layout === 'fixed' ? 'normal' : 'autoHeight'}
        columnHoverHighlight
        suppressMultiSort
        postSortRows={keepSourceOrder}
        onSortChanged={handleSortChanged}
        enableCellTextSelection
        ensureDomOrder
        // Tab leaves cell-to-cell navigation to the browser (moves between links, then out).
        tabToNextCell={() => false}
        onCellKeyDown={activateCellLink}
        {...(onFirstDataRendered ? { onFirstDataRendered } : {})}
      />
    </div>
  );
}
