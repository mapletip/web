import { Title } from '@mantine/core';
import { FacetedBrowser } from '@mapletip/component-library';
import type {
  BrowseState,
  FacetDefinition,
  QueryFieldDefinition,
  TableColumn,
} from '@mapletip/component-library';
import { createFileRoute, Link } from '@tanstack/react-router';

import { DemoRecordCard } from '../../demo/DemoRecordCard';
import {
  demoCategories,
  demoRarities,
  demoRecords,
  demoRegions,
  type DemoRecord,
} from '../../demo/records';

import classes from './faceted-browser.module.css';

export const Route = createFileRoute('/demo/faceted-browser')({
  head: () => ({
    meta: [
      {
        title: 'FacetedBrowser demo — MapleTip',
      },
      {
        name: 'description',
        content:
          'A server-rendered demonstration of the public MapleTip FacetedBrowser component.',
      },
    ],
  }),
  component: FacetedBrowserDemo,
});

function formatStat(value: number | null): string {
  return value === null ? 'Unknown' : String(value);
}

const columns: readonly TableColumn<DemoRecord>[] = [
  {
    accessor: 'name',
    title: 'Record',
    sortable: true,
    firstSortDirection: 'asc',
    render: (record) => <a href={record.href}>{record.name}</a>,
  },
  {
    accessor: 'category',
    title: 'Category',
    sortable: true,
    firstSortDirection: 'asc',
  },
  {
    accessor: 'region',
    title: 'Region',
    sortable: true,
    firstSortDirection: 'asc',
  },
  {
    accessor: 'rarity',
    title: 'Rarity',
    sortable: true,
    firstSortDirection: 'asc',
  },
  {
    accessor: 'level',
    title: 'Level',
    sortable: true,
    firstSortDirection: 'desc',
    numeric: true,
  },
  {
    accessor: 'attack',
    title: 'Attack',
    sortable: true,
    firstSortDirection: 'desc',
    numeric: true,
    render: (record) => formatStat(record.attack),
  },
  {
    accessor: 'defense',
    title: 'Defense',
    sortable: true,
    firstSortDirection: 'desc',
    numeric: true,
    render: (record) => formatStat(record.defense),
  },
  {
    accessor: 'speed',
    title: 'Speed',
    sortable: true,
    firstSortDirection: 'desc',
    numeric: true,
    render: (record) => formatStat(record.speed),
  },
  {
    accessor: 'tradeable',
    title: 'Tradeable',
    sortable: false,
    render: (record) => (record.tradeable ? 'Yes' : 'No'),
  },
];

const queryFields: readonly QueryFieldDefinition<DemoRecord>[] = [
  { id: 'tradeable', accessor: 'tradeable', sortable: false },
];

const facets: readonly FacetDefinition<DemoRecord>[] = [
  {
    id: 'category',
    field: 'category',
    label: 'Category',
    kind: 'multi-select',
    quick: true,
    options: demoCategories.map((value) => ({ value, label: value })),
  },
  {
    id: 'region',
    field: 'region',
    label: 'Region',
    kind: 'multi-select',
    quick: true,
    options: demoRegions.map((value) => ({ value, label: value })),
  },
  {
    id: 'rarity',
    field: 'rarity',
    label: 'Rarity',
    kind: 'multi-select',
    options: demoRarities.map((value) => ({ value, label: value })),
  },
  {
    id: 'tradeable',
    field: 'tradeable',
    label: 'Tradeable',
    kind: 'boolean',
  },
];

const defaultState: BrowseState = {
  search: '',
  filters: {},
  sort: { field: 'level', direction: 'desc' },
  page: 1,
  pageSize: 10,
  hiddenColumns: [],
};

function FacetedBrowserDemo() {
  return (
    <main className={classes['page']}>
      <Link className={classes['backLink']} to="/">
        ← Back to home
      </Link>
      <FacetedBrowser
        title={<Title order={1}>FacetedBrowser demo</Title>}
        records={demoRecords}
        idAccessor="id"
        identityField="name"
        columns={columns}
        queryFields={queryFields}
        searchFields={['name', 'category', 'region', 'rarity']}
        facets={facets}
        recordNoun="demo records"
        resultsLabel="Demo record results"
        searchLabel="Search demo records"
        pageSizeOptions={[10, 25, 50]}
        presentation="comparison"
        tableMaxHeight={560}
        tableStorageKey="mapletip:web-app:demo-faceted-browser:v1"
        renderCard={(record) => <DemoRecordCard record={record} />}
        defaultState={defaultState}
      />
    </main>
  );
}
