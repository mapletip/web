import { MantineProvider } from '@mantine/core';
import { mapNpcSpriteUrl } from '@mapletip/data/maps';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';
import { mapPageRecordFixture } from '@/features/maps/detail/__tests__/mapPageFixture';

import { NpcRecordCard } from '../NpcRecordCard';
import { projectNpcRecordCard } from '../npcRecordCardProjection';

describe('NpcRecordCard', () => {
  it('projects known NPC sprite IDs with the SDK resolver', () => {
    const source = mapPageRecordFixture({ mapId: 'lantern-square' });
    const npc = source.npcs.items[0];
    if (npc === undefined) throw new Error('Expected a fixture NPC.');
    const contentId = 'c'.repeat(64);

    const projection = projectNpcRecordCard({
      ...npc,
      sprite: { state: 'known', value: contentId },
    });
    const expectedUrl = mapNpcSpriteUrl(MAPLEKIT_RELEASE.baseUrl, contentId);
    expect(projection.spriteUrl).toBe(expectedUrl);

    const { container } = render(
      <MantineProvider>
        <NpcRecordCard npc={projection} />
      </MantineProvider>,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', expectedUrl);
    expect(container.querySelector('img[data-fallback="true"]')).toBeNull();
  });

  it('keeps unknown NPC sprites unset', () => {
    const npc = mapPageRecordFixture({
      mapId: 'lantern-square',
    }).npcs.items.find(({ sprite }) => sprite.state !== 'known');
    if (npc === undefined) throw new Error('Expected an NPC without a sprite.');

    expect(projectNpcRecordCard(npc)).not.toHaveProperty('spriteUrl');
  });

  it('projects known, partial and unknown quest counts with production wording', () => {
    const npc = mapPageRecordFixture({ mapId: 'lantern-square' }).npcs.items[0];
    if (npc === undefined) throw new Error('Expected a fixture NPC.');

    expect(
      projectNpcRecordCard({
        ...npc,
        questCount: { state: 'known', count: 1 },
      }).questCountLabel,
    ).toBe('1 quest');
    expect(
      projectNpcRecordCard({
        ...npc,
        questCount: { state: 'partial', count: 1 },
      }).questCountLabel,
    ).toBe('1+ quests');
    expect(
      projectNpcRecordCard({
        ...npc,
        questCount: { state: 'known', count: 3 },
      }).questCountLabel,
    ).toBe('3 quests');
    expect(
      projectNpcRecordCard({
        ...npc,
        questCount: { state: 'unknown' },
      }),
    ).not.toHaveProperty('questCountLabel');
  });

  it('renders the projected quest count beneath the NPC name', () => {
    render(
      <MantineProvider>
        <NpcRecordCard
          npc={{ name: 'Bellkeeper', questCountLabel: '1 quest' }}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Bellkeeper' })).toBeVisible();
    expect(screen.getByText('1 quest')).toBeVisible();
  });

  it('uses the missing-image placeholder and keeps NPC identity unlinked', () => {
    const { container } = render(
      <MantineProvider>
        <NpcRecordCard npc={{ name: 'Bellkeeper' }} />
      </MantineProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Bellkeeper' })).toBeVisible();
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('img[data-fallback="true"]')).not.toBeNull();
  });
});
