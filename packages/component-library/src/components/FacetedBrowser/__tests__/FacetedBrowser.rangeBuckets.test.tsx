import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import '@/styles.css';
import { FacetedBrowser } from '@/components/FacetedBrowser';
import type {
  BrowseState,
  FacetDefinition,
  FacetFilterValue,
  FacetRangeBucket,
  QueryFieldDefinition,
} from '@/components/FacetedBrowser';

interface LevelRecord extends Record<string, unknown> {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly boss: boolean;
  readonly group: string;
}

const rows: readonly LevelRecord[] = [
  { id: 'a', name: 'Alpha', level: 5, boss: true, group: 'fixture' },
  { id: 'b', name: 'Bravo', level: 12, boss: false, group: 'fixture' },
  { id: 'c', name: 'Charlie', level: 25, boss: true, group: 'fixture' },
  { id: 'd', name: 'Delta', level: 41, boss: false, group: 'fixture' },
  { id: 'e', name: 'Echo', level: 60, boss: false, group: 'fixture' },
  { id: 'f', name: 'Foxtrot', level: 90, boss: false, group: 'fixture' },
];

// One more bucket than the control's default limit of 3, so "See more" has
// something to reveal. Counts are supplied by the engine, not the buckets.
const buckets: readonly FacetRangeBucket[] = [
  { value: '1-20', label: '1–20', min: 1, max: 20 },
  { value: '21-40', label: '21–40', min: 21, max: 40 },
  { value: '41-60', label: '41–60', min: 41, max: 60 },
  { value: '61-80', label: '61–80', min: 61, max: 80 },
  { value: '81-100', label: '81–100', min: 81, max: 100 },
];

const queryFields: readonly QueryFieldDefinition<LevelRecord>[] = [
  { id: 'level', accessor: 'level', sortable: false },
  { id: 'boss', accessor: 'boss', sortable: false },
  { id: 'group', accessor: 'group', sortable: false },
];

const quantileFacets: readonly FacetDefinition<LevelRecord>[] = [
  {
    id: 'level',
    field: 'level',
    label: 'Level',
    kind: 'range',
    buckets: 'quantile',
  },
  { id: 'boss', field: 'boss', label: 'Boss', kind: 'boolean' },
];

const bucketedFacets: readonly FacetDefinition<LevelRecord>[] = [
  { id: 'level', field: 'level', label: 'Level', kind: 'range', buckets },
  { id: 'boss', field: 'boss', label: 'Boss', kind: 'boolean' },
];

/** One extra non-range facet, for the global-reset regression below. */
const facetsWithGroup: readonly FacetDefinition<LevelRecord>[] = [
  ...bucketedFacets,
  {
    id: 'group',
    field: 'group',
    label: 'Group',
    kind: 'multi-select',
    options: [{ value: 'fixture', label: 'Fixture' }],
  },
];

const plainRangeFacets: readonly FacetDefinition<LevelRecord>[] = [
  { id: 'level', field: 'level', label: 'Level', kind: 'range' },
  { id: 'boss', field: 'boss', label: 'Boss', kind: 'boolean' },
];

function LevelBrowser({
  facets,
  initialFilters,
}: {
  readonly facets: readonly FacetDefinition<LevelRecord>[];
  readonly initialFilters?: Record<string, FacetFilterValue>;
}): ReactElement {
  const [state, setState] = useState<BrowseState>({
    search: '',
    filters: initialFilters ?? {},
    page: 1,
    pageSize: 20,
    hiddenColumns: [],
  });

  return (
    <MantineProvider>
      <FacetedBrowser
        title={<h1>Monsters</h1>}
        records={rows}
        idAccessor="id"
        queryFields={queryFields}
        facets={facets}
        presentation="cards"
        recordNoun="monsters"
        renderCard={(record) => <span>{record.name}</span>}
        state={state}
        onStateChange={setState}
      />
    </MantineProvider>
  );
}

function resultNames(): readonly (string | null)[] {
  return [...document.querySelectorAll('[role="listitem"]')].map(
    (item) => item.textContent,
  );
}

const checkboxes = () => screen.queryAllByRole('checkbox');
const custom = () => screen.getByRole('checkbox', { name: 'Custom' });
const fromInput = () => screen.getByRole('textbox', { name: 'Level from' });
const toInput = () => screen.getByRole('textbox', { name: 'Level to' });
const seeMore = () => screen.getByRole('button', { name: 'See more' });

/**
 * The only rendered facet is `Level`, so the sole checkbox group is its bucket
 * group. `role="group"` wraps only the group's children; two levels up is the
 * `OptionList` wrapper that also holds Custom, the From/To block and See more.
 */
