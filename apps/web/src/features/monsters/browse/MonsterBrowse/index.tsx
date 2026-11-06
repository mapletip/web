import { Title } from '@mantine/core';
import { FacetedBrowser } from '@mapletip/component-library';
import type {
  BrowseState,
  FacetDefinition,
  TableColumn,
} from '@mapletip/component-library';
import type { ReactElement } from 'react';

import { BUILDS, type BuildId } from '@/config/maplekit';

import { MonsterBrowseCard } from '../MonsterBrowseCard';
import {
  formatMonsterFact,
  type MonsterBrowseRow,
  type MonsterFactId,
} from '../project';

import classes from './MonsterBrowse.module.css';

export interface MonsterBrowseProps {
  readonly buildId: BuildId;
  readonly rows: readonly MonsterBrowseRow[];
}

interface StatColumnOptions {
  /** Spoken expansion when the visible title is abbreviated. */
  readonly fullLabel?: string;
  readonly firstSortDirection?: 'asc' | 'desc';
  /** Keep the header on one line for two-word or slash titles. */
  readonly nowrap?: boolean;
}

function statColumn(
  accessor: MonsterFactId,
  title: string,
  {
    fullLabel,
    firstSortDirection = 'desc',
    nowrap = false,
  }: StatColumnOptions = {},
): TableColumn<MonsterBrowseRow> {
  return {
    accessor,
    title,
    ...(fullLabel === undefined ? {} : { fullLabel }),
    ...(nowrap ? { nowrap: true } : {}),
    sortable: true,
    firstSortDirection,
    numeric: true,
    render: (record) => formatMonsterFact(record, accessor),
  };
}

function flagColumn(
  accessor: MonsterFactId,
  title: string,
): TableColumn<MonsterBrowseRow> {
  return {
    accessor,
    title,
    sortable: true,
    firstSortDirection: 'asc',
    render: (record) => formatMonsterFact(record, accessor),
  };
}

// Column headers use MapleTip's compact browse vocabulary (`W. ATT`) so the
// comparison table fits without horizontal noise; the full stat name stays as
// the spoken expansion. Plain text only: Monster detail routes do not exist
// yet, so names are not links.
//
// Exported for the feature's own unit tests (column metadata is data), never
// through the public barrel.
export const monsterBrowseColumns: readonly TableColumn<MonsterBrowseRow>[] = [
  {
    accessor: 'name',
    title: 'Name',
    sortable: true,
    firstSortDirection: 'asc',
    render: (record) => record.name,
  },
  statColumn('level', 'Level', { firstSortDirection: 'asc' }),
  statColumn('hp', 'HP'),
  statColumn('mp', 'MP'),
  statColumn('exp', 'EXP'),
  statColumn('expPer100Hp', 'EXP / 100 HP', {
    fullLabel: 'Experience per 100 HP',
    nowrap: true,
  }),
  statColumn('physicalAttack', 'W. ATT', { fullLabel: 'Weapon attack' }),
  statColumn('physicalDefense', 'W. DEF', { fullLabel: 'Weapon defense' }),
  statColumn('magicAttack', 'M. ATT', { fullLabel: 'Magic attack' }),
  statColumn('magicDefense', 'M. DEF', { fullLabel: 'Magic defense' }),
  statColumn('accuracy', 'ACC', { fullLabel: 'Accuracy' }),
  statColumn('avoidability', 'AVOID', { fullLabel: 'Avoidability' }),
  statColumn('pushed', 'KB', { fullLabel: 'Knockback damage threshold' }),
  statColumn('speed', 'Speed'),
  flagColumn('boss', 'Boss'),
  flagColumn('undead', 'Undead'),
  flagColumn('bodyAttack', 'Body attack'),
];

/** The rail already names the build; the count only needs the short noun. */
const SUMMARY_NOUN = { one: 'Monster', other: 'Monsters' } as const;

// Boolean counts are derived from the rows, never from a static taxonomy: a
// non-`known` fact is absent from the row and therefore from the facet, which is
// exactly what the honest text states.
const booleanFacets: readonly FacetDefinition<MonsterBrowseRow>[] = [
  { id: 'boss', field: 'boss', label: 'Boss', kind: 'boolean', quick: true },
  { id: 'undead', field: 'undead', label: 'Undead', kind: 'boolean' },
  {
    id: 'bodyAttack',
    field: 'bodyAttack',
    label: 'Body attack',
    kind: 'boolean',
  },
];

// Range presets are a facet capability: the shared FacetedBrowser derives them
// from the complete record set and the resolved field accessor, so this page only
// declares which fields use them. EXP / 100 HP stays a bare min/max facet.
const facets: readonly FacetDefinition<MonsterBrowseRow>[] = [
  {
    id: 'level',
    field: 'level',
    label: 'Level',
    kind: 'range',
    quick: true,
    buckets: 'quantile',
  },
  { id: 'hp', field: 'hp', label: 'HP', kind: 'range', buckets: 'quantile' },
  { id: 'exp', field: 'exp', label: 'EXP', kind: 'range', buckets: 'quantile' },
  {
    id: 'expPer100Hp',
    field: 'expPer100Hp',
    label: 'EXP / 100 HP',
    kind: 'range',
  },
  ...booleanFacets,
];

const defaultState: BrowseState = {
  search: '',
  filters: {},
  sort: { field: 'level', direction: 'asc' },
  page: 1,
  pageSize: 25,
  hiddenColumns: [],
};

export function MonsterBrowse({
  buildId,
  rows,
}: MonsterBrowseProps): ReactElement {
  const label = BUILDS[buildId].label;
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={classes['page']}
      data-fill-viewport=""
    >
      <FacetedBrowser
        title={<Title order={1}>{`MapleStory ${label} Monsters`}</Title>}
        records={rows}
        idAccessor="key"
        identityField="name"
        columns={monsterBrowseColumns}
        searchFields={['name']}
        facets={facets}
        recordNoun={`MapleStory ${label} Monsters`}
        summaryMode="total"
        summaryNoun={SUMMARY_NOUN}
        pageSizeOptions={[25, 50, 100]}
        presentation="comparison"
        // No `tableMaxHeight`: the table fills the height this page hands it, so its own
        // scroll region is the page's vertical scroll region on desktop.
        fillHeight
        tableStorageKey={`mapletip:web:monsters:${buildId}:v1`}
        renderCard={(record) => <MonsterBrowseCard record={record} />}
        defaultState={defaultState}
      />
    </main>
  );
}
