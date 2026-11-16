import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MonsterDetailQuests } from '../MonsterDetailQuests';
import type { MonsterDetailQuestsView } from '../project';

function renderQuests(quests: MonsterDetailQuestsView) {
  return render(
    <MantineProvider>
      <MonsterDetailQuests quests={quests} />
    </MantineProvider>,
  );
}

describe('MonsterDetailQuests', () => {
  it('renders quest cards with plain names, facts, repeatability and shared count', () => {
    const quests: MonsterDetailQuestsView = {
      state: 'present',
      count: 1,
      entries: [
        {
          key: 'fixture:quest:001',
          name: 'Practice Hunt',
          minimumLevelLabel: 'Minimum level: 10',
          jobRequirementLabel: 'Warrior',
          defeatLabel: 'Defeat ×30',
          repeatable: true,
          sharedCountNote: 'Count shared with 2 other monsters',
        },
      ],
    };

    renderQuests(quests);

    expect(
      screen.getByRole('heading', { name: 'Practice Hunt' }),
    ).toBeVisible();
    expect(
      screen.getByText('Minimum level: 10 · Job: Warrior · Defeat ×30'),
    ).toBeVisible();
    expect(screen.getByText('Repeatable')).toBeVisible();
    expect(
      screen.getByText('Count shared with 2 other monsters'),
    ).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Practice Hunt' })).toBeNull();
  });

  it('shows Defeat when its count is unknown and hides a non-known repeatable badge', () => {
    renderQuests({
      state: 'present',
      count: 1,
      entries: [
        {
          key: 'fixture:quest:002',
          name: 'Countless Hunt',
          minimumLevelLabel: 'Minimum level unavailable',
          jobRequirementLabel: 'Job requirement unavailable',
          defeatLabel: 'Defeat',
          repeatable: false,
        },
      ],
    });

    expect(screen.getByText(/Defeat$/u)).toBeVisible();
    expect(screen.queryByText('Repeatable')).toBeNull();
  });

  it('distinguishes no quests from unresolved quest information', () => {
    const { rerender } = renderQuests({ state: 'no-quests', count: 0 });
    expect(
      screen.getByText('No quests are listed for this monster.'),
    ).toBeVisible();
    expect(screen.queryByRole('list')).toBeNull();

    rerender(
      <MantineProvider>
        <MonsterDetailQuests
          quests={{ state: 'unavailable', count: 'unknown' }}
        />
      </MantineProvider>,
    );
    expect(screen.getByText('Quest information is unavailable.')).toBeVisible();
    expect(
      screen.queryByText('No quests are listed for this monster.'),
    ).toBeNull();
  });
});
