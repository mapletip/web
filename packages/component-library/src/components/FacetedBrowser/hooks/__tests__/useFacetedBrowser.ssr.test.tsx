import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  useFacetedBrowser,
  type UseFacetedBrowserOptions,
  type UseFacetedBrowserReturn,
} from '@/components/FacetedBrowser';
import type { TableColumn } from '@/components/Table';

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

function evaluateHook(
  options: Partial<UseFacetedBrowserOptions<TestItem>> = {},
): UseFacetedBrowserReturn<TestItem> {
  let result: UseFacetedBrowserReturn<TestItem> | undefined;
  function Harness() {
    result = useFacetedBrowser<TestItem>({
      records: testItems,
      columns: testColumns,
      idAccessor: 'id',
      identityField: 'name',
      pageSize: 2,
      ...options,
    });
    return null;
  }
  renderToString(<Harness />);
  return result!;
}

describe('useFacetedBrowser plain Node SSR', () => {
  it('processes records into paginated slices in plain Node without browser globals', () => {
    const browser = evaluateHook();
    expect(browser.totalRecordCount).toBe(5);
    expect(browser.totalMatchingCount).toBe(5);
    expect(browser.pageCount).toBe(3);
    expect(browser.page).toBe(1);
    expect(browser.records).toHaveLength(2);
    expect(browser.records[0]?.name).toBe('Alpha');
    expect(browser.records[1]?.name).toBe('Beta');
  });

  it('filters with OR within facet and AND across facets in plain Node', () => {
    const browser = evaluateHook({
      defaultFilters: {
        category: ['Boss'],
        tags: ['undead'],
      },
    });
    expect(browser.totalMatchingCount).toBe(1);
    expect(browser.records).toHaveLength(1);
    expect(browser.records[0]?.name).toBe('Alpha');
  });

  it('supports card-only headless queryFields with computed attributes in plain Node', () => {
    const browser = evaluateHook({
      columns: undefined,
      queryFields: [
        'category',
        {
          id: 'isHighLevel',
          accessor: (row) => (row.level != null ? row.level >= 50 : false),
        },
      ],
      defaultFilters: {
        isHighLevel: true as unknown as string,
      },
    });
    // Alpha (100) and Delta (50) have level >= 50
    expect(browser.totalMatchingCount).toBe(2);
    expect(browser.records.map((r) => r.name)).toEqual(['Alpha', 'Delta']);
  });
});
