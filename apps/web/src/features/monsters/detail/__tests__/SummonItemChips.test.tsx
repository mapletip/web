import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { MonsterDetailSummonedByView } from '../project';
import { SummonItemChips } from '../SummonItemChips';

function renderSummonedBy(summonedBy: MonsterDetailSummonedByView) {
  return render(
    <MantineProvider>
      <SummonItemChips summonedBy={summonedBy} />
    </MantineProvider>,
  );
}

describe('SummonItemChips', () => {
  it('shows item chips with their icon or neutral placeholder and plain names', () => {
    const summonedBy: MonsterDetailSummonedByView = {
      state: 'present',
      count: 2,
      entries: [
        {
          key: 'fixture:item:seed',
          name: 'Practice Seed',
          iconUrl: 'https://example.test/seed.png',
        },
        { key: 'fixture:item:unknown', name: 'Item name unavailable' },
      ],
    };

    const { container } = renderSummonedBy(summonedBy);

    expect(
      screen.getByRole('list', { name: 'Items that summon this monster' }),
    ).toBeVisible();
    expect(screen.getByText('Practice Seed')).toBeVisible();
    expect(screen.getByText('Item name unavailable')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Practice Seed' })).toBeNull();
    expect(
      container.querySelectorAll('img[data-fallback="true"]'),
    ).toHaveLength(1);
  });

  it('returns no section content for an empty collection', () => {
    const { container } = renderSummonedBy({ state: 'absent', count: 0 });
    expect(container.querySelector('ul')).toBeNull();
  });
});
