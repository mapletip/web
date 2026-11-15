import { MantineProvider } from '@mantine/core';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { routeTree } from '@/routeTree.gen';

import { MonsterDetail } from '../MonsterDetail';
import { projectMonsterDetail } from '../project';

import { monsterPageFixture } from './monsterPageFixture';

function renderDetail(
  overrides: Parameters<typeof monsterPageFixture>[0] = {},
) {
  const view = projectMonsterDetail(monsterPageFixture(overrides), 'cw-launch');
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ['/maplestory/monsters/fixture-monster-36z2h01p'],
    }),
  });
  return render(
    <RouterContextProvider router={router}>
      <MantineProvider>
        <MonsterDetail view={view} />
      </MantineProvider>
    </RouterContextProvider>,
  );
}

describe('MonsterDetail hero', () => {
  it('shows only known true traits and known elemental responses', () => {
    renderDetail({
      boss: { state: 'known', value: true },
      undead: { state: 'known', value: true },
      elements: {
        state: 'known',
        items: [
          {
            code: 'S',
            effect: 2,
            meaning: { state: 'known', value: 'Poison' },
            multiplier: { state: 'known', value: 0 },
            resistance: { state: 'known', value: 'Immune' },
          },
          {
            code: 'H',
            effect: 1,
            meaning: { state: 'known', value: 'Holy' },
            multiplier: { state: 'known', value: 1.5 },
            resistance: { state: 'known', value: 'Weak' },
          },
        ],
      },
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sentinel Snail' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Boss')).toBeInTheDocument();
    expect(screen.getByText('Undead')).toBeInTheDocument();
    expect(screen.getByText('Immune: Poison')).toBeInTheDocument();
    expect(screen.getByText('Weak: Holy')).toBeInTheDocument();
  });

  it('does not render badges for false or non-known traits and responses', () => {
    renderDetail({
      boss: { state: 'known', value: false },
      undead: { state: 'unknown' },
      elements: { state: 'unknown' },
    });

    expect(screen.queryByText('Boss')).not.toBeInTheDocument();
    expect(screen.queryByText('Undead')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Weak:|Resistant:|Immune:/u),
    ).not.toBeInTheDocument();
  });

  it('renders the twelve hero stats in the specified order', () => {
    renderDetail();

    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(
      [
        'Level',
        'HP',
        'MP',
        'EXP',
        'Weapon attack',
        'Magic attack',
        'Weapon defense',
        'Magic defense',
        'Accuracy',
        'Avoidability',
        'Knockback',
        'Speed',
      ],
    );
  });

  it('derives the Drops navigation and heading count from the projected entries', () => {
    renderDetail({
      drops: {
        entries: [
          {
            itemRef: { state: 'resolved', key: 'fixture:item:tonic' },
            name: { state: 'known', value: 'Practice Tonic' },
            category: { kind: 'item-class', value: 'consume' },
            icon: { state: 'unknown' },
            assertion: { kind: 'native' },
          },
        ],
        summary: { native: { state: 'known', count: 1, lowerBound: true } },
      },
    });

    const navigation = screen.getByRole('navigation', {
      name: 'Record sections',
    });
    expect(
      within(navigation).getByRole('link', { name: 'Drops (1)' }),
    ).toHaveAttribute('href', '#drops');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Drops (1)' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Usable (1)' }),
    ).toBeVisible();
    expect(screen.getByText('Practice Tonic')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Practice Tonic' })).toBeNull();
  });

  it('shows zero counts when no drop information is recorded', () => {
    renderDetail({
      drops: {
        entries: [],
        summary: {
          native: { state: 'absent' },
          historical: { state: 'absent' },
        },
      },
    });

    const navigation = screen.getByRole('navigation', {
      name: 'Record sections',
    });
    expect(
      within(navigation).getByRole('link', { name: 'Drops (0)' }),
    ).toHaveAttribute('href', '#drops');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Drops (0)' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'No recorded drop information. This does not establish that the Monster drops nothing.',
      ),
    ).toBeVisible();
  });

  it('shows unknown counts when drop information is unavailable', () => {
    renderDetail({
      drops: {
        entries: [],
        summary: { native: { state: 'unsupported' } },
      },
    });

    const navigation = screen.getByRole('navigation', {
      name: 'Record sections',
    });
    expect(
      within(navigation).getByRole('link', { name: 'Drops (?)' }),
    ).toHaveAttribute('href', '#drops');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Drops (?)' }),
    ).toBeVisible();
    expect(screen.getByText('Drop information is unavailable.')).toBeVisible();
  });
});