function levelFacetRoot(): HTMLElement {
  const group = document.querySelector<HTMLElement>('[role="group"]');
  expect(group).not.toBeNull();
  return group!.parentElement!.parentElement!;
}

/** Labels of every control inside the Level facet, in document order. */
function levelFacetLabels(): readonly string[] {
  return [
    ...levelFacetRoot().querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]), button',
    ),
  ].map((element) =>
    element instanceof HTMLInputElement
      ? (element.labels?.[0]?.textContent?.trim() ?? '')
      : (element.textContent?.trim() ?? ''),
  );
}

function follows(earlier: Element, later: Element): boolean {
  return Boolean(
    earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

describe('range facet buckets', () => {
  it('shows three buckets and Custom, then reveals the rest with See more', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    // Three buckets plus the Custom checkbox.
    expect(checkboxes()).toHaveLength(4);
    expect(
      screen.getByRole('checkbox', { name: /^1–20/u }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /^21–40/u }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /^41–60/u }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox', { name: /^61–80/u })).toHaveLength(
      0,
    );

    await userEvent.click(seeMore());
    expect(checkboxes()).toHaveLength(6);
    expect(
      screen.getByRole('checkbox', { name: /^61–80/u }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /^81–100/u }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'See less' }));
    expect(checkboxes()).toHaveLength(4);
    expect(screen.queryAllByRole('checkbox', { name: /^61–80/u })).toHaveLength(
      0,
    );
  });

  it('orders buckets, Custom, From/To and See more last', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    expect(levelFacetLabels()).toEqual([
      '1–20 (2)',
      '21–40 (1)',
      '41–60 (2)',
      'Custom',
      'See more',
    ]);

    await userEvent.click(custom());

    // Custom sits between the buckets and its inputs, and See more is last.
    expect(levelFacetLabels()).toEqual([
      '1–20 (2)',
      '21–40 (1)',
      '41–60 (2)',
      'Custom',
      'From',
      'To',
      'See more',
    ]);

    const lastBucket = screen.getByRole('checkbox', { name: /^41–60/u });
    expect(follows(lastBucket, custom())).toBe(true);
    expect(follows(custom(), fromInput())).toBe(true);
    expect(follows(fromInput(), toInput())).toBe(true);
    expect(follows(toInput(), seeMore())).toBe(true);
  });

  it('keeps Custom outside the bucket checkbox group', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    const group = document.querySelector<HTMLElement>('[role="group"]')!;
    const groupCheckboxes = group.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );

    // The group still carries the facet name as its accessible name.
    expect(screen.getByRole('group', { name: 'Level' })).toBeInTheDocument();
    expect(groupCheckboxes).toHaveLength(3);
    expect(
      [...groupCheckboxes].some(
        (input) =>
          input.labels?.[0]?.textContent?.trim() === 'Custom' ||
          input.value === 'custom',
      ),
    ).toBe(false);
    expect(group.contains(custom())).toBe(false);

    await userEvent.click(custom());
    // No sentinel entry leaks into the `string[]` bucket value.
    expect(
      [
        ...group.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
      ].filter((input) => input.checked),
    ).toHaveLength(0);
    expect(
      screen.queryAllByRole('button', { name: /^Remove Level: /u }),
    ).toHaveLength(0);
  });

  it('renders Custom as a checkbox, not a button', () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    const element = custom();
    expect(element.tagName).toBe('INPUT');
    expect(element.getAttribute('type')).toBe('checkbox');
    expect(screen.queryAllByRole('button', { name: 'Custom' })).toHaveLength(0);
  });

  it('always shows Custom without expanding', () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    expect(custom()).toBeVisible();
    expect(seeMore()).toBeVisible();
    expect(
      screen.queryByRole('textbox', { name: 'Level from' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Level to' }),
    ).not.toBeInTheDocument();
  });

  it('filters the result set when a bucket is selected', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);
    expect(resultNames()).toHaveLength(6);

    await userEvent.click(screen.getByRole('checkbox', { name: /^41–60/u }));

    expect(resultNames()).toEqual(['Delta', 'Echo']);
    expect(
      screen.getByRole('button', { name: 'Remove Level: 41–60' }),
    ).toBeInTheDocument();
  });

  it('ORs non-adjacent bucket selections and sums their counts', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    await userEvent.click(screen.getByRole('checkbox', { name: /^1–20/u }));
    await userEvent.click(screen.getByRole('checkbox', { name: /^41–60/u }));

    expect(screen.getByRole('checkbox', { name: /^1–20/u })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^41–60/u })).toBeChecked();
    // Alpha + Bravo (2) plus Delta + Echo (2).
    expect(resultNames()).toEqual(['Alpha', 'Bravo', 'Delta', 'Echo']);
  });

  it('reveals the From/To inputs when Custom is checked and filters from them', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    await userEvent.click(custom());
    expect(fromInput()).toBeVisible();
    expect(toInput()).toBeVisible();
    expect(custom()).toBeChecked();

    // Visible labels are short; the facet context lives in the accessible name.
    expect(screen.getByText('From', { exact: true })).toBeVisible();
    expect(screen.getByText('To', { exact: true })).toBeVisible();
    expect(screen.queryAllByRole('textbox', { name: /^From$/u })).toHaveLength(
      0,
    );
    expect(screen.queryAllByRole('textbox', { name: /^To$/u })).toHaveLength(0);

    fireEvent.change(fromInput(), { target: { value: '21' } });
    fireEvent.change(toInput(), { target: { value: '41' } });
    expect(resultNames()).toEqual(['Charlie', 'Delta']);
  });

  it('clears checked buckets when Custom is checked', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    await userEvent.click(screen.getByRole('checkbox', { name: /^1–20/u }));
    expect(resultNames()).toEqual(['Alpha', 'Bravo']);

    await userEvent.click(custom());
    expect(screen.getByRole('checkbox', { name: /^1–20/u })).not.toBeChecked();
    expect(resultNames()).toHaveLength(6);
    fireEvent.change(fromInput(), { target: { value: '21' } });
    fireEvent.change(toInput(), { target: { value: '41' } });

    expect(resultNames()).toEqual(['Charlie', 'Delta']);
  });

  it('clears a custom range when a bucket is checked', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    await userEvent.click(custom());
    fireEvent.change(fromInput(), { target: { value: '21' } });
    fireEvent.change(toInput(), { target: { value: '41' } });
    expect(resultNames()).toEqual(['Charlie', 'Delta']);

    await userEvent.click(screen.getByRole('checkbox', { name: /^1–20/u }));

    expect(
      screen.queryByRole('textbox', { name: 'Level from' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Level to' }),
    ).not.toBeInTheDocument();
    expect(custom()).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^1–20/u })).toBeChecked();
    expect(resultNames()).toEqual(['Alpha', 'Bravo']);
  });

  it('unchecking Custom clears the range and hides the inputs', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    await userEvent.click(custom());
    fireEvent.change(fromInput(), { target: { value: '21' } });
    fireEvent.change(toInput(), { target: { value: '41' } });
    expect(resultNames()).toEqual(['Charlie', 'Delta']);

    await userEvent.click(custom());

    expect(custom()).not.toBeChecked();
    expect(
      screen.queryByRole('textbox', { name: 'Level from' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Level to' }),
    ).not.toBeInTheDocument();
    expect(resultNames()).toHaveLength(6);
  });

  it('keeps Custom checked while the edited range coincides with a bucket', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    await userEvent.click(custom());
    fireEvent.change(fromInput(), { target: { value: '1' } });
    fireEvent.change(toInput(), { target: { value: '20' } });

    expect(custom()).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^1–20/u })).not.toBeChecked();
    expect(resultNames()).toEqual(['Alpha', 'Bravo']);
  });

  it('checks Custom and populates the inputs for a range matching no bucket', () => {
    render(
      <LevelBrowser
        facets={bucketedFacets}
        initialFilters={{ level: { min: 7, max: 9 } }}
      />,
    );

    expect(custom()).toBeChecked();
    expect(fromInput()).toHaveValue('7');
    expect(toInput()).toHaveValue('9');
  });

  it('treats an incoming numeric range as Custom even when it matches bucket bounds', () => {
    render(
      <LevelBrowser
        facets={bucketedFacets}
        initialFilters={{ level: { min: 1, max: 20 } }}
      />,
    );

    expect(custom()).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^1–20/u })).not.toBeChecked();
  });

  it('keeps Custom checked and the inputs mounted while a range is edited', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    await userEvent.click(custom());
    expect(fromInput()).toBeVisible();
    expect(toInput()).toBeVisible();

    fireEvent.change(fromInput(), { target: { value: '2' } });
    expect(custom()).toBeChecked();
    expect(fromInput()).toBeVisible();

    fireEvent.change(toInput(), { target: { value: '3' } });
    expect(custom()).toBeChecked();
    expect(fromInput()).toBeVisible();
  });

  it('unchecks Custom and unmounts the inputs when Clear filters runs', async () => {
    render(<LevelBrowser facets={bucketedFacets} />);

    await userEvent.click(custom());
    fireEvent.change(fromInput(), { target: { value: '21' } });
    fireEvent.change(toInput(), { target: { value: '41' } });
    expect(custom()).toBeChecked();
    expect(resultNames()).toEqual(['Charlie', 'Delta']);

    await userEvent.click(
      screen.getByRole('button', { name: 'Clear filters' }),
    );

    expect(custom()).not.toBeChecked();
    expect(
      screen.queryByRole('textbox', { name: 'Level from' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Level to' }),
    ).not.toBeInTheDocument();
    expect(resultNames()).toHaveLength(6);
  });

  it('closes an opened but empty Custom range when a global clear removes another facet', async () => {
    render(<LevelBrowser facets={facetsWithGroup} />);

    // Another facet makes the global Clear filters action available, while Level
    // has never committed a filter of its own.
    const fixtureFacet = screen.getByRole('checkbox', { name: /^Fixture \(/u });
    await userEvent.click(fixtureFacet);
    expect(fixtureFacet).toBeChecked();
    expect(
      screen.getByRole('button', { name: 'Clear filters' }),
    ).toBeInTheDocument();

    await userEvent.click(custom());
    expect(custom()).toBeChecked();
    expect(fromInput()).toBeVisible();
    expect(toInput()).toBeVisible();

    await userEvent.click(
      screen.getByRole('button', { name: 'Clear filters' }),
    );

    // Level's committed value was undefined before and after the reset, so this
    // can only pass with an explicit reset signal.
    expect(custom()).not.toBeChecked();
    expect(
      screen.queryByRole('textbox', { name: 'Level from' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Level to' }),
    ).not.toBeInTheDocument();
    // The reset remounts the facet list, so re-query rather than reading a
    // detached element.
    expect(
      screen.getByRole('checkbox', { name: /^Fixture \(/u }),
    ).not.toBeChecked();
    expect(resultNames()).toHaveLength(6);
  });

  it('keeps the visible facet label for a bucket-less range facet', () => {
    render(<LevelBrowser facets={plainRangeFacets} />);

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryAllByRole('button', { name: 'Custom' })).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: 'See more' }),
    ).not.toBeInTheDocument();
    // Standalone use keeps the facet name plus the short From/To labels.
    expect(screen.getByText('Level', { exact: true })).toBeVisible();
    expect(screen.getByText('From', { exact: true })).toBeVisible();
    expect(screen.getByText('To', { exact: true })).toBeVisible();
    expect(fromInput()).toBeVisible();
    expect(toInput()).toBeVisible();
  });
});

