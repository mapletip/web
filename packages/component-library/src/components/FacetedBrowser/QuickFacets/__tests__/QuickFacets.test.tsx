import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import '@/styles.css';
import { QuickFacets } from '@/components/FacetedBrowser/QuickFacets/QuickFacets';

describe('QuickFacets', () => {
  it('reports the selected section and active count accessibly', async () => {
    const onOpen = vi.fn();
    render(
      <MantineProvider>
        <QuickFacets
          activeTotal={2}
          facets={[{ id: 'group', label: 'Group', active: 2 }]}
          onOpen={onOpen}
        />
      </MantineProvider>,
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Group, 2 active filters. Open Group filters',
      }),
    );
    expect(onOpen).toHaveBeenCalledWith('group');
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Filters, 2 active. Open all filters',
      }),
    );
    expect(onOpen).toHaveBeenLastCalledWith(null);
  });

  it('keeps each facet shortcut reachable by keyboard', async () => {
    render(
      <MantineProvider>
        <QuickFacets
          activeTotal={0}
          facets={[
            { id: 'group', label: 'Group', active: 0 },
            { id: 'range', label: 'Value range', active: 0 },
          ]}
          onOpen={() => undefined}
        />
      </MantineProvider>,
    );
    const buttons = [
      screen.getByRole('button', {
        name: 'Filters, 0 active. Open all filters',
      }),
      screen.getByRole('button', { name: 'Group. Open Group filters' }),
      screen.getByRole('button', {
        name: 'Value range. Open Value range filters',
      }),
    ];
    buttons[0]!.focus();
    for (const target of buttons.slice(1)) {
      await userEvent.tab();
      expect(document.activeElement).toBe(target);
    }
  });

  it('renders Filters button when hasFilters is true even with no facets', () => {
    render(
      <MantineProvider>
        <QuickFacets
          activeTotal={0}
          facets={[]}
          hasFilters={true}
          onOpen={() => undefined}
        />
      </MantineProvider>,
    );

    expect(
      screen.getByRole('button', {
        name: 'Filters, 0 active. Open all filters',
      }),
    ).toBeVisible();
  });

  it('renders navigation chip with decorative icon when given, keeping accessible name unchanged', () => {
    render(
      <MantineProvider>
        <QuickFacets
          activeTotal={0}
          facets={[]}
          navigation={{
            label: 'Category',
            currentLabel: 'Potions',
            currentIcon: <span data-testid="nav-icon">potion-icon</span>,
            onOpen: () => undefined,
          }}
          onOpen={() => undefined}
        />
      </MantineProvider>,
    );

    const button = screen.getByRole('button', {
      name: 'Category: Potions. Open Category',
    });
    expect(button).toBeVisible();
    expect(button.textContent).toContain('Potions');

    const iconWrapper = button.querySelector('[class*="icon"]');
    expect(iconWrapper).toBeInTheDocument();
    expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('nav-icon')).toBeInTheDocument();
  });

  it('renders navigation chip without icon when omitted', () => {
    render(
      <MantineProvider>
        <QuickFacets
          activeTotal={0}
          facets={[]}
          navigation={{
            label: 'Category',
            currentLabel: 'Potions',
            onOpen: () => undefined,
          }}
          onOpen={() => undefined}
        />
      </MantineProvider>,
    );

    const button = screen.getByRole('button', {
      name: 'Category: Potions. Open Category',
    });
    expect(button).toBeVisible();
    expect(button.querySelector('[class*="icon"]')).toBeNull();
  });
});
