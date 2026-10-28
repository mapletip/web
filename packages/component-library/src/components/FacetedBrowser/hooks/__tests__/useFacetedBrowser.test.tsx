import { MantineProvider } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { normalizeFilters } from '@/components/FacetedBrowser/hooks/browseState';
import { isInvalidNumericRange } from '@/components/FacetedBrowser/hooks/filterTypes';
import {
  useFacetedBrowser,
  type BrowseState,
  type FacetFilterValue,
  type UseFacetedBrowserOptions,
} from '@/components/FacetedBrowser/hooks/useFacetedBrowser';
import type { TableColumn } from '@/components/Table/types';
import { theme } from '@/theme';

interface TestItem extends Record<string, unknown> {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly level: number | null;
  readonly tags: readonly string[];
}

const testItems: readonly TestItem[] = [
  {
    id: '1',
    name: 'Alpha',
    category: 'Boss',
    level: 100,
    tags: ['fire', 'undead'],
  },
  { id: '2', name: 'Beta', category: 'Normal', level: 0, tags: ['water'] },
  { id: '3', name: 'Gamma', category: 'Boss', level: null, tags: ['fire'] },
  {
    id: '4',
    name: 'Delta',
    category: 'Elite',
    level: 50,
    tags: ['earth', 'undead'],
  },
  { id: '5', name: 'Epsilon', category: 'Normal', level: 25, tags: ['air'] },
];

const testColumns: readonly TableColumn<TestItem>[] = [
  { accessor: 'name', title: 'Name', sortable: true },
  { accessor: 'category', title: 'Category', sortable: true },
  {
    accessor: 'level',
    title: 'Level',
    sortable: true,
    numeric: true,
    firstSortDirection: 'desc',
  },
  { accessor: 'tags', title: 'Tags' },
];

