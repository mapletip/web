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

import {
  getMonsterBrowseFacetDefinition,
  MONSTER_BROWSE_FACT_CONFIG,
} from '../monster-browse-fact-config';
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
  emptyDropBrowseFixture,
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
  emptyDropBrowseFixture(),
);

function mountBrowse({
  browseRows = rows,
  dropItemOptions = [],
}: {
  readonly browseRows?: readonly MonsterBrowseRow[];
  readonly dropItemOptions?: readonly MonsterDropItemOption[];
} = {}) {
  return render(
    <MantineProvider>
      <MonsterBrowse
        buildId={DEFAULT_BUILD_ID}
        rows={browseRows}
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
  it('builds ordered facet metadata from the shared Monster fact config', () => {
    const facets = Object.values(MONSTER_BROWSE_FACT_CONFIG).flatMap((fact) => {
      const definition = getMonsterBrowseFacetDefinition(fact);
      return definition === undefined ? [] : [definition];
    });

    expect(facets.map(({ id }) => id)).toEqual([
      'level',
      'hp',
      'exp',
      'expPer100Hp',
      'drops-item',
      'boss',
      'undead',
    ]);
    expect(facets.find(({ id }) => id === 'level')?.icon).toEqual(
      expect.objectContaining({
        type: MONSTER_BROWSE_FACT_CONFIG.level.icon,
      }),
    );
    expect(MONSTER_BROWSE_FACT_CONFIG.level.showIconInCard).toBe(false);
    const hpIcon = facets.find(({ id }) => id === 'hp')?.icon;
    expect(hpIcon).toHaveProperty('type', MONSTER_BROWSE_FACT_CONFIG.hp.icon);
    expect(hpIcon).toHaveProperty('props.size', 16);
    expect(hpIcon).toHaveProperty('props.color', '#f28f91');
  });

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
    expect(column('hpRecovery')).toMatchObject({
      title: 'HP REC',
      fullLabel: 'HP recovery value',
    });
    expect(column('mpRecovery')).toMatchObject({
      title: 'MP REC',
      fullLabel: 'MP recovery value',
    });
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
      within(cards()).getAllByRole('button', {
        name: /, 0\. Show drops\./u,
      }),
    ).toHaveLength(4);
  });

  it('shows every effective rail facet in order in the mobile quick filters', () => {
    mountBrowse();

    const quickFilterRegion = screen.getByRole('region', {
      name: 'Quick filters',
    });
    const quickFilters = within(quickFilterRegion);
    expect(
      quickFilters
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-label')?.includes('Open'))
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual([
      'Filters, 0 active. Open all filters',
      'Level. Open Level filters',
      'HP. Open HP filters',
      'EXP. Open EXP filters',
      'EXP / 100 HP. Open EXP / 100 HP filters',
    ]);
    expect(
      Array.from(
        quickFilterRegion.querySelectorAll('svg[data-monster-fact-icon]'),
      ).map((icon) => icon.getAttribute('data-monster-fact-icon')),
    ).toEqual(['level', 'hp', 'exp', 'expPer100Hp']);
  });

  it('shows historical drop entries in the mobile relationship drawer', async () => {
    const user = userEvent.setup();
    const [first] = rows;
    if (first === undefined) throw new Error('Fixture produced no rows.');
    const historicalRow: MonsterBrowseRow = {
      ...first,
      drops: {
        itemKeys: [],
        entries: [
          {
            itemRefState: 'unresolved',
            itemName: 'Unknown item name',
            assertionKind: 'historical-overlay',
            sourceBuild: 'gms-v83',
          },
        ],
      },
    };
    mountBrowse({ browseRows: [historicalRow] });

    const card = within(cards()).getByRole('article');
    expect(card).not.toHaveTextContent('Native:');
    expect(card).not.toHaveTextContent('Historical:');
    const expandButton = within(card).getByRole('button', {
      name: 'Sentinel Snail, 1 drop. Show drops.',
    });
    expect(expandButton).toHaveAttribute('aria-haspopup', 'dialog');
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(expandButton).not.toHaveAttribute('aria-controls');
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
        name: 'Close details for Sentinel Snail',
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(expandButton).toHaveFocus());
  });

  it('lets Escape close a status popover before the shared mobile drawer', async () => {
    const user = userEvent.setup();
    const [first] = rows;
    if (first === undefined) throw new Error('Fixture produced no rows.');
    const row: MonsterBrowseRow = {
      ...first,
      drops: {
        itemKeys: [],
        entries: [
          {
            itemRefState: 'resolved',
            itemName: 'Green Headband',
            assertionKind: 'historical-overlay',
            sourceBuild: 'gms-v83',
          },
        ],
      },
    };
    mountBrowse({ browseRows: [row] });

    const trigger = within(cards()).getByRole('button', {
      name: 'Sentinel Snail, 1 drop. Show drops.',
    });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const drawer = await screen.findByRole('dialog', {
      name: /Sentinel Snail/u,
    });

    const statusButton = within(drawer).getByRole('button', {
      name: 'Show unconfirmed drop details for Green Headband',
    });
    await user.click(statusButton);
    expect(statusButton).toHaveAttribute('aria-expanded', 'true');
    expect(statusButton).toHaveAttribute(
      'data-mantine-stop-propagation',
      'true',
    );

    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(statusButton).toHaveAttribute('aria-expanded', 'false'),
    );
    expect(drawer).toBeVisible();
    expect(statusButton).not.toHaveAttribute('data-mantine-stop-propagation');

    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters monsters by a stable dropped item key through the shared facet', async () => {
    const user = userEvent.setup();
    const redPotionIcon = 'https://d0.mapletip.com/item-icons/red-potion.png';
    const browseRows = rows.map((row, index) => {
      const itemKey = index === 0 ? 'fixture:item:red' : 'fixture:item:blue';
      return {
        ...row,
        drops: {
          ...row.drops,
          itemKeys: [itemKey],
        },
      };
    });
    mountBrowse({
      browseRows,
      dropItemOptions: [
        {
          value: 'fixture:item:red',
          label: 'Red Potion',
          iconUrl: redPotionIcon,
        },
        { value: 'fixture:item:blue', label: 'Blue Potion' },
      ],
    });

    const dropItemChip = within(
      screen.getByRole('region', { name: 'Quick filters' }),
    ).getByRole('button', {
      name: 'Drops. Open Drops filters',
    });
    expect(
      dropItemChip.querySelector('svg[data-monster-fact-icon="drops-item"]'),
    ).not.toBeNull();

    const input = screen.getByRole('combobox', { name: 'Drops' });
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
    const activeDropChip = screen.getByRole('button', {
      name: 'Remove Drops: Red Potion',
    });
    expect(
      activeDropChip.querySelector(`img[src="${redPotionIcon}"]`),
    ).toBeInTheDocument();
    expect(
      document.querySelector(
        `[class*="dropItemPillContent"] img[src="${redPotionIcon}"]`,
      ),
    ).toBeInTheDocument();
    expect(
      within(cards()).getByRole('heading', { name: 'Sentinel Snail' }),
    ).toBeInTheDocument();
    expect(
      within(cards()).queryByText('Sentinel Slime'),
    ).not.toBeInTheDocument();
  });

  it('closes and discards the filter drawer when browser Back is pressed', async () => {
    const user = userEvent.setup();
    mountBrowse();

    await user.click(
      screen.getByRole('button', {
        name: 'Filters, 0 active. Open all filters',
      }),
    );
    const drawer = await screen.findByRole('dialog', { name: 'Filters' });
    await waitFor(() => expect(drawer).toBeVisible());
    expect(
      within(drawer).getByRole('button', { name: 'Apply' }),
    ).toBeInTheDocument();

    fireEvent.popState(window);

    await waitFor(() => expect(drawer).not.toBeVisible());
    expect(summaryText()).toBe('4 Monsters');
  });

  it('applies search, a rail preset and clear to the result set', async () => {
    const user = userEvent.setup();
    mountBrowse();

    await user.type(screen.getByRole('textbox', { name: /^Search/u }), 'slime');
    await waitFor(() => expect(summaryText()).toBe('1 Monster'));
    expect(
      within(cards()).getByRole('heading', { name: 'Sentinel Slime' }),
    ).toBeInTheDocument();
    // EXP comes from the EXP slot (4); base MP remains desktop-only. Recovery
    // values are absent from this legacy fixture. The ratio is 2 / 45 × 100.
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
