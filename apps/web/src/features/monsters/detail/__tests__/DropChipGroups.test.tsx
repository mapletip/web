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
              confirmed: true,

              sources: [
                {
                  label: 'Classic World Monster Book',
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
              confirmed: true,

              sources: [
                {
                  label: 'VOD',
                  href: 'https://example.test/watch?t=95s',
                },
                {
                  label: 'Classic World Monster Book',
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
      name: 'Show confirmed drop details for Item name unavailable',
    });
    await user.hover(button);
    const dialog = (await screen.findByText('VOD')).closest('[role="dialog"]');
    expect(dialog).not.toBeNull();
    if (!(dialog instanceof HTMLElement))
      throw new Error('Expected drop dialog.');
    const vodLink = within(dialog).getByRole('link', {
      name: 'VOD',
      hidden: true,
    });
    expect(vodLink.closest('p')).toHaveTextContent(
      'Sources: VOD, Classic World Monster Book.',
    );
    expect(vodLink).toHaveAttribute('href', 'https://example.test/watch?t=95s');
    expect(vodLink).toHaveAttribute('target', '_blank');
    expect(
      within(dialog).getByRole('link', {
        name: 'Classic World Monster Book',
        hidden: true,
      }),
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
