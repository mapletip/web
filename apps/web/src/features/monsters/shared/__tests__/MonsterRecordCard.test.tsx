import { MantineProvider } from '@mantine/core';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { routeTree } from '@/routeTree.gen';

import { MonsterRecordCard } from '../MonsterRecordCard';
import type { MonsterRecordCardView } from '../monsterRecordCardProjection';

const baseMonster: MonsterRecordCardView = {
  key: 'monster:blue-snail',
  name: 'Blue Snail',
  level: 2,
  levelLabel: 'Lv 2',
  spriteUrl: '/blue-snail.png',
  bossLabel: 'Boss',
};

function mount(monster: MonsterRecordCardView) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/maplestory/maps'] }),
  });
  return render(
    <RouterContextProvider router={router}>
      <MantineProvider>
        <MonsterRecordCard monster={monster}>
          <span>8 spawns</span>
        </MonsterRecordCard>
      </MantineProvider>
    </RouterContextProvider>,
  );
}

describe('MonsterRecordCard', () => {
  it('renders sprite identity, known facts and the host relationship slot', () => {
    mount(baseMonster);

    const card = screen
      .getByText('8 spawns')
      .closest<HTMLElement>('[data-record-card="true"]');
    if (card === null) throw new Error('Expected the Monster card.');
    expect(
      within(card).getByRole('heading', { name: 'Blue Snail' }),
    ).toBeVisible();
    expect(within(card).getByText('Lv 2')).toBeVisible();
    expect(within(card).getByText('Boss')).toBeVisible();
    expect(within(card).getByText('8 spawns')).toBeVisible();
    expect(card.querySelector('img')).toHaveAttribute('src', '/blue-snail.png');
  });

  it('uses the unnamed fallback and omits unknown level and boss facts', () => {
    const { container } = mount({
      key: 'monster:unknown',
      name: 'Monster name unavailable',
    });

    expect(
      screen.getByRole('heading', { name: 'Monster name unavailable' }),
    ).toBeVisible();
    expect(screen.queryByText(/^Lv /u)).toBeNull();
    expect(screen.queryByText('Boss')).toBeNull();
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('links only when the projected record has an address', () => {
    mount({
      ...baseMonster,
      destination: {
        to: '/maplestory/{-$buildId}/monsters/$slugId',
        params: { buildId: undefined, slugId: 'blue-snail-123' },
        href: '/maplestory/monsters/blue-snail-123',
      },
    });

    expect(screen.getByRole('link', { name: /Blue Snail/u })).toHaveAttribute(
      'href',
      '/maplestory/monsters/blue-snail-123',
    );
  });
});
