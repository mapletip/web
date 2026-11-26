import { MantineProvider } from '@mantine/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DropChipGroups } from '../DropChipGroups';
import type { MonsterDetailDropsView } from '../project';

function renderDrops(drops: MonsterDetailDropsView) {
  return render(
    <MantineProvider>
      <DropChipGroups drops={drops} />
    </MantineProvider>,
  );
}

describe('DropChipGroups', () => {
  it('renders groups, sources, placeholders, and a source link', async () => {
    const user = userEvent.setup();
    const drops: MonsterDetailDropsView = {
      state: 'present',
      count: 2,
      groups: [
        {
          id: 'usable',
          label: 'Usable',
          count: 1,
          entries: [
            {
              name: 'Practice Tonic',
              sources: [
                {
                  label: "This version's game files",
                  buildLabel: 'Classic World',
                },
              ],
            },
          ],
        },
        {
          id: 'unknown',
          label: 'Unknown type',
          count: 1,
          entries: [
            {
              name: 'Item name unavailable',
              sources: [
                {
                  label: 'VOD',
                  buildLabel: 'GMS v83',
                  date: '2026-01-15',
                  href: 'https://example.test/watch?t=95s',
                  startSeconds: 95,
                },
                {
                  label: "This version's game files",
                  buildLabel: 'Classic World',
                  href: 'https://video.example/watch?v=fixture',
                },
              ],
            },
          ],
        },
      ],
    };
    const { container } = renderDrops(drops);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Usable (1)' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Unknown type (1)' }),
    ).toBeVisible();
    expect(
      container.querySelectorAll('img[data-fallback="true"]'),
    ).toHaveLength(2);
    const button = screen.getByRole('button', {
      name: 'Sources for Item name unavailable',
    });
    await user.click(button);
    const dialog = await screen.findByRole('dialog', {
      name: 'Sources for Item name unavailable',
    });
    expect(within(dialog).getByText('Sources')).toBeInTheDocument();
    expect(within(dialog).getByText('VOD')).toBeInTheDocument();
    expect(
      within(dialog).getByText('GMS v83 · Jan 15, 2026'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('link', { name: 'Open at 1:35', hidden: true }),
    ).toHaveAttribute('href', 'https://example.test/watch?t=95s');
    expect(
      within(dialog).getByRole('link', { name: 'Open at 1:35', hidden: true }),
    ).toHaveAttribute('target', '_blank');
    expect(
      within(dialog).getByRole('link', { name: 'Open link', hidden: true }),
    ).toHaveAttribute('href', 'https://video.example/watch?v=fixture');
    expect(
      within(dialog).getByRole('link', { name: 'Open link', hidden: true }),
    ).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows the no-recorded and unavailable messages', () => {
    const { rerender } = renderDrops({ state: 'no-recorded', count: 0 });
    expect(screen.getByText('No recorded drop information.')).toBeVisible();
    rerender(
      <MantineProvider>
        <DropChipGroups drops={{ state: 'unavailable', count: 'unknown' }} />
      </MantineProvider>,
    );
    expect(screen.getByText('Drop information is unavailable.')).toBeVisible();
  });
});
