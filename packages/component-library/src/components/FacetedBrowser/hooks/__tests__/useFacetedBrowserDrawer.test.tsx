import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { isInvalidNumericRange } from '@/components/FacetedBrowser/hooks/filterTypes';
import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/useFacetedBrowser';
import { useFacetedBrowserDrawer } from '@/components/FacetedBrowser/hooks/useFacetedBrowserDrawer';

const committedState = {
  search: '',
  filters: {},
  page: 1,
  pageSize: 20,
  hiddenColumns: [],
} as const;

function DrawerHarness({
  commitFilters,
  initiallyOpened = true,
}: {
  readonly commitFilters: (filters: Record<string, FacetFilterValue>) => void;
  readonly initiallyOpened?: boolean;
}) {
  const [opened, setOpened] = useState(initiallyOpened);
  const drawer = useFacetedBrowserDrawer({
    opened,
    onOpenedChange: setOpened,
    committedState,
    statusActive: false,
    filterIsInvalid: (filters) => isInvalidNumericRange(filters['level']),
    evaluateDraft: () => ({
      matchingCount: 0,
      matchingRecords: [],
      getFacetValues: () => new Map<string, number>(),
    }),
    commitFilters,
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          drawer.setValue('group', ['Beta']);
          drawer.apply();
        }}
      >
        Set and apply
      </button>
      <button
        type="button"
        onClick={() => {
          drawer.close();
          drawer.apply();
        }}
      >
        Close and apply
      </button>
      <button
        type="button"
        onClick={() => {
          drawer.setValue('level', { min: 10, max: 0 });
          drawer.apply();
        }}
      >
        Invalid and apply
      </button>
      <button
        type="button"
        onClick={() => {
          drawer.close();
          drawer.setValue('group', ['Beta']);
          drawer.apply();
        }}
      >
        Close set and apply
      </button>
      <button
        type="button"
        onClick={() => {
          drawer.open(null);
          drawer.setValue('group', ['Beta']);
          drawer.apply();
        }}
      >
        Open set and apply
      </button>
    </div>
  );
}

describe('FacetedBrowser drawer actions', () => {
  it('applies the draft written earlier in the same event', async () => {
    const commitFilters = vi.fn();
    await render(<DrawerHarness commitFilters={commitFilters} />);

    await userEvent.click(page.getByRole('button', { name: 'Set and apply' }));
    expect(commitFilters).toHaveBeenCalledWith({ group: ['Beta'] });
  });

  it('does not apply after a close in the same event', async () => {
    const commitFilters = vi.fn();
    await render(<DrawerHarness commitFilters={commitFilters} />);

    await userEvent.click(
      page.getByRole('button', { name: 'Close and apply' }),
    );
    expect(commitFilters).not.toHaveBeenCalled();
  });

  it('does not resurrect a closed session when set and apply follow close', async () => {
    const commitFilters = vi.fn();
    await render(<DrawerHarness commitFilters={commitFilters} />);

    await userEvent.click(
      page.getByRole('button', { name: 'Close set and apply' }),
    );
    expect(commitFilters).not.toHaveBeenCalled();
  });

  it('applies a session opened earlier in the same event', async () => {
    const commitFilters = vi.fn();
    await render(
      <DrawerHarness commitFilters={commitFilters} initiallyOpened={false} />,
    );

    await userEvent.click(
      page.getByRole('button', { name: 'Open set and apply' }),
    );
    expect(commitFilters).toHaveBeenCalledWith({ group: ['Beta'] });
  });

  it('does not apply an invalid draft written in the same event', async () => {
    const commitFilters = vi.fn();
    await render(<DrawerHarness commitFilters={commitFilters} />);

    await userEvent.click(
      page.getByRole('button', { name: 'Invalid and apply' }),
    );
    expect(commitFilters).not.toHaveBeenCalled();
  });
});
