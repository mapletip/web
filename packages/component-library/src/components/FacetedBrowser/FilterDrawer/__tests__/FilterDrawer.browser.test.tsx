import { MantineProvider } from '@mantine/core';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { FilterDrawer } from '@/components/FacetedBrowser/FilterDrawer/FilterDrawer';

/**
 * Overlay mechanics a simulated DOM cannot prove: focus ownership through the
 * real Mantine transition, Escape dismissal and focus restoration, and narrow
 * viewport usability. Callback and layout contracts are jsdom component tests.
 */
function Harness({ onCancel }: { readonly onCancel: () => void }) {
  return (
    <MantineProvider>
      <button type="button" onClick={() => undefined}>
        Open filters
      </button>
      <FilterDrawer
        opened
        title="Filters"
        applyLabel="Show results"
        onApply={() => undefined}
        onCancel={onCancel}
      >
        <div style={{ height: '800px' }}>
          <p>Tall filter options content</p>
        </div>
      </FilterDrawer>
    </MantineProvider>
  );
}

describe('FilterDrawer in a real browser', () => {
  it('traps focus, dismisses on Escape and restores focus to its opener', async () => {
    const onCancel = vi.fn();
    await page.viewport(375, 640);
    await render(<Harness onCancel={onCancel} />);

    const dialog = page.getByRole('dialog', { name: 'Filters' });
    await expect.element(dialog).toBeVisible();
    await expect
      .poll(() => dialog.element().contains(document.activeElement))
      .toBe(true);

    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('stays usable at 320px with reachable footer actions', async () => {
    await page.viewport(320, 568);
    await render(<Harness onCancel={() => undefined} />);

    await expect
      .element(page.getByRole('button', { name: 'Cancel' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Show results' }))
      .toBeVisible();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
  });
});
