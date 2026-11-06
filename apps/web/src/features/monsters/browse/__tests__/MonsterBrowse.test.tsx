import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BUILD_ID } from '@/config/maplekit';

import { MonsterBrowse, monsterBrowseColumns } from '../MonsterBrowse';
import { projectMonsterBrowseRows } from '../project';

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

function record(
  key: string,
  name: string,
  level: number,
  hp: number,
  exp: number,
) {
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
  fixtureCatalog([
    record('001', 'Sentinel Snail', 5, 30, 1),
    record('002', 'Sentinel Slime', 12, 45, 2),
    record('003', 'Red Snail', 25, 68, 8),
    record('004', 'Blue Snail', 40, 100, 20),
  ]),
);

function mountBrowse() {
  return render(
    <MantineProvider>
      <MonsterBrowse buildId={DEFAULT_BUILD_ID} rows={rows} />
    </MantineProvider>,
  );
}

const summaryText = () =>
  screen.getAllByText(/^\d+ Monsters?$/u)[0]?.textContent ?? '';

/** Cards are the presentation that renders real DOM in jsdom. */
function cards() {
  return screen.getByRole('list', { name: /Monsters cards/u });
}

function column(accessor: string) {
  return monsterBrowseColumns.find((entry) => entry.accessor === accessor);
}

describe('MonsterBrowse', () => {
  it('keeps compact headers with full accessible names and stable sort intents', () => {
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
  });

  it('uses the opt-in total summary rather than the shared page window', () => {
    mountBrowse();

    expect(summaryText()).toBe('4 Monsters');
    expect(screen.queryByText(/\d+–\d+ of/u)).not.toBeInTheDocument();
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
    await user.click(screen.getByRole('checkbox', { name: /^5–15 \(/u }));
    await waitFor(() => expect(summaryText()).toBe('2 Monsters'));
    expect(within(cards()).queryByText('Red Snail')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(summaryText()).toBe('4 Monsters'));
    expect(
      within(cards()).getByRole('heading', { name: 'Red Snail' }),
    ).toBeInTheDocument();
  });
});