describe('bucket facets own their filtering', () => {
  it('rejects a bucketed facet whose filter is registered separately', () => {
    function Conflicting() {
      return (
        <MantineProvider>
          <FacetedBrowser
            title={<h1>Monsters</h1>}
            records={rows}
            idAccessor="id"
            presentation="cards"
            renderCard={(record) => <span>{record.name}</span>}
            facets={bucketedFacets}
            queryFields={[
              { id: 'level', accessor: 'level', filterFn: () => true },
              { id: 'boss', accessor: 'boss' },
            ]}
          />
        </MantineProvider>
      );
    }

    expect(() => render(<Conflicting />)).toThrow(
      /defines buckets, so its filterFn cannot be overridden/u,
    );
  });
});

/**
 * A bucket facet may target a *computed* query field. The facet owns filtering
 * only: the registered accessor, sortability and unique-value projection must
 * survive the derived filter, or filtering reads `row[fieldId]` (undefined here)
 * and sorting ignores the declared contract.
 */
interface ComputedRecord extends Record<string, unknown> {
  readonly id: string;
  readonly name: string;
  readonly level: number;
}

// Deliberately descending so a wrongly re-enabled sort is visible in the order.
const computedRows: readonly ComputedRecord[] = [
  { id: 'a', name: 'Alpha', level: 30 },
  { id: 'b', name: 'Bravo', level: 20 },
  { id: 'c', name: 'Charlie', level: 10 },
];

