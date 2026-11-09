import { MantineProvider, Checkbox } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import '@/styles.css';
import {
  FilterDrawer,
  type FilterDrawerProps,
} from '@/components/FacetedBrowser/FilterDrawer/FilterDrawer';

beforeEach(() => {
  document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
});

async function mount(extra: Partial<FilterDrawerProps> = {}) {
  const handlers = {
    onApply: vi.fn(),
    onCancel: vi.fn(),
  };
  render(
    <MantineProvider>
      <FilterDrawer
        opened
        title="Filters"
        applyLabel="Show results"
        {...handlers}
        {...extra}
      >
        <input aria-label="Name" />
      </FilterDrawer>
    </MantineProvider>,
  );
  await vi.waitFor(() =>
    expect(document.querySelector('[role="dialog"]')).not.toBeNull(),
  );
  return handlers;
}
const button = (name: string) => screen.getByRole('button', { name });

function StagedFilterHarness({
  onCommit,
}: {
  readonly onCommit: (draft: string[]) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [committed, setCommitted] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]);
  const pendingCount = Math.max(0, 100 - draft.length * 9);

  return (
    <>
      <button type="button" onClick={() => setOpened(true)}>
        Open filters
      </button>
      <output aria-label="Committed filters">
        {committed.join(', ') || 'None'}
      </output>
      <FilterDrawer
        opened={opened}
        title="Filters"
        applyLabel={`Show ${pendingCount} records`}
        onApply={() => {
          setCommitted(draft);
          onCommit(draft);
          setOpened(false);
        }}
        onCancel={() => {
          setDraft(committed);
          setOpened(false);
        }}
      >
        <Checkbox.Group value={draft} onChange={setDraft} label="Options">
          <Checkbox value="first" label="First option" />
          <Checkbox value="second" label="Second option" />
        </Checkbox.Group>
        <a
          href="/records/another-group"
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            setDraft(committed);
            setOpened(false);
          }}
        >
          Open another group
        </a>
      </FilterDrawer>
    </>
  );
}

describe('FilterDrawer', () => {
  it('calls onApply once on Apply and renders applyLabel', async () => {
    const { onApply, onCancel } = await mount({
      applyLabel: 'Show 214 results',
    });
    await userEvent.click(button('Show 214 results'));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel once on Cancel', async () => {
    const { onApply, onCancel } = await mount();
    await userEvent.click(button('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('calls onCancel once on Escape', async () => {
    const { onCancel } = await mount();
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders the optional header Back action without closing the drawer', async () => {
    const onBack = vi.fn();
    await mount({ backLabel: 'Back to all filters', onBack });
    const back = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Back to all filters"]',
    );
    expect(back?.closest('header')).not.toBeNull();
    await userEvent.click(button('Back to all filters'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('calls onCancel once on the close button and on the overlay', async () => {
    const { onCancel } = await mount();
    document.querySelector<HTMLElement>('.mantine-Drawer-close')?.click();
    await vi.waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    document.querySelector<HTMLElement>('.mantine-Drawer-overlay')?.click();
    await vi.waitFor(() => expect(onCancel).toHaveBeenCalledTimes(2));
  });

  it('shows only Cancel and the matching item count in the footer', async () => {
    await mount();
    const footer = document.querySelector<HTMLElement>('[class*="footer"]')!;
    const buttons = [...footer.querySelectorAll('button')];
    expect(buttons.map((control) => control.textContent)).toEqual([
      'Cancel',
      'Show results',
    ]);
  });

  it('disables Apply with applyDisabled', async () => {
    const { onApply } = await mount({ applyDisabled: true });
    expect(button('Show results')).toBeDisabled();
    fireEvent.click(button('Show results'));
    expect(onApply).not.toHaveBeenCalled();
  });

  it('names the dialog by its title and moves focus inside', async () => {
    await mount();
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-labelledby')).not.toBeNull();
    await vi.waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true),
    );
  });

  it('commits the whole staged draft once and returns focus to its opener', async () => {
    const onCommit = vi.fn();
    render(
      <MantineProvider>
        <StagedFilterHarness onCommit={onCommit} />
      </MantineProvider>,
    );

    await userEvent.click(button('Open filters'));
    const firstOption = await screen.findByRole('checkbox', {
      name: 'First option',
    });
    await userEvent.click(firstOption);
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Second option' }),
    );
    await vi.waitFor(() => expect(button('Show 82 records')).toBeTruthy());
    await userEvent.click(button('Show 82 records'));

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(['first', 'second']);
    await vi.waitFor(() =>
      expect(document.activeElement?.textContent).toBe('Open filters'),
    );
  });

  it('discards the staged draft on cancel and retains it while open', async () => {
    const onCommit = vi.fn();
    render(
      <MantineProvider>
        <StagedFilterHarness onCommit={onCommit} />
      </MantineProvider>,
    );

    await userEvent.click(button('Open filters'));
    const firstOption = await screen.findByRole('checkbox', {
      name: 'First option',
    });
    await userEvent.click(firstOption);
    expect(button('Show 91 records')).toBeInTheDocument();
    await userEvent.click(button('Cancel'));
    expect(onCommit).not.toHaveBeenCalled();

    await userEvent.click(button('Open filters'));
    const reopened = await screen.findByRole('checkbox', {
      name: 'First option',
    });
    expect(reopened).not.toBeChecked();
    await userEvent.click(reopened);
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Second option' }),
    );
    expect(button('Show 82 records')).toBeInTheDocument();
  });

  it('keeps scope navigation as a real link and discards the staged draft', async () => {
    const onCommit = vi.fn();
    render(
      <MantineProvider>
        <StagedFilterHarness onCommit={onCommit} />
      </MantineProvider>,
    );
    await userEvent.click(button('Open filters'));
    await userEvent.click(
      await screen.findByRole('checkbox', { name: 'First option' }),
    );
    const scopeLink = screen.getByRole('link', {
      name: 'Open another group',
    });
    expect(scopeLink.getAttribute('href')).toBe('/records/another-group');
    // Native link navigation keeps its default action; the drawer closes itself.
    const click = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });
    scopeLink.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
    await vi.waitFor(() =>
      expect(document.querySelector('[role="dialog"]')).toBeNull(),
    );
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('disables Apply when draft is invalid and prevents applying', () => {
    const onApply = vi.fn();
    render(
      <MantineProvider>
        <FilterDrawer
          opened
          title="Filters"
          applyLabel="Show results"
          applyDisabled
          onApply={onApply}
          onCancel={() => {}}
        >
          <div>
            <label htmlFor="min-lvl">Min level</label>
            <input id="min-lvl" defaultValue="50" />
            <label htmlFor="max-lvl">Max level</label>
            <input id="max-lvl" defaultValue="20" />
            <p role="alert">Minimum level cannot exceed maximum level</p>
          </div>
        </FilterDrawer>
      </MantineProvider>,
    );

    const applyButton = screen.getByRole('button', { name: 'Show results' });
    expect(applyButton).toBeDisabled();
    expect((applyButton as HTMLButtonElement).disabled).toBe(true);
    applyButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
