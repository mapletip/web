import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_BUILD_ID } from '@/config/maplekit';

import { MonsterBrowseCard } from '../MonsterBrowseCard';
import { MonsterDropListing } from '../MonsterDrops';
import type { MonsterBrowseRow } from '../project';

/**
 * `MonsterBrowseCard` is private to the feature, so it is tested at its own
 * seam: the card owns the mobile fact grid (which facts, in which order), the
 * semantic structure and the honest display of every non-`known` state. The
 * page-level SSR test only proves that a card is present in the document.
 */
function knownRow(): MonsterBrowseRow {
  return {
    key: 'fixture:monster:001',
    name: 'Sentinel Snail',
    sprite: 'c'.repeat(64),
    level: 5,
    hp: 30,
    mp: 10,
    hpRecovery: 4,
    mpRecovery: 3,
    exp: 1,
    expPer100Hp: (1 / 30) * 100,
    physicalAttack: 4,
    physicalDefense: 5,
    magicAttack: 6,
    magicDefense: 7,
    accuracy: 8,
    avoidability: 9,
    pushed: 11,
    speed: -65,
    factStates: {},
    drops: {
      entries: [],
      itemKeys: [],
    },
  };
}

/** Source-backed unknown values stay distinct from absent and derived values. */
function unknownRow(): MonsterBrowseRow {
  return {
    key: 'fixture:monster:002',
    name: 'Sentinel Unknown',
    factStates: {
      level: 'unknown',
      hp: 'unknown',
      exp: 'absent',
      mpRecovery: 'absent',
      expPer100Hp: 'unknown',
    },
    drops: {
      entries: [],
      itemKeys: [],
    },
  };
}

function factLabels(): readonly string[] {
  return screen
    .getAllByRole('term')
    .map((element) => element.textContent?.trim() ?? '');
}

function factValues(): readonly string[] {
  return screen
    .getAllByRole('definition')
    .map((element) => element.textContent?.trim() ?? '');
}

/** The card's tooltip mirrors the label and the displayed value. */
function factTitles(): readonly string[] {
  return screen
    .getAllByRole('definition')
    .map((element) => element.getAttribute('title') ?? '');
}

function renderCard(record: MonsterBrowseRow, onShowDrops?: () => void) {
  return render(
    <MantineProvider>
      <MonsterBrowseCard
        record={record}
        {...(onShowDrops === undefined ? {} : { onShowDrops })}
      />
    </MantineProvider>,
  );
}

