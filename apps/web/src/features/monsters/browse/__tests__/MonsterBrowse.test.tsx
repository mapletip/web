import { MantineProvider } from '@mantine/core';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BUILD_ID } from '@/config/maplekit';

import { MonsterBrowse, monsterBrowseColumns } from '../MonsterBrowse';
import {
  projectMonsterBrowseRows,
  type MonsterBrowseRow,
  type MonsterDropItemOption,
} from '../project';

import {
  fixtureCatalog,
  fixtureRecord,
  knownFact,
} from './monsterCatalogFixture';

/**
 * App-level wiring: the column table, the opt-in total summary and the query
 * state the rail presets drive. The measured table DOM is DataTable's — the
 * Node SSR test asserts the real headers and cells, and the component library
 * owns the shared browser behavior. Cards are plain DOM, so the filtered result
 * set is asserted through them.
 */
/**
 * Contract-2 stat order: Level, HP, MP, EXP, … The MP sentinel is deliberately
 * distinct from EXP so a misplaced fixture cannot keep these tests green.
 */
const FIXTURE_MP = 999;

function record({
  key,
  name,
  level,
  hp,
  exp,
}: {
  readonly key: string;
  readonly name: string;
  readonly level: number;
  readonly hp: number;
  readonly exp: number;
}) {
  return fixtureRecord({
    key: `fixture:monster:${key}`,
    name: knownFact(name),
    stats: [
      knownFact(level),
      knownFact(hp),
      knownFact(FIXTURE_MP),
      knownFact(exp),
      knownFact(0),
      knownFact(0),
      knownFact(0),
      knownFact(0),
      knownFact(0),
      knownFact(0),
      knownFact(0),
      knownFact(0),
    ],
    traits: [
      knownFact(false),
      knownFact(false),
      knownFact(true),
      knownFact(0),
      knownFact(false),
      knownFact(false),
      knownFact(0),
      knownFact(0),
      knownFact('fixture'),
    ],
  });
}

const rows = projectMonsterBrowseRows(
  fixtureCatalog({
    records: [
      record({ key: '001', name: 'Sentinel Snail', level: 5, hp: 30, exp: 1 }),
      record({ key: '002', name: 'Sentinel Slime', level: 12, hp: 45, exp: 2 }),
      record({ key: '003', name: 'Red Snail', level: 25, hp: 68, exp: 8 }),
      record({ key: '004', name: 'Blue Snail', level: 40, hp: 100, exp: 20 }),
    ],
  }),
);

function mountBrowse({
  browseRows = rows,
  dropBrowseAvailable = false,
  dropItemOptions = [],
}: {
  readonly browseRows?: readonly MonsterBrowseRow[];
  readonly dropBrowseAvailable?: boolean;
  readonly dropItemOptions?: readonly MonsterDropItemOption[];
} = {}) {
  return render(
    <MantineProvider>
      <MonsterBrowse
        buildId={DEFAULT_BUILD_ID}
        rows={browseRows}
        dropBrowseAvailable={dropBrowseAvailable}
        dropItemOptions={dropItemOptions}
      />
    </MantineProvider>,
  );
}

const summaryText = () =>
  screen.getAllByText(/^\d+ Monsters?$/u)[0]?.textContent ?? '';

/** Cards are the presentation that renders real DOM in jsdom. */
function cards() {
  return screen.getByRole('list', {
    name: 'Classic World monsters cards',
  });
}

function column(accessor: string) {
  return monsterBrowseColumns.find((entry) => entry.accessor === accessor);
}

