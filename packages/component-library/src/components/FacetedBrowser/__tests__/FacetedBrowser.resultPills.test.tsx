import { MantineProvider } from '@mantine/core';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FacetedBrowser } from '@/components/FacetedBrowser';
import type {
  BrowseState,
  FacetDefinition,
  QueryFieldDefinition,
} from '@/components/FacetedBrowser';

interface Row extends Record<string, unknown> {
  readonly id: string;
  readonly name: string;
  readonly types: readonly string[];
  readonly region: string;
}

const records: readonly Row[] = [
  { id: 'one', name: 'Amber', types: ['tool', 'gift'], region: 'North' },
  { id: 'two', name: 'Birch', types: ['tool'], region: 'South' },
  { id: 'three', name: 'Cedar', types: ['food'], region: 'North' },
];
const queryFields: readonly QueryFieldDefinition<Row>[] = [
  { id: 'types', accessor: 'types' },
  { id: 'region', accessor: 'region' },
  { id: 'name', accessor: 'name' },
];
const resultsFacet: FacetDefinition<Row> = {
  id: 'type',
  field: 'types',
  label: 'Type',
  kind: 'multi-select',
  placement: 'results',
  options: [
    { value: 'gift', label: 'Gift' },
    { value: 'tool', label: 'Tool' },
    { value: 'food', label: 'Food' },
    { value: 'missing', label: 'Missing' },
  ],
};
const regionFacet: FacetDefinition<Row> = {
  id: 'region',
  field: 'region',
  label: 'Region',
  kind: 'multi-select',
  options: [
    { value: 'North', label: 'North' },
    { value: 'South', label: 'South' },
  ],
};
const baseState: BrowseState = {
  search: '',
  filters: {},
  page: 1,
  pageSize: 10,
  hiddenColumns: [],
};

function mount({
  facets = [resultsFacet, regionFacet],
  state = baseState,
  onStateChange,
}: {
  readonly facets?: readonly FacetDefinition<Row>[];
  readonly state?: BrowseState;
  readonly onStateChange?: (state: BrowseState) => void;
} = {}) {
  return render(
    <MantineProvider>
      <FacetedBrowser
        title={<h1>Records</h1>}
        records={records}
        idAccessor="id"
        queryFields={queryFields}
        facets={facets}
        presentation="cards"
        renderCard={(record) => <span>{record.name}</span>}
        {...(onStateChange
          ? { state, onStateChange }
          : { defaultState: state })}
      />
    </MantineProvider>,
  );
}

function pills() {
  return screen.getByRole('group', { name: 'Type' });
}

describe('result pills', () => {
  it('counts multi-value records under both choices and once under All in declared order', () => {
    mount();
    expect(
      within(pills())
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
    ).toEqual(['', 'gift', 'tool', 'food']);
    expect(
      within(pills()).getByRole('radio', { name: 'All (3)' }),
    ).toBeChecked();
    expect(
      within(pills()).getByRole('radio', { name: 'Gift (1)' }),
    ).toBeVisible();
    expect(
      within(pills()).getByRole('radio', { name: 'Tool (2)' }),
    ).toBeVisible();
    expect(
      within(pills()).queryByRole('radio', { name: /Missing/u }),
    ).toBeNull();
  });

  it('chooses a value, resets the page, and returns to all', async () => {
    const onStateChange = vi.fn();
    const { rerender } = mount({
      state: { ...baseState, page: 2, pageSize: 1 },
      onStateChange,
    });
    await userEvent.click(
      within(pills()).getByRole('radio', { name: 'Gift (1)' }),
    );
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, filters: { types: ['gift'] } }),
    );
    rerender(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={records}
          idAccessor="id"
          queryFields={queryFields}
          facets={[resultsFacet, regionFacet]}
          presentation="cards"
          renderCard={(record) => <span>{record.name}</span>}
          state={{ ...baseState, filters: { types: ['gift'] } }}
          onStateChange={onStateChange}
        />
      </MantineProvider>,
    );
    expect(screen.getByText('Amber')).toBeVisible();
    expect(screen.queryByText('Birch')).toBeNull();
    await userEvent.click(
      within(pills()).getByRole('radio', { name: 'All (3)' }),
    );
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: {} }),
    );
  });

  it('uses contextual counts after search and another filter, keeping a chosen empty choice', () => {
    mount({
      state: {
        ...baseState,
        search: 'Amber',
        filters: { region: ['North'], types: ['food'] },
      },
    });
    expect(
      within(pills()).getByRole('radio', { name: 'All (1)' }),
    ).toBeVisible();
    expect(
      within(pills()).getByRole('radio', { name: 'Gift (1)' }),
    ).toBeVisible();
    expect(
      within(pills()).getByRole('radio', { name: 'Tool (1)' }),
    ).toBeVisible();
    expect(
      within(pills()).getByRole('radio', { name: 'Food (0)' }),
    ).toBeChecked();
    expect(
      within(pills()).queryByRole('radio', { name: /Missing/u }),
    ).toBeNull();
  });

  it('has one home and Clear filters resets its choice', async () => {
    mount({
      state: { ...baseState, filters: { types: ['gift'], region: ['North'] } },
    });
    expect(
      screen.getByRole('complementary', { name: 'Filters' }),
    ).not.toHaveTextContent('Type');
    expect(
      screen.queryByRole('button', { name: /Open Type filters/u }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Remove Type: Gift' }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(
      within(pills()).getByRole('radio', { name: 'All (3)' }),
    ).toBeChecked();
    await userEvent.click(
      screen.getByRole('button', { name: /Open all filters/u }),
    );
    expect(await screen.findByRole('dialog')).not.toHaveTextContent('Type');
  });

  it('shows no Clear filters button when the pill is the only choice', () => {
    mount({
      facets: [resultsFacet],
      state: { ...baseState, filters: { types: ['gift'] } },
    });
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  });

  it('reports a second results facet', () => {
    expect(() =>
      mount({
        facets: [resultsFacet, { ...regionFacet, placement: 'results' }],
      }),
    ).toThrow(/only one results facet/u);
  });

  it('normalizes an address with several pill values to one choice', async () => {
    const onStateChange = vi.fn();
    mount({
      state: { ...baseState, filters: { types: ['gift', 'tool'] } },
      onStateChange,
    });
    await waitFor(() =>
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ filters: { types: ['gift'] } }),
        { reason: 'clamp' },
      ),
    );
  });

  it('keeps markup unchanged when no facet uses results placement', () => {
    const { container, rerender } = mount({ facets: [regionFacet] });
    const originalMarkup = container.innerHTML;
    rerender(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={records}
          idAccessor="id"
          queryFields={queryFields}
          facets={[{ ...regionFacet, placement: 'rail' }]}
          presentation="cards"
          renderCard={(record) => <span>{record.name}</span>}
          defaultState={baseState}
        />
      </MantineProvider>,
    );
    expect(container.innerHTML).toBe(originalMarkup);
    expect(container.querySelector('fieldset')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Type choices' })).toBeNull();
  });
});
