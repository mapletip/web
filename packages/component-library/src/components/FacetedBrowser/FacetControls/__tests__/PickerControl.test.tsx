import { MantineProvider } from '@mantine/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FacetedBrowser } from '@/components/FacetedBrowser';
import type {
  BrowseState,
  FacetDefinition,
  QueryFieldDefinition,
} from '@/components/FacetedBrowser';
import { PickerControl } from '@/components/FacetedBrowser/FacetControls/PickerControl';

const options = [
  {
    value: 'shellback',
    label: 'Shellback',
    description: 'Lv. 1',
    icon: <span data-testid="icon-shellback" />,
  },
  { value: 'blue-shellback', label: 'Blue Shellback', description: 'Lv. 2' },
  { value: 'rootling', label: 'Rootling', description: 'Lv. 4' },
];
const picker = {
  placeholder: 'Search monsters',
  nothingFound: 'No monsters match',
};

function renderPicker(value: readonly string[] = []) {
  const onChange = vi.fn();
  render(
    <MantineProvider>
      <PickerControl
        label="Monster"
        labelContent="Monster"
        options={options}
        picker={picker}
        value={value}
        onChange={onChange}
      />
    </MantineProvider>,
  );
  return { onChange, input: screen.getByRole('combobox', { name: 'Monster' }) };
}

describe('PickerControl', () => {
  it('lists only options matching the typed text, with secondary lines', async () => {
    const { input } = renderPicker();

    await userEvent.type(input, 'shellback');

    const listbox = screen.getByRole('listbox', { hidden: true });
    expect(
      within(listbox)
        .getAllByRole('option', { hidden: true })
        .map((option) => option.textContent),
    ).toEqual(['ShellbackLv. 1', 'Blue ShellbackLv. 2']);
    expect(within(listbox).getByTestId('icon-shellback')).toBeInTheDocument();
  });

  it('states the domain wording when nothing matches', async () => {
    const { input } = renderPicker();

    await userEvent.type(input, 'emberlord');

    expect(screen.getByText('No monsters match')).toBeInTheDocument();
  });

  it('adds to existing selections and clears to no filter', async () => {
    const { input, onChange } = renderPicker(['shellback']);

    await userEvent.type(input, 'rootling');
    await userEvent.click(
      screen.getByRole('option', { name: /Rootling/u, hidden: true }),
    );
    expect(onChange).toHaveBeenLastCalledWith(['shellback', 'rootling']);
  });

  it('reports no filter when the last selection is removed', async () => {
    const { input, onChange } = renderPicker(['shellback']);

    await userEvent.click(input);
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('ignores selected values that are not options', () => {
    renderPicker(['shellback', 'not-in-build']);

    expect(screen.getByTitle('Shellback')).toBeInTheDocument();
    expect(screen.queryByText('not-in-build')).not.toBeInTheDocument();
  });
});

interface Row extends Record<string, unknown> {
  readonly id: string;
  readonly monsters: readonly string[];
}

const rows: readonly Row[] = [
  { id: 'a', monsters: ['shellback'] },
  { id: 'b', monsters: ['blue-shellback'] },
  { id: 'c', monsters: ['rootling'] },
];
const queryFields: readonly QueryFieldDefinition<Row>[] = [
  { id: 'monsters', accessor: 'monsters', sortable: false },
];
const facets: readonly FacetDefinition<Row>[] = [
  {
    id: 'monster',
    field: 'monsters',
    label: 'Monster',
    kind: 'multi-select',
    options,
    picker,
  },
];
const state: BrowseState = {
  search: '',
  filters: {},
  page: 1,
  pageSize: 20,
  hiddenColumns: [],
};

describe('picker facet in FacetedBrowser', () => {
  it('stages a pick in the drawer and commits it on apply', async () => {
    const onStateChange = vi.fn();
    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Maps</h1>}
          records={rows}
          idAccessor="id"
          queryFields={queryFields}
          facets={facets}
          presentation="cards"
          renderCard={(record) => <div>{record.id}</div>}
          state={state}
          onStateChange={onStateChange}
          drawerOpened
          onDrawerOpenedChange={vi.fn()}
        />
      </MantineProvider>,
    );
    const dialog = screen.getByRole('dialog');

    await userEvent.type(
      within(dialog).getByRole('combobox', { name: 'Monster' }),
      'rootling',
    );
    await userEvent.click(
      within(dialog).getByRole('option', { name: /Rootling/u, hidden: true }),
    );
    expect(onStateChange).not.toHaveBeenCalled();

    await userEvent.click(
      within(dialog).getByRole('button', { name: /Apply|Show/u }),
    );
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ filters: { monsters: ['rootling'] } }),
      expect.objectContaining({ reason: 'apply' }),
    );
  });

  it('is not shown when no option is present on the records', () => {
    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Maps</h1>}
          records={rows.map((row) => ({ ...row, monsters: [] }))}
          idAccessor="id"
          queryFields={queryFields}
          facets={facets}
          presentation="cards"
          renderCard={(record) => <div>{record.id}</div>}
          defaultState={state}
        />
      </MantineProvider>,
    );

    expect(
      screen.queryByRole('combobox', { name: 'Monster' }),
    ).not.toBeInTheDocument();
  });
});
