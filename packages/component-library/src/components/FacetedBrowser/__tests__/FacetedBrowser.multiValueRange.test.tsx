import { MantineProvider } from '@mantine/core';
import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FacetedBrowser } from '@/components/FacetedBrowser';
import type {
  BrowseSortOption,
  BrowseState,
  FacetDefinition,
  QueryFieldDefinition,
} from '@/components/FacetedBrowser';

interface MapRow extends Record<string, unknown> {
  readonly id: string;
  readonly name?: string;
  readonly levels: readonly number[];
  readonly lowest?: number;
}

const rows: readonly MapRow[] = [
  { id: 'a', name: 'Alpha', levels: [22, 24], lowest: 22 },
  { id: 'b', name: 'Bravo', levels: [10, 12], lowest: 10 },
  { id: 'c', name: 'Charlie', levels: [] },
  { id: 'd', levels: [30], lowest: 30 },
  { id: 'e', name: 'Echo', levels: [26], lowest: 26 },
];

const queryFields: readonly QueryFieldDefinition<MapRow>[] = [
  { id: 'name', accessor: 'name' },
  { id: 'levels', accessor: 'levels', sortable: false },
  { id: 'lowest', accessor: 'lowest' },
];

const sortOptions: readonly BrowseSortOption[] = [
  { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
  { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
  { label: 'Level: low to high', field: 'lowest', direction: 'asc' },
  { label: 'Level: high to low', field: 'lowest', direction: 'desc' },
];

function renderBrowser(
  state: Partial<BrowseState>,
  facets: readonly FacetDefinition<MapRow>[] = [],
) {
  cleanup();
  render(
    <MantineProvider>
      <FacetedBrowser
        title={<h1>Maps</h1>}
        records={rows}
        idAccessor="id"
        queryFields={queryFields}
        facets={facets}
        sortOptions={sortOptions}
        presentation="cards"
        renderCard={(record) => <p data-testid="card">{record.id}</p>}
        defaultState={{
          search: '',
          filters: {},
          page: 1,
          pageSize: 20,
          hiddenColumns: [],
          ...state,
        }}
      />
    </MantineProvider>,
  );
  return screen.getAllByTestId('card').map((card) => card.textContent);
}

const levelFacet: FacetDefinition<MapRow> = {
  id: 'level',
  field: 'levels',
  label: 'Level',
  kind: 'range',
};

describe('range facets over several values per record', () => {
  it('matches a record when any value is in range and never without values', () => {
    expect(
      renderBrowser({ filters: { levels: { min: 23, max: 30 } } }, [
        levelFacet,
      ]),
    ).toEqual(['a', 'd', 'e']);
  });

  it('keeps single-value bounds inclusive', () => {
    expect(
      renderBrowser({ filters: { levels: { min: 26, max: 26 } } }, [
        levelFacet,
      ]),
    ).toEqual(['e']);
  });

  it('matches bucket presets against any value', () => {
    expect(
      renderBrowser({ filters: { levels: ['low'] } }, [
        {
          ...levelFacet,
          buckets: [
            { value: 'low', label: '1–12', min: 1, max: 12 },
            { value: 'high', label: '13+', min: 13 },
          ],
        },
      ]),
    ).toEqual(['b']);
  });
});

describe('sort options order missing values last', () => {
  it('in ascending order', () => {
    expect(
      renderBrowser({ sort: { field: 'lowest', direction: 'asc' } }),
    ).toEqual(['b', 'a', 'e', 'd', 'c']);
    expect(
      renderBrowser({ sort: { field: 'name', direction: 'asc' } }).at(-1),
    ).toBe('d');
  });

  it('in descending order', () => {
    expect(
      renderBrowser({ sort: { field: 'lowest', direction: 'desc' } }),
    ).toEqual(['d', 'e', 'a', 'b', 'c']);
    expect(
      renderBrowser({ sort: { field: 'name', direction: 'desc' } }).at(-1),
    ).toBe('d');
  });
});
