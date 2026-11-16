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
  it('renders a concise quest card with plain names, compact roles and shared count', () => {
    const quests: MonsterDetailQuestsView = {
      state: 'present',
      count: 1,
      entries: [
        {
          key: 'fixture:quest:001',
          name: 'Practice Hunt',
          minimumLevelBadge: 'Lv. 10+',
          jobSummary: 'Warrior',
          defeatLabel: 'Defeat ×30',
          repeatable: true,
          sharedCountNote: 'Shared with 2 other monsters',
        },
      ],
    };

    renderQuests(quests);

    expect(
      screen.getByRole('heading', { name: 'Practice Hunt' }),
    ).toBeVisible();
    expect(screen.getByText('Lv. 10+')).toBeVisible();
    expect(screen.getByText('Warrior')).toBeVisible();
    expect(screen.getByText('Defeat ×30')).toBeVisible();
    expect(screen.getByText('Repeatable')).toBeVisible();
    expect(screen.getByText('Shared with 2 other monsters')).toBeVisible();
    expect(
      screen.queryByText(/^(Minimum level|Job:|Count shared)/u),
    ).toBeNull();
    expect(screen.queryByRole('link', { name: 'Practice Hunt' })).toBeNull();
  });

  it('keeps unknown optional metadata quiet and shows Defeat without a known count', () => {
    renderQuests({
      state: 'present',
      count: 1,
      entries: [
        {
          key: 'fixture:quest:002',
          name: 'Countless Hunt',
          defeatLabel: 'Defeat',
          repeatable: false,
        },
      ],
    });

    expect(screen.getByText('Defeat')).toBeVisible();
    expect(screen.queryByText(/unavailable/u)).toBeNull();
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
