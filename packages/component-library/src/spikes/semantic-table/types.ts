import type {
  SpikeMonster,
  SpikeMonsterNumericField,
  SpikeSort,
} from '../ag-grid/fixtures';

/** Props shared by every semantic-table candidate in the spikes. */
export interface MonsterTableProps {
  readonly rows: readonly SpikeMonster[];
  readonly caption: string;
  readonly sort: SpikeSort | null;
  readonly onSortChange: (sort: SpikeSort) => void;
  readonly hiddenColumns?: readonly SpikeMonsterNumericField[];
}
