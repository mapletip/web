import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DropChipGroups } from '../DropChipGroups';
import type { MonsterDetailDropsView } from '../project';

function renderDrops(
  drops: MonsterDetailDropsView,
  buildId: 'cw-launch' | 'gms-v83' = 'cw-launch',
) {
  return render(
    <MantineProvider>
      <DropChipGroups drops={drops} buildId={buildId} />
    </MantineProvider>,
  );
}

describe('DropChipGroups', () => {
  it('renders groups, legend, plain names, placeholders and certainty details', async () => {
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
              assertionKind: 'native',
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
              assertionKind: 'historical-overlay',
              sourceBuild: 'gms-v83',
            },
          ],
        },
      ],
    };

    const { container } = renderDrops(drops);

    expect(
      screen.getByRole('group', { name: 'Drop certainty legend' }),
    ).toHaveTextContent('Confirmed');
    expect(
      screen.getByRole('group', { name: 'Drop certainty legend' }),
    ).toHaveTextContent('Unconfirmed');
    expect(
      screen.getByRole('heading', { level: 3, name: 'Usable (1)' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Unknown type (1)' }),
    ).toBeVisible();
    expect(screen.getByText('Practice Tonic')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Practice Tonic' })).toBeNull();
    expect(
      container.querySelectorAll('img[data-fallback="true"]'),
    ).toHaveLength(2);

    const unconfirmedButton = screen.getByRole('button', {
      name: 'Show unconfirmed drop details for Item name unavailable',
    });
    await user.hover(unconfirmedButton);
    await waitFor(() =>
      expect(unconfirmedButton).toHaveAttribute('aria-expanded', 'true'),
    );
    await waitFor(() =>
      expect(
        screen.getByText('Source: GMS v83 Monster Book.'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('Maybe')).toBeInTheDocument();
  });

  it('shows the no-recorded-drops message', () => {
    renderDrops({ state: 'no-recorded', count: 0 });

    expect(screen.getByText('No recorded drop information.')).toBeVisible();
    expect(
      screen.queryByRole('group', { name: 'Drop certainty legend' }),
    ).toBeNull();
  });

  it('shows unavailable wording for unresolved collection information', () => {
    renderDrops({ state: 'unavailable', count: 'unknown' });

    expect(screen.getByText('Drop information is unavailable.')).toBeVisible();
    expect(
      screen.queryByRole('group', { name: 'Drop certainty legend' }),
    ).toBeNull();
  });

  it('explains a confirmed GMS assertion with the current build source', async () => {
    const user = userEvent.setup();
    renderDrops(
      {
        state: 'present',
        count: 1,
        groups: [
          {
            id: 'etc',
            label: 'ETC',
            count: 1,
            entries: [{ name: 'Native Flake', assertionKind: 'native' }],
          },
        ],
      },
      'gms-v83',
    );

    const confirmedButton = screen.getByRole('button', {
      name: 'Show confirmed drop details for Native Flake',
    });
    await user.click(confirmedButton);
    expect(confirmedButton).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(
        screen.getByText('Source: GMS v83 Monster Book.'),
      ).toBeInTheDocument(),
    );
    const dialog = document.querySelector<HTMLElement>(
      '[role="dialog"][aria-label="Confirmed drop details for Native Flake"]',
    );
    expect(dialog).not.toBeNull();
    if (dialog === null) throw new Error('Expected certainty details.');
    expect(within(dialog).getByText('Confirmed')).toBeInTheDocument();
  });
});
