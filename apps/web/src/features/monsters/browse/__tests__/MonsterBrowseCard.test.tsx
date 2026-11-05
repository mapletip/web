import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MonsterBrowseCard } from '../MonsterBrowseCard';
import type { MonsterBrowseRow } from '../project';

/**
 * `MonsterBrowseCard` is private to the feature, so it is tested at its own
 * seam: the card owns the mobile fact list (which facts, in which order), the
 * semantic structure and the honest display of every non-`known` state. The
 * page-level SSR test only proves that a card is present in the document.
 */
function knownRow(): MonsterBrowseRow {
  return {
    key: 'fixture:monster:001',
    name: 'Sentinel Snail',
    level: 5,
    hp: 30,
    exp: 1,
    expPer100Hp: (1 / 30) * 100,
    boss: false,
    undead: true,
    bodyAttack: true,
    factStates: {},
  };
}

/** Every shown fact is non-`known`, and the four states are all distinct. */
function unknownRow(): MonsterBrowseRow {
  return {
    key: 'fixture:monster:002',
    name: 'Sentinel Unknown',
    factStates: {
      level: 'unknown',
      hp: 'unknown',
      exp: 'absent',
      expPer100Hp: 'unknown',
      boss: 'unknown',
      undead: 'absent',
      bodyAttack: 'unsupported',
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

describe('MonsterBrowseCard', () => {
  it('presents the training facts in their documented order', () => {
    render(<MonsterBrowseCard record={knownRow()} />);

    expect(factLabels()).toEqual([
      'Level',
      'HP',
      'EXP',
      'EXP / 100 HP',
      'Boss',
      'Undead',
      'Body attack',
    ]);
    expect(
      screen.getByRole('heading', { name: 'Sentinel Snail' }),
    ).toBeVisible();
    expect(screen.getByText('EXP / 100 HP', { exact: true })).toBeVisible();
  });

  it('shows formatted known values, including a genuine false', () => {
    render(<MonsterBrowseCard record={knownRow()} />);

    expect(factValues()).toEqual(['5', '30', '1', '3.33', 'No', 'Yes', 'Yes']);
    expect(factTitles()).toEqual([
      'Level: 5',
      'HP: 30',
      'EXP: 1',
      // One decimal-place decision for the derived ratio; `1/30 × 100`.
      'EXP / 100 HP: 3.33',
      'Boss: No',
      'Undead: Yes',
      'Body attack: Yes',
    ]);
  });

  it('keeps every non-known state distinct instead of inventing a value', () => {
    render(<MonsterBrowseCard record={unknownRow()} />);

    expect(factValues()).toEqual([
      'Unknown',
      'Unknown',
      'Not recorded',
      // A derived ratio has no source state, so it shows a dash.
      '-',
      'Unknown',
      'Not recorded',
      'Not supported',
    ]);
  });

  it('is a labelled list with no invented record links', () => {
    render(<MonsterBrowseCard record={knownRow()} />);

    const list = screen.getAllByRole('definition')[0]?.closest('dl');
    expect(list).toHaveAttribute('aria-label', 'Sentinel Snail facts');
    expect(document.querySelectorAll('a')).toHaveLength(0);
  });
});