function BrowserTestHarness(props: {
  readonly options?: Partial<UseFacetedBrowserOptions<TestItem>>;
  readonly onPageChangeSpy?: (page: number) => void;
  readonly onSortChangeSpy?: (sort: {
    field: string;
    direction: 'asc' | 'desc';
  }) => void;
  readonly onFiltersChangeSpy?: (
    filters: Record<string, FacetFilterValue>,
  ) => void;
}) {
  const [search, setSearch] = useState('');
  const browser = useFacetedBrowser<TestItem>({
    records: testItems,
    columns: testColumns,
    idAccessor: 'id',
    identityField: 'name',
    pageSize: 2,
    search,
    ...(props.onPageChangeSpy ? { onPageChange: props.onPageChangeSpy } : {}),
    ...(props.onSortChangeSpy ? { onSortChange: props.onSortChangeSpy } : {}),
    ...(props.onFiltersChangeSpy
      ? { onFiltersChange: props.onFiltersChangeSpy }
      : {}),
    ...props.options,
  });

  return (
    <div>
      <div data-testid="total-records">{browser.totalRecordCount}</div>
      <div data-testid="matching-count">{browser.totalMatchingCount}</div>
      <div data-testid="page">{browser.page}</div>
      <div data-testid="page-count">{browser.pageCount}</div>
      <div data-testid="page-start">{browser.pageStart}</div>
      <div data-testid="page-end">{browser.pageEnd}</div>
      <div data-testid="records">
        {browser.records.map((r) => r.name).join(',')}
      </div>
      <div data-testid="all-filtered">
        {browser.allFilteredRecords.map((r) => r.name).join(',')}
      </div>
      <div data-testid="visible-columns">
        {browser.visibleColumns.map((c) => c.accessor).join(',')}
      </div>
      <div data-testid="table-category-sortable">
        {String(
          browser.tableProps.columns.find(
            (column) => column.accessor === 'category',
          )?.sortable,
        )}
      </div>
      <div data-testid="facet-boss">
        {browser.getFacetCount('category', 'Boss')}
      </div>
      <div data-testid="facet-normal">
        {browser.getFacetCount('category', 'Normal')}
      </div>
      <div data-testid="facet-elite">
        {browser.getFacetCount('category', 'Elite')}
      </div>

      <button type="button" onClick={() => browser.setPage(1)}>
        Page 1
      </button>
      <button type="button" onClick={() => browser.setPage(2)}>
        Page 2
      </button>
      <button type="button" onClick={() => browser.setPage(0.5)}>
        Fractional Page
      </button>
      <button type="button" onClick={() => browser.setPage(3)}>
        Page 3
      </button>
      <button
        type="button"
        onClick={() => browser.setFilter('category', ['Boss'])}
      >
        Filter Boss
      </button>
      <button
        type="button"
        onClick={() => browser.setFilter('category', ['Boss', 'Elite'])}
      >
        Filter Boss or Elite
      </button>
      <button
        type="button"
        onClick={() => browser.setFilter('category', ['Elite', 'Boss'])}
      >
        Filter Elite or Boss
      </button>
      <button
        type="button"
        onClick={() => browser.setFilter('category', 'Bos')}
      >
        Filter Category Prefix
      </button>
      <button
        type="button"
        onClick={() => browser.setFilter('category', ['NonExistent'])}
      >
        Filter NonExistent
      </button>
      <button type="button" onClick={() => browser.setFilter('category', [])}>
        Clear Category
      </button>
      <button type="button" onClick={() => browser.setFilter('level', {})}>
        Filter Empty Range
      </button>
      <button
        type="button"
        onClick={() => browser.setFilter('level', { min: 100, max: 50 })}
      >
        Filter Invalid Range
      </button>
      <button
        type="button"
        onClick={() => browser.setFilter('level', { min: Infinity })}
      >
        Filter Infinite Range
      </button>
      <button
        type="button"
        onClick={() => browser.setFilter('level', { min: Number.NaN, max: 10 })}
      >
        Filter NaN Range
      </button>
      <button
        type="button"
        onClick={() => browser.setFilter('tags', ['undead'])}
      >
        Filter Undead
      </button>
      <button type="button" onClick={() => browser.setFilter('tags', ['fire'])}>
        Filter Fire
      </button>
      <button
        type="button"
        onClick={() => browser.setFilter('level', { min: 0, max: 50 })}
      >
        Filter Level 0-50
      </button>
      <button
        type="button"
        onClick={() => {
          browser.setFilter('category', ['Boss']);
          browser.setFilter('level', { min: 0, max: 100 });
        }}
      >
        Filter Boss And Level
      </button>
      <button
        type="button"
        onClick={() =>
          browser.tableProps.onSortChange({
            field: 'category',
            direction: 'asc',
          })
        }
      >
        Table Sort Category
      </button>
      <button type="button" onClick={() => browser.clearQuery()}>
        Clear Query
      </button>
      <button type="button" onClick={() => browser.setSort('name', 'asc')}>
        Sort Name Asc
      </button>
      <button type="button" onClick={() => browser.setSort('name', 'desc')}>
        Sort Name Desc
      </button>
      <button type="button" onClick={() => browser.setSort('level', 'asc')}>
        Sort Level Asc
      </button>
      <button type="button" onClick={() => browser.setSort('level', 'desc')}>
        Sort Level Desc
      </button>
      <button type="button" onClick={() => browser.setSort('level')}>
        Toggle Level Sort
      </button>
      <button
        type="button"
        onClick={() => browser.setColumnVisibility('name', false)}
      >
        Hide Name
      </button>
      <button
        type="button"
        onClick={() => browser.setColumnVisibility('level', false)}
      >
        Hide Level
      </button>
      <button
        type="button"
        onClick={() => browser.setColumnVisibility('level', true)}
      >
        Show Level
      </button>
      <button
        type="button"
        onClick={() => {
          browser.setColumnVisibility('category', false);
          browser.setColumnVisibility('level', false);
          browser.setColumnVisibility('tags', false);
        }}
      >
        Hide All Data Columns
      </button>
      <input
        aria-label="Search items"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}

async function mountHarness(
  props: {
    readonly options?: Partial<UseFacetedBrowserOptions<TestItem>>;
    readonly onPageChangeSpy?: (page: number) => void;
    readonly onSortChangeSpy?: (sort: {
      field: string;
      direction: 'asc' | 'desc';
    }) => void;
    readonly onFiltersChangeSpy?: (
      filters: Record<string, FacetFilterValue>,
    ) => void;
  } = {},
) {
  await render(
    <MantineProvider theme={theme}>
      <BrowserTestHarness {...props} />
    </MantineProvider>,
  );
}

const text = (testId: string) =>
  document.querySelector(`[data-testid="${testId}"]`)?.textContent ?? '';

describe('useFacetedBrowser', () => {
  describe('Row processing & pagination', () => {
    it('processes records into paginated slices and calculates counts', async () => {
      await mountHarness();
      expect(text('total-records')).toBe('5');
      expect(text('matching-count')).toBe('5');
      expect(text('page-count')).toBe('3');
      expect(text('page')).toBe('1');
      expect(text('page-start')).toBe('1');
      expect(text('page-end')).toBe('2');
      expect(text('records')).toBe('Alpha,Beta');
    });

    it('navigates pages and slices correctly', async () => {
      const onPageChange = vi.fn();
      await mountHarness({ onPageChangeSpy: onPageChange });

      await userEvent.click(page.getByRole('button', { name: 'Page 2' }));
      expect(onPageChange).toHaveBeenCalledWith(2);
      expect(text('page')).toBe('2');
      expect(text('page-start')).toBe('3');
      expect(text('page-end')).toBe('4');
      expect(text('records')).toBe('Gamma,Delta');
    });

    it('clamps page when filter reduces total pages below current page', async () => {
      await mountHarness();
      await userEvent.click(page.getByRole('button', { name: 'Page 3' }));
      expect(text('page')).toBe('3');

      // Boss has 2 items -> 1 page total
      await userEvent.click(page.getByRole('button', { name: 'Filter Boss' }));
      expect(text('matching-count')).toBe('2');
      expect(text('page-count')).toBe('1');
      expect(text('page')).toBe('1');
    });
  });

  describe('Filtering and faceting semantics', () => {
    it('imposes no restriction when facet filter is empty', async () => {
      await mountHarness();
      await userEvent.click(
        page.getByRole('button', { name: 'Clear Category' }),
      );
      expect(text('matching-count')).toBe('5');
    });

    it('applies OR semantics for multiple selections within one facet', async () => {
      await mountHarness();
      await userEvent.click(
        page.getByRole('button', { name: 'Filter Boss or Elite' }),
      );
      expect(text('matching-count')).toBe('3');
      expect(text('all-filtered')).toBe('Alpha,Gamma,Delta');
    });

    it('composes multiple filter updates made in one event', async () => {
      await mountHarness();
      await userEvent.click(
        page.getByRole('button', { name: 'Filter Boss And Level' }),
      );
      expect(text('matching-count')).toBe('1');
      expect(text('all-filtered')).toBe('Alpha');
    });

    it('combines independent facets with AND semantics', async () => {
      await mountHarness();
      await userEvent.click(page.getByRole('button', { name: 'Filter Boss' }));
      await userEvent.click(
        page.getByRole('button', { name: 'Filter Undead' }),
      );
      expect(text('matching-count')).toBe('1');
      expect(text('all-filtered')).toBe('Alpha');
    });

    it('rejects nonfinite numeric range endpoints instead of dropping them', async () => {
      await mountHarness();
      await userEvent.click(
        page.getByRole('button', { name: 'Filter Infinite Range' }),
      );
      expect(text('matching-count')).toBe('0');
      await userEvent.click(
        page.getByRole('button', { name: 'Filter NaN Range' }),
      );
      expect(text('matching-count')).toBe('0');
    });

    it('rejects an inverted numeric range instead of swapping its endpoints', async () => {
      await mountHarness();
      await userEvent.click(
        page.getByRole('button', { name: 'Filter Invalid Range' }),
      );
      expect(text('matching-count')).toBe('0');
      expect(text('records')).toBe('');
    });

    it('evaluates numeric ranges correctly at both boundaries and distinguishes known zero and unknown', async () => {
      await mountHarness();
      await userEvent.click(
        page.getByRole('button', { name: 'Filter Level 0-50' }),
      );
      expect(text('matching-count')).toBe('3');
      const matches = text('all-filtered').split(',');
      expect(matches).toContain('Beta'); // level 0
      expect(matches).toContain('Delta'); // level 50
      expect(matches).toContain('Epsilon'); // level 25
      expect(matches).not.toContain('Gamma'); // null unknown
      expect(matches).not.toContain('Alpha'); // level 100
    });

    it('filters multi-valued attributes correctly', async () => {
      await mountHarness();
      await userEvent.click(page.getByRole('button', { name: 'Filter Fire' }));
      expect(text('matching-count')).toBe('2');
      expect(text('all-filtered')).toBe('Alpha,Gamma');
    });

    it('combines text search with facet filters', async () => {
      await mountHarness();
      const searchInput = page.getByRole('textbox', { name: 'Search items' });
      await userEvent.type(searchInput, 'al');
      expect(text('matching-count')).toBe('3'); // Alpha (name), Beta (category Normal), Epsilon (category Normal)

      await userEvent.click(page.getByRole('button', { name: 'Filter Boss' }));
      expect(text('matching-count')).toBe('1');
      expect(text('records')).toBe('Alpha');
    });

    it('returns 0 matches when nothing matches', async () => {
      await mountHarness();
      await userEvent.click(
        page.getByRole('button', { name: 'Filter NonExistent' }),
      );
      expect(text('matching-count')).toBe('0');
      expect(text('records')).toBe('');
      expect(text('page-start')).toBe('0');
      expect(text('page-end')).toBe('0');
    });

    it('computes faceted counts without eliminating alternatives within the facet', async () => {
      await mountHarness();
      expect(text('facet-boss')).toBe('2');
      expect(text('facet-normal')).toBe('2');
      expect(text('facet-elite')).toBe('1');
    });
  });

  describe('Canonical filter semantics', () => {
    it('preserves malformed range endpoints as invalid instead of dropping them', () => {
      const malformed: FacetFilterValue = {
        min: null,
        max: 10,
      } as unknown as FacetFilterValue;
      const normalized = normalizeFilters({ level: malformed });
      expect(isInvalidNumericRange(normalized['level'])).toBe(true);
    });

    it('uses exact equality for scalar categorical filters instead of substring matching', async () => {
      await mountHarness();
      await userEvent.click(
        page.getByRole('button', { name: 'Filter Category Prefix' }),
      );
      expect(text('matching-count')).toBe('0');
    });

    it('treats reordered selections as the same filter and ignores empty values', async () => {
      const onFiltersChange = vi.fn();
      await mountHarness({ onFiltersChangeSpy: onFiltersChange });

      await userEvent.click(
        page.getByRole('button', { name: 'Filter Boss or Elite' }),
      );
      expect(onFiltersChange).toHaveBeenCalledTimes(1);

      await userEvent.click(
        page.getByRole('button', { name: 'Filter Elite or Boss' }),
      );
      expect(onFiltersChange).toHaveBeenCalledTimes(1);

      await userEvent.click(
        page.getByRole('button', { name: 'Filter Empty Range' }),
      );
      expect(onFiltersChange).toHaveBeenCalledTimes(1);
      expect(text('matching-count')).toBe('3');
    });

    it('does not emit when resetting an already-empty filter set', async () => {
      const onFiltersChange = vi.fn();
      await mountHarness({ onFiltersChangeSpy: onFiltersChange });

      await userEvent.click(
        page.getByRole('button', { name: 'Clear Category' }),
      );
      expect(onFiltersChange).not.toHaveBeenCalled();
    });

    it('does not emit or reset when the requested page and sort already match', async () => {
      const onPageChange = vi.fn();
      const onSortChange = vi.fn();
      await mountHarness({
        onPageChangeSpy: onPageChange,
        onSortChangeSpy: onSortChange,
      });

      await userEvent.click(page.getByRole('button', { name: 'Page 2' }));
      expect(onPageChange).toHaveBeenLastCalledWith(2);
      const pageCalls = onPageChange.mock.calls.length;
      await userEvent.click(page.getByRole('button', { name: 'Page 2' }));
      expect(onPageChange).toHaveBeenCalledTimes(pageCalls);

      await userEvent.click(
        page.getByRole('button', { name: 'Sort Name Asc' }),
      );
      expect(onSortChange).toHaveBeenCalledTimes(1);
      await userEvent.click(
        page.getByRole('button', { name: 'Sort Name Asc' }),
      );
      expect(onSortChange).toHaveBeenCalledTimes(1);
    });

    it('floors positive fractional page inputs to a valid page', async () => {
      await mountHarness();
      await userEvent.click(page.getByRole('button', { name: 'Page 2' }));
      expect(text('page')).toBe('2');
      await userEvent.click(
        page.getByRole('button', { name: 'Fractional Page' }),
      );
      expect(text('page')).toBe('1');
    });
  });

  describe('Deterministic sorting', () => {
    it('sorts text ascending and descending', async () => {
      await mountHarness();

      await userEvent.click(
        page.getByRole('button', { name: 'Sort Name Asc' }),
      );
      expect(text('all-filtered')).toBe('Alpha,Beta,Delta,Epsilon,Gamma');

      await userEvent.click(
        page.getByRole('button', { name: 'Sort Name Desc' }),
      );
      expect(text('all-filtered')).toBe('Gamma,Epsilon,Delta,Beta,Alpha');
    });

    it('sorts numeric ascending with unknown last and known zero preserved', async () => {
      await mountHarness();

      await userEvent.click(
        page.getByRole('button', { name: 'Sort Level Asc' }),
      );
      // Beta (0), Epsilon (25), Delta (50), Alpha (100), Gamma (null - last!)
      expect(text('all-filtered')).toBe('Beta,Epsilon,Delta,Alpha,Gamma');
    });

    it('sorts numeric descending with unknown last', async () => {
      await mountHarness();

      await userEvent.click(
        page.getByRole('button', { name: 'Sort Level Desc' }),
      );
      // Alpha (100), Delta (50), Epsilon (25), Beta (0), Gamma (null - last!)
      expect(text('all-filtered')).toBe('Alpha,Delta,Epsilon,Beta,Gamma');
    });

    it('projects query-field sortability onto table headers and guards disabled requests', async () => {
      const onSortChange = vi.fn();
      await mountHarness({
        onSortChangeSpy: onSortChange,
        options: {
          queryFields: [{ id: 'category', sortable: false }],
        },
      });
      expect(text('table-category-sortable')).toBe('false');
      await userEvent.click(
        page.getByRole('button', { name: 'Table Sort Category' }),
      );
      expect(onSortChange).not.toHaveBeenCalled();
    });

    it('lets a query-field direction override an inherited column default', async () => {
      const onSortChange = vi.fn();
      await mountHarness({
        onSortChangeSpy: onSortChange,
        options: {
          queryFields: [
            {
              id: 'level',
              firstSortDirection: 'asc',
              sortable: true,
            },
          ],
        },
      });

      await userEvent.click(
        page.getByRole('button', { name: 'Toggle Level Sort' }),
      );
      expect(onSortChange).toHaveBeenLastCalledWith({
        field: 'level',
        direction: 'asc',
      });
    });

    it('uses firstSortDirection from column config on first toggle', async () => {
      const onSortChange = vi.fn();
      await mountHarness({ onSortChangeSpy: onSortChange });

      await userEvent.click(
        page.getByRole('button', { name: 'Toggle Level Sort' }),
      );
      expect(onSortChange).toHaveBeenCalledWith({
        field: 'level',
        direction: 'desc',
      });
    });
  });

  describe('Column visibility', () => {
    it('prevents hiding the identity column', async () => {
      await mountHarness();
      await userEvent.click(page.getByRole('button', { name: 'Hide Name' }));
      expect(text('visible-columns')).toContain('name');
    });

    it('hides non-identity column and restores in original order', async () => {
      await mountHarness();

      await userEvent.click(page.getByRole('button', { name: 'Hide Level' }));
      expect(text('visible-columns')).toBe('name,category,tags');

      await userEvent.click(page.getByRole('button', { name: 'Show Level' }));
      expect(text('visible-columns')).toBe('name,category,level,tags');
    });

    it('ensures at least one data column remains visible', async () => {
      await mountHarness();

      await userEvent.click(
        page.getByRole('button', { name: 'Hide All Data Columns' }),
      );
      // Attempting to hide tags as last data column was rejected
      expect(text('visible-columns')).toBe('name,tags');
    });
  });

  describe('Standalone hook state transitions', () => {
    it('updates search and resets the page without canonical browseState', async () => {
      function StandaloneSearchHarness() {
        const browser = useFacetedBrowser({
          records: testItems,
          idAccessor: 'id',
          identityField: 'name',
          pageSize: 2,
        });

        return (
          <div>
            <div data-testid="standalone-page">{browser.page}</div>
            <div data-testid="standalone-records">
              {browser.records.map((record) => record.name).join(',')}
            </div>
            <button type="button" onClick={() => browser.setPage(3)}>
              Standalone Page 3
            </button>
            <button type="button" onClick={() => browser.setSearch('Epsilon')}>
              Standalone Search Epsilon
            </button>
          </div>
        );
      }

      await render(<StandaloneSearchHarness />);
      expect(text('standalone-page')).toBe('1');
      expect(text('standalone-records')).toBe('Alpha,Beta');

      await userEvent.click(
        page.getByRole('button', { name: 'Standalone Page 3' }),
      );
      expect(text('standalone-page')).toBe('3');

      await userEvent.click(
        page.getByRole('button', { name: 'Standalone Search Epsilon' }),
      );
      expect(text('standalone-page')).toBe('1');
      expect(text('standalone-records')).toBe('Epsilon');
    });

    it('does not carry a rejected controlled proposal into the next transition', async () => {
      const onBrowseStateChange = vi.fn();
      const canonical = {
        search: '',
        filters: {},
        page: 1,
        pageSize: 2,
        hiddenColumns: [],
      };
      await mountHarness({
        options: { browseState: canonical, onBrowseStateChange },
      });

      await userEvent.click(page.getByRole('button', { name: 'Filter Boss' }));
      expect(onBrowseStateChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: { category: ['Boss'] } }),
      );
      await vi.waitFor(() =>
        expect(onBrowseStateChange).toHaveBeenCalledTimes(1),
      );

      await userEvent.click(page.getByRole('button', { name: 'Page 2' }));
      expect(onBrowseStateChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: {}, page: 2 }),
      );
    });

    it('composes multiple actions in one event against the latest proposal', async () => {
      function SameEventHarness() {
        const [browse, setBrowse] = useState<BrowseState>({
          search: '',
          filters: {},
          page: 1,
          pageSize: 2,
          hiddenColumns: [],
        });
        const browser = useFacetedBrowser<TestItem>({
          records: testItems,
          columns: testColumns,
          idAccessor: 'id',
          identityField: 'name',
          pageSize: 2,
          browseState: browse,
          onBrowseStateChange: setBrowse,
        });
        return (
          <div>
            <div data-testid="same-event-filters">
              {JSON.stringify(browser.filters)}
            </div>
            <button
              type="button"
              onClick={() => {
                browser.setFilter('category', ['Boss']);
                browser.setFilter('tags', ['fire']);
              }}
            >
              Compose filters
            </button>
          </div>
        );
      }

      await render(<SameEventHarness />);
      await userEvent.click(
        page.getByRole('button', { name: 'Compose filters' }),
      );
      expect(text('same-event-filters')).toBe(
        JSON.stringify({ category: ['Boss'], tags: ['fire'] }),
      );
    });

    it('keeps delayed host acceptance as the next transition base', async () => {
      function DelayedHarness() {
        const [browse, setBrowse] = useState<BrowseState>({
          search: '',
          filters: {},
          page: 1,
          pageSize: 2,
          hiddenColumns: [],
        });
        const browser = useFacetedBrowser<TestItem>({
          records: testItems,
          columns: testColumns,
          idAccessor: 'id',
          identityField: 'name',
          pageSize: 2,
          browseState: browse,
          onBrowseStateChange: (next) => setTimeout(() => setBrowse(next), 10),
        });
        return (
          <div>
            <div data-testid="delayed-page">{browser.page}</div>
            <div data-testid="delayed-filters">
              {JSON.stringify(browser.filters)}
            </div>
            <button
              type="button"
              onClick={() => browser.setFilter('category', ['Boss', 'Normal'])}
            >
              Delayed filter
            </button>
            <button type="button" onClick={() => browser.setPage(2)}>
              Delayed page 2
            </button>
          </div>
        );
      }

      await render(<DelayedHarness />);
      await userEvent.click(
        page.getByRole('button', { name: 'Delayed filter' }),
      );
      await vi.waitFor(() =>
        expect(text('delayed-filters')).toBe(
          JSON.stringify({ category: ['Boss', 'Normal'] }),
        ),
      );
      await userEvent.click(
        page.getByRole('button', { name: 'Delayed page 2' }),
      );
      await vi.waitFor(() => expect(text('delayed-page')).toBe('2'));
      expect(text('delayed-filters')).toBe(
        JSON.stringify({ category: ['Boss', 'Normal'] }),
      );
    });

    it('adopts external canonical restoration over a rejected proposal', async () => {
      function RestoreHarness() {
        const [browse, setBrowse] = useState<BrowseState>({
          search: '',
          filters: {},
          page: 1,
          pageSize: 2,
          hiddenColumns: [],
        });
        const browser = useFacetedBrowser<TestItem>({
          records: testItems,
          columns: testColumns,
          idAccessor: 'id',
          identityField: 'name',
          pageSize: 2,
          browseState: browse,
          // Reject every proposal.
          onBrowseStateChange: () => undefined,
        });
        return (
          <div>
            <div data-testid="restore-filters">
              {JSON.stringify(browser.filters)}
            </div>
            <button
              type="button"
              onClick={() => browser.setFilter('category', ['Boss'])}
            >
              Rejected filter
            </button>
            <button
              type="button"
              onClick={() =>
                setBrowse({
                  search: '',
                  filters: {},
                  page: 1,
                  pageSize: 2,
                  hiddenColumns: [],
                })
              }
            >
              Restore
            </button>
          </div>
        );
      }

      await render(<RestoreHarness />);
      await userEvent.click(
        page.getByRole('button', { name: 'Rejected filter' }),
      );
      await userEvent.click(page.getByRole('button', { name: 'Restore' }));
      await vi.waitFor(() =>
        expect(text('restore-filters')).toBe(JSON.stringify({})),
      );
    });

    it('normalizes invalid page and pageSize inputs', async () => {
      function InvalidPaginationHarness() {
        const browser = useFacetedBrowser({
          records: testItems,
          idAccessor: 'id',
          identityField: 'name',
          pageSize: 2,
        });

        return (
          <div>
            <div data-testid="invalid-page">{browser.page}</div>
            <div data-testid="invalid-page-size">{browser.pageSize}</div>
            <button type="button" onClick={() => browser.setPage(Number.NaN)}>
              Invalid Page
            </button>
            <button
              type="button"
              onClick={() => browser.setPageSize(Number.NaN)}
            >
              Invalid Page Size
            </button>
          </div>
        );
      }

      await render(<InvalidPaginationHarness />);
      await userEvent.click(page.getByRole('button', { name: 'Invalid Page' }));
      await userEvent.click(
        page.getByRole('button', { name: 'Invalid Page Size' }),
      );
      expect(text('invalid-page')).toBe('1');
      expect(text('invalid-page-size')).toBe('2');
    });

    it('registers explicit search-only fields without adding visual columns', async () => {
      function SearchOnlyFieldHarness() {
        const browser = useFacetedBrowser({
          records: testItems,
          idAccessor: 'id',
          identityField: 'name',
          searchFields: ['category'],
          search: 'Boss',
        });

        return (
          <div>
            <div data-testid="search-only-records">
              {browser.records.map((record) => record.name).join(',')}
            </div>
            <div data-testid="search-only-columns">
              {browser.visibleColumns
                .map((column) => column.accessor)
                .join(',')}
            </div>
          </div>
        );
      }

      await render(<SearchOnlyFieldHarness />);
      expect(text('search-only-records')).toBe('Alpha,Gamma');
      expect(text('search-only-columns')).toBe('');
    });

    it('keeps an explicit empty searchFields list as search nowhere', async () => {
      function NoSearchFieldsHarness() {
        const browser = useFacetedBrowser({
          records: testItems,
          idAccessor: 'id',
          identityField: 'name',
          searchFields: [],
          search: 'Alpha',
        });

        return (
          <div data-testid="no-search-fields-records">
            {browser.records.map((record) => record.name).join(',')}
          </div>
        );
      }

      await render(<NoSearchFieldsHarness />);
      expect(text('no-search-fields-records')).toBe('');
    });

    it('clears filters with an empty controlled search and no search callback', async () => {
      await mountHarness({
        options: {
          search: '',
          defaultFilters: { category: ['Boss'] },
        },
      });
      expect(text('matching-count')).toBe('2');
      await userEvent.click(page.getByRole('button', { name: 'Clear Query' }));
      expect(text('matching-count')).toBe('5');
    });

    it('clears controlled search through onSearchChange from clearQuery', async () => {
      function ControlledClearHarness() {
        const [search, setSearch] = useState('Alpha');
        const browser = useFacetedBrowser({
          records: testItems,
          idAccessor: 'id',
          identityField: 'name',
          pageSize: 2,
          search,
          onSearchChange: setSearch,
        });

        return (
          <div>
            <div data-testid="clear-search">{search}</div>
            <div data-testid="clear-records">
              {browser.records.map((record) => record.name).join(',')}
            </div>
            <button type="button" onClick={() => browser.clearQuery()}>
              Clear Query
            </button>
          </div>
        );
      }

      await render(<ControlledClearHarness />);
      expect(text('clear-search')).toBe('Alpha');
      expect(text('clear-records')).toBe('Alpha');
      await userEvent.click(page.getByRole('button', { name: 'Clear Query' }));
      expect(text('clear-search')).toBe('');
      expect(text('clear-records')).toBe('Alpha,Beta');
    });

    it('routes setSearch through onSearchChange for controlled search props', async () => {
      function ControlledSearchHarness() {
        const [search, setSearch] = useState('');
        const browser = useFacetedBrowser({
          records: testItems,
          idAccessor: 'id',
          identityField: 'name',
          pageSize: 2,
          search,
          onSearchChange: setSearch,
        });

        return (
          <div>
            <div data-testid="controlled-search">{search}</div>
            <div data-testid="controlled-search-records">
              {browser.records.map((record) => record.name).join(',')}
            </div>
            <button type="button" onClick={() => browser.setSearch('Gamma')}>
              Controlled Search Gamma
            </button>
          </div>
        );
      }

      await render(<ControlledSearchHarness />);
      expect(text('controlled-search-records')).toBe('Alpha,Beta');
      await userEvent.click(
        page.getByRole('button', { name: 'Controlled Search Gamma' }),
      );
      expect(text('controlled-search')).toBe('Gamma');
      expect(text('controlled-search-records')).toBe('Gamma');
    });
  });

  describe('Stable default inputs', () => {
    it('keeps evaluateDraft stable across unrelated renders and refreshes on data changes', async () => {
      const recordsB = testItems.slice(0, 2);

      function StableDraftHarness({
        records,
        label,
      }: {
        readonly records: readonly TestItem[];
        readonly label: string;
      }) {
        const browser = useFacetedBrowser({
          records,
          idAccessor: 'id',
          identityField: 'name',
        });
        const changes = useRef(0);
        const previousDraft = useRef(browser.evaluateDraft);
        const counter = useRef<HTMLOutputElement>(null);

        useEffect(() => {
          if (previousDraft.current === browser.evaluateDraft) return;
          previousDraft.current = browser.evaluateDraft;
          changes.current += 1;
          if (counter.current) {
            counter.current.textContent = String(changes.current);
          }
        }, [browser.evaluateDraft]);

        return (
          <div>
            <div data-testid="stable-label">{label}</div>
            <output ref={counter} data-testid="callback-changes">
              0
            </output>
            <div data-testid="draft-count">
              {browser.evaluateDraft({}).matchingCount}
            </div>
          </div>
        );
      }

      const browser = await render(
        <StableDraftHarness records={testItems} label="first" />,
      );
      await expect.poll(() => text('callback-changes')).toBe('0');
      expect(text('draft-count')).toBe('5');

      await browser.rerender(
        <StableDraftHarness records={testItems} label="second" />,
      );
      expect(text('stable-label')).toBe('second');
      await expect.poll(() => text('callback-changes')).toBe('0');

      await browser.rerender(
        <StableDraftHarness records={recordsB} label="third" />,
      );
      await expect.poll(() => text('callback-changes')).toBe('1');
      expect(text('draft-count')).toBe('2');

      await browser.rerender(
        <StableDraftHarness records={recordsB} label="fourth" />,
      );
      await expect.poll(() => text('callback-changes')).toBe('1');
    });
  });

  describe('Card-only headless usage (without table columns)', () => {
    it('processes records, pagination, and text search without column definitions', async () => {
      function CardOnlyHarness() {
        const [search, setSearch] = useState('');
        const browser = useFacetedBrowser({
          records: testItems,
          idAccessor: 'id',
          identityField: 'name',
          pageSize: 2,
          search,
        });

        return (
          <div>
            <div data-testid="card-count">{browser.records.length}</div>
            <div data-testid="card-names">
              {browser.records.map((r) => r.name).join(',')}
            </div>
            <div data-testid="total-pages">{browser.pageCount}</div>
            <button type="button" onClick={() => browser.setPage(2)}>
              Next Card Page
            </button>
            <input
              aria-label="Search cards"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        );
      }

      await render(<CardOnlyHarness />);
      expect(text('card-count')).toBe('2');
      expect(text('card-names')).toBe('Alpha,Beta');
      expect(text('total-pages')).toBe('3');

      await userEvent.click(
        page.getByRole('button', { name: 'Next Card Page' }),
      );
      expect(text('card-names')).toBe('Gamma,Delta');

      await userEvent.type(
        page.getByRole('textbox', { name: 'Search cards' }),
        'Eps',
      );
      expect(text('card-names')).toBe('Epsilon');
    });

    it('filters, calculates faceted counts, sorts, and paginates on queryFields with no visual table columns', async () => {
      interface MapWorkspaceRecord extends Record<string, unknown> {
        readonly mapId: string;
        readonly mapName: string;
        readonly region: string;
        readonly mobCount: number;
        readonly connectedTowns: readonly string[];
      }

      const mapRecords: readonly MapWorkspaceRecord[] = [
        {
          mapId: '1000',
          mapName: 'Henesys Hunting Ground',
          region: 'Victoria',
          mobCount: 24,
          connectedTowns: ['Henesys'],
        },
        {
          mapId: '1010',
          mapName: 'Ellinia Forest Path',
          region: 'Victoria',
          mobCount: 15,
          connectedTowns: ['Ellinia', 'Henesys'],
        },
        {
          mapId: '2000',
          mapName: 'Orbis Cloud Park',
          region: 'Ossyria',
          mobCount: 30,
          connectedTowns: ['Orbis'],
        },
        {
          mapId: '2010',
          mapName: 'El Nath Ice Valley',
          region: 'Ossyria',
          mobCount: 18,
          connectedTowns: ['El Nath', 'Orbis'],
        },
      ];

      function MapCardBrowserHarness() {
        const browser = useFacetedBrowser<MapWorkspaceRecord>({
          records: mapRecords,
          idAccessor: 'mapId',
          identityField: 'mapName',
          pageSize: 2,
          defaultSort: { field: 'mobCount', direction: 'desc' },
          queryFields: [
            'region',
            {
              id: 'mobCount',
              sortable: true,
              firstSortDirection: 'desc',
            },
            {
              id: 'connectedTowns',
              accessor: (r) => r.connectedTowns,
            },
            // Computed field: high density spawn
            {
              id: 'isHighDensity',
              accessor: (r) => r.mobCount >= 20,
            },
          ],
        });

        return (
          <div>
            <div data-testid="card-page">{browser.page}</div>
            <div data-testid="card-total-matches">
              {browser.totalMatchingCount}
            </div>
            <div data-testid="card-results">
              {browser.records.map((r) => r.mapName).join(',')}
            </div>
            <div data-testid="facet-victoria">
              {browser.getFacetCount('region', 'Victoria')}
            </div>
            <div data-testid="facet-ossyria">
              {browser.getFacetCount('region', 'Ossyria')}
            </div>
            <div data-testid="facet-henesys">
              {browser.getFacetCount('connectedTowns', 'Henesys')}
            </div>
            <div data-testid="facet-orbis">
              {browser.getFacetCount('connectedTowns', 'Orbis')}
            </div>
            <button
              type="button"
              onClick={() => browser.setFilter('region', ['Victoria'])}
            >
              Filter Victoria
            </button>
            <button
              type="button"
              onClick={() =>
                browser.setFilter('connectedTowns', ['Henesys', 'Orbis'])
              }
            >
              Filter Henesys Or Orbis
            </button>
            <button
              type="button"
              onClick={() => browser.setSort('mobCount', 'asc')}
            >
              Sort Mob Count Asc
            </button>
            <button type="button" onClick={() => browser.setPage(2)}>
              Next Page
            </button>
          </div>
        );
      }

      await render(<MapCardBrowserHarness />);
      // Initial mobCount desc: Orbis Cloud Park (30), Henesys Hunting Ground (24) on page 1
      expect(text('card-results')).toBe(
        'Orbis Cloud Park,Henesys Hunting Ground',
      );
      expect(text('card-total-matches')).toBe('4');
      expect(text('facet-victoria')).toBe('2');
      expect(text('facet-ossyria')).toBe('2');
      expect(text('facet-henesys')).toBe('2'); // Henesys HG + Ellinia Path
      expect(text('facet-orbis')).toBe('2'); // Orbis Cloud + El Nath Ice

      // Filter Victoria
      await userEvent.click(
        page.getByRole('button', { name: 'Filter Victoria' }),
      );
      expect(text('card-total-matches')).toBe('2');
      expect(text('card-results')).toBe(
        'Henesys Hunting Ground,Ellinia Forest Path',
      );

      // Contextual faceting: region's own counts exclude region filter, but connectedTowns reflects Victoria records
      expect(text('facet-victoria')).toBe('2');
      expect(text('facet-ossyria')).toBe('2');
      expect(text('facet-henesys')).toBe('2');
      expect(text('facet-orbis')).toBe('0'); // 0 Victoria maps connect to Orbis

      // Sort mob count asc
      await userEvent.click(
        page.getByRole('button', { name: 'Sort Mob Count Asc' }),
      );
      expect(text('card-results')).toBe(
        'Ellinia Forest Path,Henesys Hunting Ground',
      );
    });
  });

  describe('Multi-valued fields and distinct faceted counts', () => {
    interface MonsterRecord extends Record<string, unknown> {
      readonly id: string;
      readonly name: string;
      readonly category: string;
      readonly elements: readonly string[];
      readonly dropSources: readonly string[];
    }

    const monsterRecords: readonly MonsterRecord[] = [
      {
        id: 'm1',
        name: 'Fire Boar',
        category: 'Normal',
        elements: ['fire'],
        dropSources: ['Perion', 'Perion'], // duplicate for distinct-record test
      },
      {
        id: 'm2',
        name: 'Crimson Balrog',
        category: 'Boss',
        elements: ['fire', 'poison'],
        dropSources: ['Ship', 'Ellinia'],
      },
      {
        id: 'm3',
        name: 'Ice Drake',
        category: 'Elite',
        elements: ['ice', 'lightning'],
        dropSources: ['Dungeon'],
      },
      {
        id: 'm4',
        name: 'Zakum',
        category: 'Boss',
        elements: ['fire', 'poison', 'ice'],
        dropSources: ['El Nath'],
      },
    ];

    function MultiValueHarness() {
      const browser = useFacetedBrowser<MonsterRecord>({
        records: monsterRecords,
        idAccessor: 'id',
        identityField: 'name',
        queryFields: [
          'category',
          {
            id: 'elements',
            accessor: (r) => r.elements,
          },
          {
            id: 'dropSources',
            accessor: (r) => r.dropSources,
          },
        ],
      });

      return (
        <div>
          <div data-testid="mv-matches">{browser.totalMatchingCount}</div>
          <div data-testid="mv-records">
            {browser.records.map((r) => r.name).join(',')}
          </div>
          <div data-testid="count-fire">
            {browser.getFacetCount('elements', 'fire')}
          </div>
          <div data-testid="count-poison">
            {browser.getFacetCount('elements', 'poison')}
          </div>
          <div data-testid="count-ice">
            {browser.getFacetCount('elements', 'ice')}
          </div>
          <div data-testid="count-lightning">
            {browser.getFacetCount('elements', 'lightning')}
          </div>
          <div data-testid="count-holy">
            {browser.getFacetCount('elements', 'holy')}
          </div>
          <div data-testid="count-unknown-col">
            {browser.getFacetCount('nonExistentField', 'value')}
          </div>
          <div data-testid="count-drop-perion">
            {browser.getFacetCount('dropSources', 'Perion')}
          </div>
          <button
            type="button"
            onClick={() => browser.setFilter('elements', ['fire'])}
          >
            Filter Fire
          </button>
          <button
            type="button"
            onClick={() => browser.setFilter('elements', ['fire', 'ice'])}
          >
            Filter Fire Or Ice
          </button>
          <button
            type="button"
            onClick={() => browser.setFilter('category', ['Boss'])}
          >
            Filter Boss
          </button>
          <button
            type="button"
            onClick={() =>
              browser.setFilters({
                category: ['Boss'],
                elements: ['poison'],
              })
            }
          >
            Filter Boss And Poison
          </button>
          <button type="button" onClick={() => browser.resetFilters()}>
            Reset
          </button>
        </div>
      );
    }

    it('uses getUniqueValues so a multi-valued record contributes to each distinct facet count', async () => {
      await render(<MultiValueHarness />);
      // fire: m1 (Fire Boar), m2 (Crimson Balrog), m4 (Zakum) = 3
      expect(text('count-fire')).toBe('3');
      // poison: m2 (Crimson Balrog), m4 (Zakum) = 2
      expect(text('count-poison')).toBe('2');
      // ice: m3 (Ice Drake), m4 (Zakum) = 2
      expect(text('count-ice')).toBe('2');
      // lightning: m3 (Ice Drake) = 1
      expect(text('count-lightning')).toBe('1');
    });

    it('enforces distinct-record semantics so duplicate values in a single record do not double count', async () => {
      await render(<MultiValueHarness />);
      // m1 has dropSources: ['Perion', 'Perion'] -> should count as 1 distinct record
      expect(text('count-drop-perion')).toBe('1');
    });

    it('distinguishes known zero from unknown facet values', async () => {
      await render(<MultiValueHarness />);
      // 'holy' is an element not present in any record -> 0
      expect(text('count-holy')).toBe('0');
      // unknown column -> 0
      expect(text('count-unknown-col')).toBe('0');
    });

    it('supports OR within a multi-valued facet and AND across multiple facets', async () => {
      await render(<MultiValueHarness />);

      // OR within facet: 'fire' OR 'ice' matches m1, m2, m3, m4 (all 4)
      await userEvent.click(
        page.getByRole('button', { name: 'Filter Fire Or Ice' }),
      );
      expect(text('mv-matches')).toBe('4');

      // AND across facets: Boss AND poison matches m2 (Crimson Balrog) and m4 (Zakum)
      await userEvent.click(
        page.getByRole('button', { name: 'Filter Boss And Poison' }),
      );
      expect(text('mv-matches')).toBe('2');
      expect(text('mv-records')).toBe('Crimson Balrog,Zakum');
    });

    it('provides contextual facet counts excluding the current facet own filter while respecting other facets', async () => {
      await render(<MultiValueHarness />);

      // Apply category = Boss
      await userEvent.click(page.getByRole('button', { name: 'Filter Boss' }));
      expect(text('mv-matches')).toBe('2'); // Crimson Balrog and Zakum

      // Among Bosses: fire=2, poison=2, ice=1, lightning=0 (known zero in this context)
      expect(text('count-fire')).toBe('2');
      expect(text('count-poison')).toBe('2');
      expect(text('count-ice')).toBe('1');
      expect(text('count-lightning')).toBe('0');

      // Now add filter elements = ['fire'].
      // Contextual faceting: elements' own filter is excluded when querying elements facet counts,
      // so we still see poison=2, ice=1 available among Bosses!
      await userEvent.click(page.getByRole('button', { name: 'Filter Fire' }));
      expect(text('mv-matches')).toBe('2');
      expect(text('count-poison')).toBe('2');
      expect(text('count-ice')).toBe('1');
      expect(text('count-lightning')).toBe('0');
    });
  });

  describe('Authoritative draft evaluation and atomic filter commit', () => {
    it('evaluates candidate draft non-mutatingly and matches committed post-Apply results exactly', async () => {
      function DraftEvalHarness() {
        const [draftCount, setDraftCount] = useState<number | null>(null);
        const browser = useFacetedBrowser({
          records: testItems,
          columns: testColumns,
          idAccessor: 'id',
          identityField: 'name',
          pageSize: 2,
        });

        return (
          <div>
            <div data-testid="browser-matches">
              {browser.totalMatchingCount}
            </div>
            <div data-testid="draft-matches">{String(draftCount)}</div>
            <div data-testid="browser-page">{browser.page}</div>
            <button
              type="button"
              onClick={() => {
                const evalResult = browser.evaluateDraft({
                  category: ['Boss'],
                  tags: ['undead'],
                });
                setDraftCount(evalResult.matchingCount);
              }}
            >
              Preview Draft
            </button>
            <button
              type="button"
              onClick={() => {
                browser.setFilters({
                  category: ['Boss'],
                  tags: ['undead'],
                });
              }}
            >
              Apply Draft
            </button>
            <button type="button" onClick={() => browser.setPage(2)}>
              Go Page 2
            </button>
          </div>
        );
      }

      await render(<DraftEvalHarness />);
      expect(text('browser-matches')).toBe('5');
      expect(text('draft-matches')).toBe('null');

      // Go to page 2 first
      await userEvent.click(page.getByRole('button', { name: 'Go Page 2' }));
      expect(text('browser-page')).toBe('2');

      // Preview draft: category=Boss AND tags=undead -> only Alpha matches (1)
      await userEvent.click(
        page.getByRole('button', { name: 'Preview Draft' }),
      );
      // Non-mutating: browser state is completely untouched!
      expect(text('draft-matches')).toBe('1');
      expect(text('browser-matches')).toBe('5');
      expect(text('browser-page')).toBe('2');

      // Apply draft atomically: totalMatchingCount becomes 1, page resets to 1 in one transition
      await userEvent.click(page.getByRole('button', { name: 'Apply Draft' }));
      expect(text('browser-matches')).toBe('1');
      expect(text('browser-page')).toBe('1');
      expect(text('browser-matches')).toBe(text('draft-matches'));
    });
  });

  describe('Draft facet counts', () => {
    it('uses contextual TanStack facet counts for the candidate draft', async () => {
      function DraftFacetHarness() {
        const browser = useFacetedBrowser({
          records: testItems,
          columns: testColumns,
          idAccessor: 'id',
          identityField: 'name',
        });
        const draft = browser.evaluateDraft({
          category: ['Boss'],
          tags: ['undead'],
        });
        const category = draft.getFacetValues('category');
        const tags = draft.getFacetValues('tags');

        return (
          <div>
            <div data-testid="draft-category-boss">
              {category.get('Boss') ?? 0}
            </div>
            <div data-testid="draft-category-elite">
              {category.get('Elite') ?? 0}
            </div>
            <div data-testid="draft-category-normal">
              {category.get('Normal') ?? 0}
            </div>
            <div data-testid="draft-tag-fire">{tags.get('fire') ?? 0}</div>
            <div data-testid="draft-tag-undead">{tags.get('undead') ?? 0}</div>
          </div>
        );
      }

      await render(<DraftFacetHarness />);
      expect(text('draft-category-boss')).toBe('1');
      expect(text('draft-category-elite')).toBe('1');
      expect(text('draft-category-normal')).toBe('0');
      expect(text('draft-tag-fire')).toBe('2');
      expect(text('draft-tag-undead')).toBe('1');
    });
  });

  describe('Draft parity with custom filters and search', () => {
    interface Ticket extends Record<string, unknown> {
      readonly id: string;
      readonly name: string;
      readonly status: string;
      readonly priority: number;
    }

    const tickets: readonly Ticket[] = [
      { id: 't1', name: 'Alpha', status: 'open', priority: 1 },
      { id: 't2', name: 'Beta', status: 'open', priority: 5 },
      { id: 't3', name: 'Gamma', status: 'closed', priority: 9 },
      { id: 't4', name: 'Delta', status: 'open', priority: 9 },
    ];

    function CustomFilterDraftHarness() {
      const browser = useFacetedBrowser<Ticket>({
        records: tickets,
        idAccessor: 'id',
        identityField: 'name',
        search: 'ta',
        defaultFilters: { status: ['closed'] },
        queryFields: [
          'status',
          {
            id: 'risk',
            accessor: (ticket) => (ticket.priority >= 5 ? 'high' : 'low'),
            filterFn: (row, _columnId, filterValue) => {
              const selected = new Set(
                Array.isArray(filterValue) ? filterValue : [filterValue],
              );
              return selected.has('high')
                ? row.original.priority >= 5
                : row.original.priority < 5;
            },
          },
        ],
      });
      const draft = { status: ['open'], risk: ['high'] };

      return (
        <div>
          <div data-testid="custom-committed">{browser.totalMatchingCount}</div>
          <div data-testid="custom-record-names">
            {browser.records.map((ticket) => ticket.name).join(',')}
          </div>
          <div data-testid="custom-draft">
            {browser
              .evaluateDraft(draft)
              .matchingRecords.map((ticket) => ticket.name)
              .join(',')}
          </div>
          <button type="button" onClick={() => browser.setFilters(draft)}>
            Apply Custom Draft
          </button>
        </div>
      );
    }

    it('uses the same TanStack filter callbacks for draft preview and commit', async () => {
      await render(<CustomFilterDraftHarness />);
      expect(text('custom-draft')).toBe('Beta,Delta');
      expect(text('custom-committed')).toBe('0');

      await userEvent.click(
        page.getByRole('button', { name: 'Apply Custom Draft' }),
      );
      expect(text('custom-committed')).toBe('2');
      expect(text('custom-record-names')).toBe('Beta,Delta');
      expect(text('custom-draft')).toBe('Beta,Delta');
    });
  });

  describe('Deterministic sorting and identity tie-breaking', () => {
    it('breaks ties deterministically using idAccessor when primary sort values are identical', async () => {
      interface ItemWithDuplicates extends Record<string, unknown> {
        readonly id: string;
        readonly name: string;
        readonly priority: number;
      }

      const duplicateItems: readonly ItemWithDuplicates[] = [
        { id: 'item-3', name: 'Charlie', priority: 10 },
        { id: 'item-1', name: 'Alpha', priority: 10 },
        { id: 'item-2', name: 'Bravo', priority: 10 },
      ];

      function TieBreakHarness() {
        const browser = useFacetedBrowser<ItemWithDuplicates>({
          records: duplicateItems,
          idAccessor: 'id',
          identityField: 'name',
          defaultSort: { field: 'priority', direction: 'desc' },
          queryFields: ['priority'],
        });

        return (
          <div>
            <div data-testid="sorted-ids">
              {browser.records.map((r) => r.id).join(',')}
            </div>
          </div>
        );
      }

      await render(<TieBreakHarness />);
      // Primary sort priority: all 10. Secondary tie-breaker id asc: item-1, item-2, item-3
      expect(text('sorted-ids')).toBe('item-1,item-2,item-3');
    });
  });

  describe('Scope changes and external callbacks', () => {
    it('clamps pagination and recomputes matching counts when records scope changes', async () => {
      function ScopeHarness() {
        const [scope, setScope] = useState<'all' | 'small'>('all');
        const records = scope === 'all' ? testItems : testItems.slice(0, 1);

        const browser = useFacetedBrowser({
          records,
          columns: testColumns,
          idAccessor: 'id',
          identityField: 'name',
          pageSize: 2,
        });

        return (
          <div>
            <div data-testid="scope-total">{browser.totalRecordCount}</div>
            <div data-testid="scope-matches">{browser.totalMatchingCount}</div>
            <div data-testid="scope-page">{browser.page}</div>
            <button type="button" onClick={() => browser.setPage(3)}>
              Go Page 3
            </button>
            <button type="button" onClick={() => setScope('small')}>
              Switch Scope
            </button>
          </div>
        );
      }

      await render(<ScopeHarness />);
      expect(text('scope-total')).toBe('5');
      await userEvent.click(page.getByRole('button', { name: 'Go Page 3' }));
      expect(text('scope-page')).toBe('3');

      // Switch scope to 1 record: page clamps to 1, counts update immediately
      await userEvent.click(page.getByRole('button', { name: 'Switch Scope' }));
      expect(text('scope-total')).toBe('1');
      expect(text('scope-matches')).toBe('1');
      expect(text('scope-page')).toBe('1');
    });
  });
});
