import { MantineProvider } from '@mantine/core';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FacetedBrowser } from '@/components/FacetedBrowser';
import type {
  BrowseState,
  FacetDefinition,
  FacetedBrowserNavigationRenderContext,
  QueryFieldDefinition,
} from '@/components/FacetedBrowser';

interface Place extends Record<string, unknown> {
  readonly id: string;
  readonly name: string;
  readonly nodes: readonly string[];
  readonly kind: string;
}

const records: readonly Place[] = [
  {
    id: '1',
    name: 'Meadow Field',
    nodes: ['all', 'west', 'meadow'],
    kind: 'field',
  },
  {
    id: '2',
    name: 'Meadow Town',
    nodes: ['all', 'west', 'meadow'],
    kind: 'town',
  },
  {
    id: '3',
    name: 'Grove Field',
    nodes: ['all', 'west', 'grove'],
    kind: 'field',
  },
  { id: '4', name: 'Harbor Field', nodes: ['all', 'east'], kind: 'field' },
  { id: '5', name: 'Harbor Town', nodes: ['all', 'east'], kind: 'town' },
];
const NODE_IDS = ['all', 'west', 'meadow', 'grove', 'east'];

const queryFields: readonly QueryFieldDefinition<Place>[] = [
  'name',
  { id: 'nodes', accessor: 'nodes', sortable: false },
  { id: 'kind', accessor: 'kind', sortable: false },
];
const facets: readonly FacetDefinition<Place>[] = [
  { id: 'kind', field: 'kind', label: 'Kind', kind: 'multi-select' },
];

function Nav({
  context,
}: {
  readonly context: FacetedBrowserNavigationRenderContext;
}) {
  return (
    <ul aria-label="Places">
      {NODE_IDS.map((id) => (
        <li key={id}>{`${id} ${context.counts?.get(id) ?? 0}`}</li>
      ))}
    </ul>
  );
}

function renderBrowser({
  currentId = 'all',
  state = {},
  drawerOpened = false,
}: {
  readonly currentId?: string;
  readonly state?: Partial<BrowseState>;
  readonly drawerOpened?: boolean;
} = {}) {
  cleanup();
  const onStateChange = vi.fn<(state: BrowseState) => void>();
  render(
    <MantineProvider>
      <FacetedBrowser
        title={<h1>Places</h1>}
        records={records}
        idAccessor="id"
        queryFields={queryFields}
        searchFields={['name']}
        facets={facets}
        presentation="cards"
        renderCard={(record) => <p data-testid="card">{record.id}</p>}
        navigation={{
          label: 'Places',
          currentLabel: currentId,
          currentId,
          field: 'nodes',
          apply: vi.fn(),
          render: (context) => <Nav context={context} />,
        }}
        state={{
          search: '',
          filters: {},
          page: 1,
          pageSize: 20,
          hiddenColumns: [],
          ...state,
        }}
        onStateChange={onStateChange}
        drawerOpened={drawerOpened}
        onDrawerOpenedChange={vi.fn()}
      />
    </MantineProvider>,
  );
  return { onStateChange };
}

function navCounts(): readonly string[] {
  return within(screen.getAllByRole('list', { name: 'Places' })[0]!)
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '');
}

function cardIds(): readonly (string | null)[] {
  return screen.queryAllByTestId('card').map((card) => card.textContent);
}

describe('navigation field', () => {
  it('shows each node total without search or filters', () => {
    renderBrowser();

    expect(navCounts()).toEqual([
      'all 5',
      'west 3',
      'meadow 2',
      'grove 1',
      'east 2',
    ]);
    expect(cardIds()).toEqual(['1', '2', '3', '4', '5']);
  });

  it('lists only the current node and keeps sibling counts', () => {
    renderBrowser({ currentId: 'west' });

    expect(cardIds()).toEqual(['1', '2', '3']);
    expect(navCounts()).toContain('east 2');
  });

  it('counts follow search and committed filters', () => {
    renderBrowser({ state: { search: 'field', filters: { kind: ['field'] } } });

    expect(navCounts()).toEqual([
      'all 3',
      'west 2',
      'meadow 1',
      'grove 1',
      'east 1',
    ]);
  });

  it('agrees with the result count after choosing a node', () => {
    renderBrowser({ state: { filters: { kind: ['town'] } } });
    const meadow = navCounts().find((entry) => entry.startsWith('meadow'));

    renderBrowser({
      currentId: 'meadow',
      state: { filters: { kind: ['town'] } },
    });

    expect(`meadow ${cardIds().length}`).toBe(meadow);
  });

  it('shows an empty node as zero and its page as empty', () => {
    renderBrowser({
      currentId: 'grove',
      state: { filters: { kind: ['town'] } },
    });

    expect(navCounts()).toContain('grove 0');
    expect(cardIds()).toEqual([]);
  });

  it('ignores staged drawer edits', async () => {
    renderBrowser({ drawerOpened: true });
    const dialog = screen.getByRole('dialog');

    await userEvent.click(
      within(dialog).getByRole('checkbox', { name: /town/u }),
    );

    expect(navCounts()).toContain('all 5');
  });

  it('never puts the node into browse state', async () => {
    const { onStateChange } = renderBrowser({ currentId: 'west' });

    await userEvent.click(
      screen.getAllByRole('checkbox', { name: /town/u })[0]!,
    );

    expect(onStateChange).toHaveBeenCalledOnce();
    expect(onStateChange.mock.calls[0]?.[0].filters).toEqual({
      kind: ['town'],
    });
  });
});
