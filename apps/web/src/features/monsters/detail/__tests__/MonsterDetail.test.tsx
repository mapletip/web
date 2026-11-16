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
    expect(screen.getByText('No recorded drop information.')).toBeVisible();
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

  it('renders Locations before Drops with the map count from its view data', () => {
    renderDetail({
      locations: {
        summary: { state: 'known', mapCount: 1, placementCount: 1 },
        entries: [
          {
            mapKey: 'fixture:map:quiet-clearing',
            name: { state: 'known', value: 'Quiet Clearing' },
            streetName: 'Forest Edge',
            geography: {
              regionKey: 'fixture:practice-forest',
              regionLabel: 'Practice Forest',
              provenance: 'reviewed-overlay',
              status: 'verified',
            },
            placementCount: 1,
            minimap: { state: 'absent', coverageKey: 'fixture:minimap' },
          },
        ],
      },
    });

    const navigation = screen.getByRole('navigation', {
      name: 'Record sections',
    });
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Locations (1)', 'Drops (?)', 'Quests (?)']);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Locations (1)' }),
    ).toBeVisible();
    expect(screen.getByText('Quiet Clearing')).toBeVisible();
    expect(screen.getByText('Forest Edge')).toBeVisible();
    const spawnCount = screen.getByTestId('monster-location-spawn-count');
    expect(spawnCount).toBeVisible();
    expect(spawnCount).toHaveTextContent('1 spawn');
  });

  it('keeps Quests after Drops and omits an empty Summoned by section and link', () => {
    renderDetail({
      quests: {
        state: 'absent',
        entries: [],
      },
      summonedByItems: [],
    });

    const navigation = screen.getByRole('navigation', {
      name: 'Record sections',
    });
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Locations (0)', 'Drops (?)', 'Quests (0)']);
    expect(
      screen.getByText('No quests are listed for this monster.'),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 2, name: /Summoned by/u }),
    ).toBeNull();
    expect(
      within(navigation).queryByRole('link', { name: /Summoned by/u }),
    ).toBeNull();
  });

  it('adds a counted Summoned by section after Quests when items exist', () => {
    renderDetail({
      quests: {
        state: 'known',
        entries: [
          {
            questKey: 'fixture:quest:001',
            name: { state: 'known', value: 'Practice Hunt' },
            minLevel: { state: 'known', value: 10 },
            jobCodes: { state: 'absent', coverageKey: 'fixture:quest-jobs' },
            repeatable: { state: 'known', value: false },
            killCount: { state: 'known', value: 30 },
          },
        ],
      },
      summonedByItems: [
        {
          itemRef: { state: 'resolved', key: 'fixture:item:seed' },
          name: { state: 'known', value: 'Practice Seed' },
          icon: { state: 'unknown' },
        },
      ],
    });

    const navigation = screen.getByRole('navigation', {
      name: 'Record sections',
    });
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Locations (0)', 'Drops (?)', 'Quests (1)', 'Summoned by (1)']);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Quests (1)' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Summoned by (1)' }),
    ).toBeVisible();
    expect(screen.getByText('Practice Hunt')).toBeVisible();
    expect(screen.getByText('Practice Seed')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Practice Seed' })).toBeNull();
  });
});
