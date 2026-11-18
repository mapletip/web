import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  QuestMonsterRequirementSlot,
  QuestRecordCard,
} from '../QuestRecordCard';

describe('QuestRecordCard', () => {
  it('shows available Quest facts and the host relationship slot without a link', () => {
    render(
      <MantineProvider>
        <QuestRecordCard
          quest={{
            name: 'Mai’s Training',
            minimumLevelLabel: 'Lv. 2+',
            jobSummary: 'Beginner',
            repeatable: true,
          }}
        >
          <QuestMonsterRequirementSlot
            defeatLabel="Defeat ×5"
            sharedCountNote="Shared with 1 other monster"
          />
        </QuestRecordCard>
      </MantineProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Mai’s Training' }),
    ).toBeVisible();
    expect(screen.getByText('Lv. 2+')).toBeVisible();
    expect(screen.getByText('Beginner')).toBeVisible();
    expect(screen.getByText('Repeatable')).toBeVisible();
    expect(screen.getByText('Defeat ×5')).toBeVisible();
    expect(screen.getByText('Shared with 1 other monster')).toBeVisible();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('omits unknown level and non-repeatable facts', () => {
    render(
      <MantineProvider>
        <QuestRecordCard
          quest={{ name: 'Quest name unavailable', repeatable: false }}
        />
      </MantineProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Quest name unavailable' }),
    ).toBeVisible();
    expect(screen.queryByText(/^Lv\./u)).toBeNull();
    expect(screen.queryByText('Repeatable')).toBeNull();
  });
});