describe('MonsterBrowseCard', () => {
  it('presents the training and combat facts', () => {
    const { container } = renderCard(knownRow());

    expect(factLabels()).toEqual([
      'HP',
      'EXP',
      'EXP / 100 HP',
      'W. ATT',
      'M. ATT',
      'ACC',
      'W. DEF',
      'M. DEF',
      'AVOID',
      'Knockback',
      'Speed',
      'HP Recovery',
    ]);
    expect(
      screen.getByRole('heading', { name: 'Sentinel Snail' }),
    ).toBeVisible();
    expect(screen.getByText('Lv. 5')).toBeVisible();
    expect(
      container.querySelector('svg[data-monster-fact-icon="level"]'),
    ).toBeNull();
    expect(
      container.querySelector('svg[data-monster-fact-icon="hp"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      `https://d0.mapletip.com/media/images/cc/${'c'.repeat(64)}.png`,
    );
    expect(screen.getByText('EXP / 100 HP', { exact: true })).toBeVisible();
  });

  it('shows formatted known values and the derived training ratio', () => {
    renderCard(knownRow());

    expect(factValues()).toEqual([
      '30',
      '1',
      '3.33',
      '4',
      '6',
      '8',
      '5',
      '7',
      '9',
      '11',
      '-65',
      '4',
    ]);
    expect(factTitles()).toEqual([
      // One decimal-place decision for the derived ratio; `1/30 × 100`.
      'HP: 30',
      'EXP: 1',
      'EXP / 100 HP: 3.33',
      'W. ATT: 4',
      'M. ATT: 6',
      'ACC: 8',
      'W. DEF: 5',
      'M. DEF: 7',
      'AVOID: 9',
      'Knockback: 11',
      'Speed: -65',
      'HP Recovery: 4',
    ]);
  });

  it('keeps every non-known state distinct instead of inventing a value', () => {
    renderCard(unknownRow());

    expect(
      document.querySelector('[data-fallback="true"]'),
    ).toBeInTheDocument();

    expect(factValues()).toEqual([
      'Unknown',
      '-',
      // A derived ratio has no source state, so it shows a dash.
      '-',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
    ]);
  });

  it('is a labelled list with no invented record links', () => {
    renderCard(knownRow());

    const list = screen.getAllByRole('definition')[0]?.closest('dl');
    expect(list).toHaveAttribute('aria-label', 'Training facts');
    expect(document.querySelectorAll('a')).toHaveLength(0);
  });

  it('exposes a details trigger that opens the shared drawer', async () => {
    const user = userEvent.setup();
    const onShowDrops = vi.fn();
    const row: MonsterBrowseRow = {
      ...knownRow(),
      drops: {
        itemKeys: [],
        entries: [
          {
            itemRefState: 'ambiguous',
            itemName: 'Unknown item name',
            assertionKind: 'historical-overlay',
            sourceBuild: 'gms-v83',
          },
        ],
      },
    };
    renderCard(row, onShowDrops);

    const trigger = screen.getByRole('button', {
      name: 'Sentinel Snail, 1 drop. Show drops.',
    });
    expect(trigger).toHaveTextContent('1');
    expect(trigger).toHaveAttribute('data-variant', 'default');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).not.toHaveAttribute('aria-expanded');
    expect(trigger).not.toHaveAttribute('aria-controls');

    await user.click(trigger);
    expect(onShowDrops).toHaveBeenCalledOnce();
    // The card owns no drawer; FacetedBrowser renders the one shared drawer.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders drawer-surface drops without the desktop panel chrome', async () => {
    const user = userEvent.setup();
    const row: MonsterBrowseRow = {
      ...knownRow(),
      drops: {
        itemKeys: [],
        entries: [
          {
            itemRefState: 'ambiguous',
            itemName: 'Unknown item name',
            assertionKind: 'historical-overlay',
            sourceBuild: 'gms-v83',
          },
        ],
      },
    };
    render(
      <MantineProvider>
        <MonsterDropListing
          record={row}
          buildId={DEFAULT_BUILD_ID}
          onClose={vi.fn()}
          surface="drawer"
        />
      </MantineProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Drops (1)' })).toBeVisible();
    expect(screen.getByText(/Unknown item name/u)).toBeVisible();
    expect(screen.getByText(/Ambiguous item reference/u)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /Close Drops/u }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Drop certainty legend' }),
    ).toHaveTextContent('Confirmed');
    expect(
      screen.getByRole('group', { name: 'Drop certainty legend' }),
    ).toHaveTextContent('Unconfirmed');
    const uncertaintyButton = screen.getByRole('button', {
      name: 'Show unconfirmed drop details for Unknown item name',
    });
    expect(uncertaintyButton).toHaveAttribute('data-confirmed', 'false');

    const search = screen.getByRole('textbox', {
      name: 'Search items',
    });
    await user.type(search, 'no match');
    expect(screen.getByText('No drop entries match “no match”.')).toBeVisible();
    await user.clear(search);
    expect(screen.getByText(/Unknown item name/u)).toBeVisible();
  });

  it('shows zero for an empty roster when count facts are unknown', async () => {
    const user = userEvent.setup();
    const onShowDrops = vi.fn();
    renderCard(unknownRow(), onShowDrops);

    const trigger = screen.getByRole('button', {
      name: 'Sentinel Unknown, 0. Show drops.',
    });
    expect(trigger).toHaveTextContent('0');
    await user.click(trigger);
    expect(onShowDrops).toHaveBeenCalledOnce();
  });

  it('closes a status popover before its containing desktop drops panel', async () => {
    const user = userEvent.setup();
    const row: MonsterBrowseRow = {
      ...knownRow(),
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
    const onClose = vi.fn();
    render(
      <MantineProvider>
        <MonsterDropListing
          record={row}
          buildId={DEFAULT_BUILD_ID}
          onClose={onClose}
        />
      </MantineProvider>,
    );

    const statusButton = screen.getByRole('button', {
      name: 'Show unconfirmed drop details for Green Headband',
    });
    await user.hover(statusButton);
    expect(statusButton).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(
        screen.getByText('Source: GMS v83 Monster Book.'),
      ).toBeInTheDocument(),
    );
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(statusButton).toHaveAttribute('aria-expanded', 'false'),
    );
    expect(onClose).not.toHaveBeenCalled();

    statusButton.focus();
    expect(
      document.querySelector('table[aria-label="Drop sources"]'),
    ).toBeNull();
    expect(statusButton).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('textbox', { name: 'Search items' }));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('uses the current build as the source for a confirmed drop', async () => {
    const user = userEvent.setup();
    const row: MonsterBrowseRow = {
      ...knownRow(),
      drops: {
        itemKeys: [],
        entries: [
          {
            itemRefState: 'resolved',
            itemName: 'Red Potion',
            assertionKind: 'native',
          },
        ],
      },
    };
    render(
      <MantineProvider>
        <MonsterDropListing record={row} buildId="gms-v83" onClose={vi.fn()} />
      </MantineProvider>,
    );

    const statusButton = screen.getByRole('button', {
      name: 'Show confirmed drop details for Red Potion',
    });
    await user.click(statusButton);
    expect(statusButton).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(
        screen.getByText('Source: GMS v83 Monster Book.'),
      ).toBeInTheDocument(),
    );
    expect(
      document.querySelector('table[aria-label="Drop sources"]'),
    ).toBeNull();
  });

  it('omits source attribution when a historical entry has no source build', async () => {
    const user = userEvent.setup();
    const row: MonsterBrowseRow = {
      ...knownRow(),
      drops: {
        itemKeys: [],
        entries: [
          {
            itemRefState: 'resolved',
            itemName: 'Unknown source drop',
            assertionKind: 'historical-overlay',
          },
        ],
      },
    };
    render(
      <MantineProvider>
        <MonsterDropListing
          record={row}
          buildId={DEFAULT_BUILD_ID}
          onClose={vi.fn()}
        />
      </MantineProvider>,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Show unconfirmed drop details for Unknown source drop',
      }),
    );
    await waitFor(() => expect(screen.getByText('Maybe')).toBeInTheDocument());
    expect(screen.queryByText(/^Source:/u)).not.toBeInTheDocument();
  });
});
