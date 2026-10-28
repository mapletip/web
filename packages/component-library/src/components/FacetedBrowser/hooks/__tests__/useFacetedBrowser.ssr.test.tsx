import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  useFacetedBrowser,
  type UseFacetedBrowserOptions,
  type UseFacetedBrowserReturn,
} from '@/components/FacetedBrowser/hooks/useFacetedBrowser';
import type { TableColumn } from '@/components/Table/types';

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

  it('evaluates numeric range and preserves known zero in plain Node', () => {
    const browser = evaluateHook({
      defaultFilters: {
        level: { min: 0, max: 50 },
      },
    });
    expect(browser.totalMatchingCount).toBe(3);
    const names = browser.allFilteredRecords.map((r) => r.name);
    expect(names).toContain('Beta'); // level 0
    expect(names).toContain('Delta'); // level 50
    expect(names).toContain('Epsilon'); // level 25
    expect(names).not.toContain('Gamma'); // null unknown
  });

  it('sorts numeric ascending with unknown last in plain Node', () => {
    const browser = evaluateHook({
      defaultSort: { field: 'level', direction: 'asc' },
    });
    const names = browser.allFilteredRecords.map((r) => r.name);
    // Beta: 0, Epsilon: 25, Delta: 50, Alpha: 100, Gamma: null (last!)
    expect(names).toEqual(['Beta', 'Epsilon', 'Delta', 'Alpha', 'Gamma']);
  });

  it('sorts numeric descending with unknown last in plain Node', () => {
    const browser = evaluateHook({
      defaultSort: { field: 'level', direction: 'desc' },
    });
    const names = browser.allFilteredRecords.map((r) => r.name);
    // Alpha: 100, Delta: 50, Epsilon: 25, Beta: 0, Gamma: null (last!)
    expect(names).toEqual(['Alpha', 'Delta', 'Epsilon', 'Beta', 'Gamma']);
  });

  it('computes faceted counts in plain Node', () => {
    const browser = evaluateHook();
    expect(browser.getFacetCount('category', 'Boss')).toBe(2);
    expect(browser.getFacetCount('category', 'Normal')).toBe(2);
    expect(browser.getFacetCount('category', 'Elite')).toBe(1);
  });

  it('computes multi-valued faceted counts with distinct-record semantics in plain Node', () => {
    const browser = evaluateHook();
    // testItems:
    // Alpha: ['fire', 'undead']
    // Beta: ['water']
    // Gamma: ['fire']
    // Delta: ['earth', 'undead']
    // Epsilon: ['air']
    expect(browser.getFacetCount('tags', 'fire')).toBe(2); // Alpha, Gamma
    expect(browser.getFacetCount('tags', 'undead')).toBe(2); // Alpha, Delta
    expect(browser.getFacetCount('tags', 'water')).toBe(1); // Beta
    expect(browser.getFacetCount('tags', 'holy')).toBe(0); // known zero
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

  it('evaluates candidate drafts non-mutatingly and tie-breaks deterministically in plain Node', () => {
    const browser = evaluateHook({
      defaultSort: { field: 'category', direction: 'asc' },
    });
    // Deterministic tie-breaking by idAccessor 'id' asc:
    // Boss: Alpha (id 1), Gamma (id 3)
    // Elite: Delta (id 4)
    // Normal: Beta (id 2), Epsilon (id 5)
    expect(browser.allFilteredRecords.map((r) => r.id)).toEqual([
      '1',
      '3',
      '4',
      '2',
      '5',
    ]);

    // Draft evaluation
    const draft = browser.evaluateDraft({ category: ['Normal'] });
    expect(draft.matchingCount).toBe(2);
    expect(draft.matchingRecords.map((r) => r.name)).toEqual([
      'Beta',
      'Epsilon',
    ]);
    // Committed browser state is unmutated
    expect(browser.totalMatchingCount).toBe(5);
  });
});
