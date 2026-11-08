import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { isInvalidNumericRange } from '@/components/FacetedBrowser/hooks/filterTypes';
import {
  useFacetedBrowserDrawer,
  type DraftCommit,
} from '@/components/FacetedBrowser/hooks/useFacetedBrowserDrawer';

const committedState = {
  search: '',
  filters: {},
  page: 1,
  pageSize: 20,
  hiddenColumns: [],
} as const;

function DrawerHarness({
  commitDraft = () => undefined,
  initiallyOpened = true,
}: {
  readonly commitDraft?: (draft: DraftCommit) => void;
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
    commitDraft,
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
      <button
        type="button"
        onClick={() => {
          drawer.setSort({ field: 'value1', direction: 'desc' });
          drawer.apply();
        }}
      >
        Set sort and apply
      </button>
      <button
        type="button"
        onClick={() => {
          drawer.setSort({ field: 'value1', direction: 'desc' });
          drawer.close();
        }}
      >
        Set sort and close
      </button>
    </div>
  );
}

describe('FacetedBrowser drawer actions', () => {
  it('applies the draft written earlier in the same event', async () => {
    const commitDraft = vi.fn();
    render(<DrawerHarness commitDraft={commitDraft} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Set and apply' }),
    );
    expect(commitDraft).toHaveBeenCalledWith({
      filters: { group: ['Beta'] },
      sort: undefined,
    });
  });

  it('does not apply after a close in the same event', async () => {
    const commitDraft = vi.fn();
    render(<DrawerHarness commitDraft={commitDraft} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Close and apply' }),
    );
    expect(commitDraft).not.toHaveBeenCalled();
  });

  it('does not resurrect a closed session when set and apply follow close', async () => {
    const commitDraft = vi.fn();
    render(<DrawerHarness commitDraft={commitDraft} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Close set and apply' }),
    );
    expect(commitDraft).not.toHaveBeenCalled();
  });

  it('applies a session opened earlier in the same event', async () => {
    const commitDraft = vi.fn();
    render(<DrawerHarness commitDraft={commitDraft} initiallyOpened={false} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Open set and apply' }),
    );
    expect(commitDraft).toHaveBeenCalledWith({
      filters: { group: ['Beta'] },
      sort: undefined,
    });
  });

  it('does not apply an invalid draft written in the same event', async () => {
    const commitDraft = vi.fn();
    render(<DrawerHarness commitDraft={commitDraft} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Invalid and apply' }),
    );
    expect(commitDraft).not.toHaveBeenCalled();
  });

  it('stages draft sort and passes it to commitDraft on apply', async () => {
    const commitDraft = vi.fn();
    render(<DrawerHarness commitDraft={commitDraft} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Set sort and apply' }),
    );
    expect(commitDraft).toHaveBeenCalledWith({
      filters: {},
      sort: { field: 'value1', direction: 'desc' },
    });
  });

  it('discards draft sort when drawer is closed without applying', async () => {
    const commitDraft = vi.fn();
    render(<DrawerHarness commitDraft={commitDraft} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Set sort and close' }),
    );
    expect(commitDraft).not.toHaveBeenCalled();
  });
});