const scoreOf = (record: ComputedRecord): number => record.level * 10;

const computedBuckets: readonly FacetRangeBucket[] = [
  { value: '0-100', label: '0–100', min: 0, max: 100 },
  { value: '101-200', label: '101–200', min: 101, max: 200 },
  { value: '201-300', label: '201–300', min: 201, max: 300 },
];

const computedQueryFields: readonly QueryFieldDefinition<ComputedRecord>[] = [
  {
    id: 'score',
    accessor: scoreOf,
    sortable: false,
    firstSortDirection: 'desc',
    getUniqueValues: (record) => [scoreOf(record)],
  },
];

const computedFacets: readonly FacetDefinition<ComputedRecord>[] = [
  {
    id: 'score',
    field: 'score',
    label: 'Score',
    kind: 'range',
    buckets: computedBuckets,
  },
];

const computedQuantileFacets: readonly FacetDefinition<ComputedRecord>[] = [
  {
    id: 'score',
    field: 'score',
    label: 'Score',
    kind: 'range',
    buckets: 'quantile',
  },
];

function ComputedBrowser({
  facets: facetDefinitions = computedFacets,
}: {
  readonly facets?: readonly FacetDefinition<ComputedRecord>[];
} = {}): ReactElement {
  const [state, setState] = useState<BrowseState>({
    search: '',
    filters: {},
    // If `sortable: false` were lost, the engine would reorder by score.
    sort: { field: 'score', direction: 'asc' },
    page: 1,
    pageSize: 20,
    hiddenColumns: [],
  });

  return (
    <MantineProvider>
      <FacetedBrowser
        title={<h1>Computed</h1>}
        records={computedRows}
        idAccessor="id"
        queryFields={computedQueryFields}
        facets={facetDefinitions}
        presentation="custom"
        renderResults={({ records }) => (
          <ul aria-label="results">
            {records.map((record) => (
              <li key={record.id}>{record.name}</li>
            ))}
          </ul>
        )}
        state={state}
        onStateChange={setState}
      />
    </MantineProvider>
  );
}

