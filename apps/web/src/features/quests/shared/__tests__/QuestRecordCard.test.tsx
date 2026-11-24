import { MantineProvider } from '@mantine/core';
import { mapNpcSpriteUrl } from '@mapletip/data/maps';
import type { MonsterPageRecordV1_2 } from '@mapletip/data/monsters';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import {
  QuestMonsterRequirementSlot,
  QuestRecordCard,
} from '../QuestRecordCard';
import { projectQuestRecordCard } from '../questRecordCardProjection';

type MonsterPageQuestV12 = MonsterPageRecordV1_2['quests']['entries'][number];

function pageQuestV12(
  overrides: Partial<MonsterPageQuestV12> = {},
): MonsterPageQuestV12 {
  return {
    questKey: 'fixture:quest:001',
    name: { state: 'known', value: 'Practice Hunt' },
    minLevel: { state: 'known', value: 10 },
    jobCodes: { state: 'known', items: [100] },
    repeatable: { state: 'known', value: false },
    killCount: { state: 'known', value: 30 },
    event: { state: 'unknown' },
    startNpc: { state: 'unknown' },
    ...overrides,
  };
}

describe('QuestRecordCard', () => {
  it('shows available Quest facts and the host relationship slot without a link', () => {
    const { container } = render(
      <MantineProvider>
        <QuestRecordCard
          quest={{
            name: 'Mai’s Training',
            minimumLevelLabel: 'Lv. 2+',
            jobSummary: 'Beginner',
            repeatable: true,
            event: true,
            startNpc: {
              name: 'Brannock',
              spriteUrl: mapNpcSpriteUrl(
                MAPLEKIT_RELEASE.baseUrl,
                'd'.repeat(64),
              ),
            },
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
    expect(screen.getByText('Repeatable')).toBeVisible();
    expect(screen.getByText('Event')).toBeVisible();
    expect(screen.getByText('Start: Brannock · Beginner')).toBeVisible();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      mapNpcSpriteUrl(MAPLEKIT_RELEASE.baseUrl, 'd'.repeat(64)),
    );
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

  it('projects start NPC and Event only from known facts', () => {
    const spriteId = 'e'.repeat(64);
    const known = projectQuestRecordCard(
      pageQuestV12({
        startNpc: {
          state: 'known',
          value: {
            name: { state: 'known', value: 'Brannock' },
            sprite: { state: 'known', value: spriteId },
          },
        },
        event: { state: 'known', value: true },
      }),
    );
    const absentAndFalse = projectQuestRecordCard(
      pageQuestV12({
        startNpc: { state: 'absent', coverageKey: 'quest:start-npc' },
        event: { state: 'known', value: false },
      }),
    );
    const unknown = projectQuestRecordCard(
      pageQuestV12({
        startNpc: { state: 'unknown' },
        event: { state: 'unknown' },
      }),
    );

    expect(known.startNpc).toEqual({
      name: 'Brannock',
      spriteUrl: mapNpcSpriteUrl(MAPLEKIT_RELEASE.baseUrl, spriteId),
    });
    expect(known.event).toBe(true);
    expect(absentAndFalse).not.toHaveProperty('startNpc');
    expect(absentAndFalse).not.toHaveProperty('event');
    expect(unknown).not.toHaveProperty('startNpc');
    expect(unknown).not.toHaveProperty('event');
  });
});
