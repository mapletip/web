import { MantineProvider, Checkbox } from '@mantine/core';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import {
  FilterDrawer,
  type FilterDrawerProps,
} from '@/components/FacetedBrowser/FilterDrawer/FilterDrawer';

beforeEach(async () => {
  document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  await page.viewport(375, 640);
});

async function mount(extra: Partial<FilterDrawerProps> = {}) {
  const handlers = {
    onApply: vi.fn(),
    onCancel: vi.fn(),
    onReset: vi.fn(),
  };
  await render(
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
const button = (name: string) =>
  page.getByRole('button', { name, exact: true });

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
        onReset={() => setDraft([])}
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

  it('calls onReset and stays open', async () => {
    const { onReset, onCancel } = await mount();
    await userEvent.click(button('Reset'));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('places Reset immediately after Cancel and before Apply', async () => {
    await mount();
    const footer = document.querySelector<HTMLElement>('[class*="footer"]')!;
    const buttons = [...footer.querySelectorAll('button')];
    expect(buttons.map((control) => control.textContent)).toEqual([
      'Cancel',
      'Reset',
      'Show results',
    ]);
    expect(buttons[1]!.getBoundingClientRect().x).toBeGreaterThan(
      buttons[0]!.getBoundingClientRect().x,
    );
  });

  it('disables Apply with applyDisabled', async () => {
    const { onApply } = await mount({ applyDisabled: true });
    await expect.element(button('Show results')).toBeDisabled();
    await userEvent
      .click(button('Show results'), { force: true })
      .catch(() => {});
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
    await render(
      <MantineProvider>
        <StagedFilterHarness onCommit={onCommit} />
      </MantineProvider>,
    );

    await userEvent.click(button('Open filters'));
    await userEvent.click(page.getByRole('checkbox', { name: 'First option' }));
    await userEvent.click(
      page.getByRole('checkbox', { name: 'Second option' }),
    );
    await vi.waitFor(() =>
      expect(button('Show 82 records').element()).toBeTruthy(),
    );
    await userEvent.click(button('Show 82 records'));

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(['first', 'second']);
    await vi.waitFor(() =>
      expect(document.activeElement?.textContent).toBe('Open filters'),
    );
  });

  it('discards on cancel and clears on reset', async () => {
    const onCommit = vi.fn();
    await render(
      <MantineProvider>
        <StagedFilterHarness onCommit={onCommit} />
      </MantineProvider>,
    );

    await userEvent.click(button('Open filters'));
    await userEvent.click(page.getByRole('checkbox', { name: 'First option' }));
    await userEvent.click(button('Reset'));
    await userEvent.click(button('Cancel'));
    expect(onCommit).not.toHaveBeenCalled();

    await userEvent.click(button('Open filters'));
    await expect
      .element(page.getByRole('checkbox', { name: 'First option' }))
      .not.toBeChecked();
    await userEvent.click(page.getByRole('checkbox', { name: 'First option' }));
    await userEvent.click(button('Reset'));
    await expect
      .element(page.getByRole('checkbox', { name: 'First option' }))
      .not.toBeChecked();
    await expect
      .element(page.getByRole('dialog', { name: 'Filters' }))
      .toBeInTheDocument();

    await userEvent.click(
      page.getByRole('checkbox', { name: 'Second option' }),
    );
    await expect.element(button('Show 91 records')).toBeInTheDocument();
  });

  it('keeps scope navigation as a real link and discards the staged draft', async () => {
    const onCommit = vi.fn();
    await render(
      <MantineProvider>
        <StagedFilterHarness onCommit={onCommit} />
      </MantineProvider>,
    );
    await userEvent.click(button('Open filters'));
    await userEvent.click(page.getByRole('checkbox', { name: 'First option' }));
    const scopeLink = page
      .getByRole('link', { name: 'Open another group' })
      .element();
    expect(scopeLink.getAttribute('href')).toBe('/records/another-group');
    // Keep this browser test iframe on its harness route while preserving native
    // link navigation and the unprevented click default.
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

  it('disables Apply when draft is invalid and prevents applying', async () => {
    const onApply = vi.fn();
    await render(
      <MantineProvider>
        <FilterDrawer
          opened
          title="Filters"
          applyLabel="Show results"
          applyDisabled
          onApply={onApply}
          onCancel={() => {}}
          onReset={() => {}}
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

    const applyButton = page.getByRole('button', { name: 'Show results' });
    await expect.element(applyButton).toBeDisabled();
    expect((applyButton.element() as HTMLButtonElement).disabled).toBe(true);
    applyButton
      .element()
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onApply).not.toHaveBeenCalled();
    expect(page.getByRole('alert')).toBeInTheDocument();
  });

  it('remains usable at 320px width with reachable footer actions and scrollable body', async () => {
    await page.viewport(320, 568);
    const onCancel = vi.fn();
    const onReset = vi.fn();
    const onApply = vi.fn();

    await render(
      <MantineProvider>
        <FilterDrawer
          opened
          title="Filters"
          applyLabel="Show 12 records"
          onApply={onApply}
          onCancel={onCancel}
          onReset={onReset}
        >
          <div style={{ height: '800px' }}>
            <p>Tall filter options content</p>
          </div>
        </FilterDrawer>
      </MantineProvider>,
    );

    // Cancel, Reset and Apply are all visible and reachable
    await expect.element(button('Cancel')).toBeInTheDocument();
    await expect.element(button('Reset')).toBeInTheDocument();
    await expect.element(button('Show 12 records')).toBeInTheDocument();

    // Verify footer actions can be clicked at 320px
    await userEvent.click(button('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