describe('bucket facets over computed query fields', () => {
  it('filters through the registered accessor, not row[fieldId]', async () => {
    render(<ComputedBrowser />);

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['Alpha', 'Bravo', 'Charlie']);

    await userEvent.click(screen.getByRole('checkbox', { name: /^101–200/u }));

    // Only Bravo's computed score (200) is inside the bucket; the record has no
    // `score` property at all, so a lost accessor would match nothing.
    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['Bravo']);
  });

  it('derives quantile buckets from a computed accessor', async () => {
    render(<ComputedBrowser facets={computedQuantileFacets} />);

    // Scores are 300, 200, 100 from the accessor (never `row.score`).
    expect(
      screen
        .getAllByRole('checkbox')
        .map((element) =>
          (element as HTMLInputElement).labels?.[0]?.textContent?.trim(),
        ),
    ).toEqual(['100–200 (2)', '201–300 (1)', 'Custom']);

    await userEvent.click(screen.getByRole('checkbox', { name: /^201–300/u }));
    // Alpha's computed score is 300; the record itself has no `score` field.
    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['Alpha']);
  });

  it('keeps sortability and unique-value projection from the query field', () => {
    render(<ComputedBrowser />);

    // `sortable: false` survives: the requested score sort is not applied.
    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['Alpha', 'Bravo', 'Charlie']);

    // Counts prove `getUniqueValues` survived: one value per bucket.
    expect(
      screen.getByRole('checkbox', { name: '0–100 (1)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: '101–200 (1)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: '201–300 (1)' }),
    ).toBeInTheDocument();
  });
});

describe('quantile bucket facets', () => {
  it('derives readable buckets from the complete records and filters with them', async () => {
    render(<LevelBrowser facets={quantileFacets} />);

    // Levels 5,12,25,41,60,90 → five quantiles merge into four readable ranges.
    expect(levelFacetLabels()).toEqual([
      '5–15 (2)',
      '16–40 (1)',
      '41–60 (2)',
      'Custom',
      'See more',
    ]);

    await userEvent.click(screen.getByRole('checkbox', { name: /^41–60 \(/u }));
    expect(resultNames()).toEqual(['Delta', 'Echo']);

    await userEvent.click(screen.getByRole('checkbox', { name: /^5–15 \(/u }));
    expect(resultNames()).toEqual(['Alpha', 'Bravo', 'Delta', 'Echo']);
    // Chip labels use the same generated boundaries as the filter.
    expect(
      screen.getByRole('button', { name: 'Remove Level: 41–60' }),
    ).toBeInTheDocument();
  });

  it('keeps quantile buckets stable while other filters change', async () => {
    render(<LevelBrowser facets={facetsWithGroup} />);

    const labelsBefore = levelFacetLabels();
    await userEvent.click(
      screen.getByRole('checkbox', { name: /^Fixture \(/u }),
    );
    // Boundaries come from all records, not the filtered result set.
    expect(levelFacetLabels()).toEqual(labelsBefore);
  });
});
