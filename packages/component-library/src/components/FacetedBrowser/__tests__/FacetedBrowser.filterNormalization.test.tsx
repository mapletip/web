import { MantineProvider } from '@mantine/core';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FacetedBrowser } from '@/components/FacetedBrowser';
import type {
  BrowseState,
  FacetDefinition,
  QueryFieldDefinition,
  StateChangeDetails,
} from '@/components/FacetedBrowser';

interface RecordWithFacets extends Record<string, unknown> {
  readonly id: string;
  readonly level: number;
  readonly rating: number;
  readonly group: string;
  readonly boss: boolean;
}

const records: readonly RecordWithFacets[] = [
  { id: 'a', level: 1, rating: 10, group: 'fixture', boss: true },
  { id: 'b', level: 2, rating: 20, group: 'other', boss: false },
  { id: 'c', level: 3, rating: 30, group: 'fixture', boss: true },
  { id: 'd', level: 4, rating: 40, group: 'other', boss: false },
];

const queryFields: readonly QueryFieldDefinition<RecordWithFacets>[] = [
  { id: 'level', accessor: 'level' },
  { id: 'rating', accessor: 'rating' },
  { id: 'group', accessor: 'group' },
  { id: 'boss', accessor: 'boss' },
];

const facets: readonly FacetDefinition<RecordWithFacets>[] = [
  {
    id: 'level',
    field: 'level',
    label: 'Level',
    kind: 'range',
    buckets: 'quantile',
  },
  {
    id: 'group',
    field: 'group',
    label: 'Group',
    kind: 'multi-select',
    options: [
      { value: 'fixture', label: 'Fixture' },
      { value: 'other', label: 'Other' },
    ],
  },
  { id: 'rating', field: 'rating', label: 'Rating', kind: 'range' },
  { id: 'boss', field: 'boss', label: 'Boss', kind: 'boolean' },
];

describe('FacetedBrowser filter normalization', () => {
  it('emits one clamp correction for unknown and malformed controlled filters', async () => {
    const onStateChange =
      vi.fn<(state: BrowseState, details?: StateChangeDetails) => void>();
    const state: BrowseState = {
      search: '',
      filters: {
        unknownField: ['unknown'],
        group: ['missing-option'],
        level: ['missing-bucket'],
        rating: { min: 10, max: 5 },
        boss: { min: 0 },
      },
      page: 1,
      pageSize: 2,
      hiddenColumns: [],
    };

    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={records}
          idAccessor="id"
          queryFields={queryFields}
          facets={facets}
          presentation="cards"
          renderCard={(record) => <span>{record.id}</span>}
          state={state}
          onStateChange={onStateChange}
        />
      </MantineProvider>,
    );

    await waitFor(() => expect(onStateChange).toHaveBeenCalledTimes(1));
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ filters: {}, page: 1 }),
      { reason: 'clamp' },
    );
  });
});