describe('MonsterBrowse', () => {
  it('keeps compact headers with full accessible names and stable sort intents', () => {
    expect(column('name')).toMatchObject({
      accessor: 'name',
      sortable: true,
      firstSortDirection: 'asc',
    });
    expect(column('physicalAttack')).toMatchObject({
      title: 'W. ATT',
      fullLabel: 'Weapon attack',
      numeric: true,
      sortable: true,
    });
    expect(column('physicalDefense')).toMatchObject({
      title: 'W. DEF',
      fullLabel: 'Weapon defense',
    });
    expect(column('magicAttack')).toMatchObject({
      title: 'M. ATT',
      fullLabel: 'Magic attack',
    });
    expect(column('magicDefense')).toMatchObject({
      title: 'M. DEF',
      fullLabel: 'Magic defense',
    });
    expect(column('accuracy')).toMatchObject({
      title: 'ACC',
      fullLabel: 'Accuracy',
    });
    expect(column('avoidability')).toMatchObject({
      title: 'AVOID',
      fullLabel: 'Avoidability',
    });
    // The WZ `pushed` fact keeps its canonical accessor and reads as a threshold.
    expect(column('pushed')).toMatchObject({
      title: 'KB',
      fullLabel: 'Knockback damage threshold',
    });
    expect(column('expPer100Hp')).toMatchObject({
      title: 'EXP / 100 HP',
      fullLabel: 'Experience per 100 HP',
      nowrap: true,
    });
    expect(column('level')?.firstSortDirection).toBe('asc');
    expect(column('hp')?.firstSortDirection).toBe('desc');
    expect(column('drops')).toBeUndefined();
  });

  it('uses the opt-in total summary rather than the shared page window', () => {
    mountBrowse();

    expect(summaryText()).toBe('4 Monsters');
    expect(screen.queryByText(/\d+–\d+ of/u)).not.toBeInTheDocument();
    // Interactive language keeps the family/version context; the heading above
    // already names the game, so controls do not repeat "MapleStory".
    expect(
      screen.getByRole('textbox', { name: 'Search Classic World monsters' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: 'Classic World monsters comparison' }),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('table', {
          name: 'Classic World monsters comparison',
        }),
      ).queryByRole('columnheader', { name: 'Drops' }),
    ).not.toBeInTheDocument();
    expect(
      within(cards()).getAllByText('Unavailable for this release'),
    ).not.toHaveLength(0);
  });

  it('shows historical drop evidence in the mobile relationship drawer', async () => {
    const user = userEvent.setup();
    const [first] = rows;
    if (first === undefined) throw new Error('Fixture produced no rows.');
    const historicalRow: MonsterBrowseRow = {
      ...first,
      drops: {
        native: { state: 'absent', coverageKey: 'fixture.no-native-source' },
        historical: {
          state: 'known',
          count: 1,
          sourceBuilds: ['gms-v83'],
        },
        itemKeys: [],
        entries: [
          {
            itemRefState: 'unresolved',
            itemName: 'Unknown item name',
            assertionKind: 'historical-overlay',
            sourceBuild: 'gms-v83',
            confidence: 'maybe',
          },
        ],
      },
    };
    mountBrowse({ browseRows: [historicalRow], dropBrowseAvailable: true });

    const card = within(cards()).getByRole('article');
    expect(card).toHaveTextContent('Native: No native source');
    expect(card).toHaveTextContent('Historical: 1 historical (GMS v83)');
    const expandButton = within(card).getByRole('button', {
      name: 'Sentinel Snail, 1 drop. Show drops.',
    });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(expandButton);
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');

    const drawer = await screen.findByRole('dialog', {
      name: /Sentinel Snail/u,
    });
    expect(drawer).toHaveTextContent('Drops (1)');
    expect(drawer).toHaveTextContent('Unresolved item reference');
    expect(drawer).toHaveTextContent('Unconfirmed');
    expect(drawer).not.toHaveTextContent('Historical · GMS v83 · maybe');

    await user.click(
      within(drawer).getByRole('button', {
        name: 'Close Drops for Sentinel Snail',
      }),
    );
    await waitFor(() =>
      expect(expandButton).toHaveAttribute('aria-expanded', 'false'),
    );
  });

  it('filters monsters by a stable dropped item key through the shared facet', async () => {
    const user = userEvent.setup();
    const browseRows = rows.map((row, index) => {
      const itemKey = index === 0 ? 'fixture:item:red' : 'fixture:item:blue';
      return {
        ...row,
        drops: {
          ...row.drops,
          native: { state: 'known' as const, count: 1, lowerBound: true },
          itemKeys: [itemKey],
        },
      };
    });
    mountBrowse({
      browseRows,
      dropBrowseAvailable: true,
      dropItemOptions: [
        { value: 'fixture:item:red', label: 'Red Potion' },
        { value: 'fixture:item:blue', label: 'Blue Potion' },
      ],
    });

    const input = screen.getByRole('combobox', { name: 'Drops item' });
    await user.click(input);
    await user.type(input, 'Red Potion');
    // The shared searchable control owns option rendering; the selected value
    // still commits through FacetedBrowser's canonical filter state.
    const option = [...document.querySelectorAll('[role="option"]')].find(
      (candidate) => candidate.textContent?.trim() === 'Red Potion',
    );
    expect(option).toBeDefined();
    fireEvent.click(option!);

    await waitFor(() => expect(summaryText()).toBe('1 Monster'));
    expect(
      within(cards()).getByRole('heading', { name: 'Sentinel Snail' }),
    ).toBeInTheDocument();
    expect(
      within(cards()).queryByText('Sentinel Slime'),
    ).not.toBeInTheDocument();
  });

  it('applies search, a rail preset and clear to the result set', async () => {
    const user = userEvent.setup();
    mountBrowse();

    await user.type(screen.getByRole('textbox', { name: /^Search/u }), 'slime');
    await waitFor(() => expect(summaryText()).toBe('1 Monster'));
    expect(
      within(cards()).getByRole('heading', { name: 'Sentinel Slime' }),
    ).toBeInTheDocument();
    // EXP comes from the EXP slot (4), not the distinct MP sentinel (999), and
    // the derived ratio is computed from the correct fields: 2 / 45 × 100.
    const slimeCard = within(cards())
      .getByRole('heading', { name: 'Sentinel Slime' })
      .closest('article')!;
    const facts = [...slimeCard.querySelectorAll('dd')].map((node) =>
      node.textContent?.trim(),
    );
    expect(facts).toContain('2');
    expect(facts).toContain('4.44');
    expect(facts).not.toContain(String(FIXTURE_MP));
    expect(
      within(cards()).queryByText('Sentinel Snail'),
    ).not.toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: /^Search/u }));
    await user.click(screen.getByRole('checkbox', { name: /^5 \(/u }));
    await waitFor(() => expect(summaryText()).toBe('1 Monster'));
    expect(
      within(cards()).getByRole('heading', { name: 'Sentinel Snail' }),
    ).toBeInTheDocument();
    expect(within(cards()).queryByText('Red Snail')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(summaryText()).toBe('4 Monsters'));
    expect(
      within(cards()).getByRole('heading', { name: 'Red Snail' }),
    ).toBeInTheDocument();
  });
});
