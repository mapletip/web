import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import classes from '@/components/FacetedBrowser/FilterDrawer/FilterDrawer.module.css';

import { NavigationDrawer } from '../NavigationDrawer';

describe('NavigationDrawer', () => {
  const defaultProps = {
    opened: true,
    title: 'Categories',
    currentId: 'all',
    currentCount: 100,
    onClose: vi.fn(),
    onApply: vi.fn(),
  };

  it('renders drawer header, content, and footer with Cancel and Show N items', () => {
    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps}>
          {() => <div>Drawer Body</div>}
        </NavigationDrawer>
      </MantineProvider>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Close Categories' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Drawer Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show 100 items' }),
    ).toBeInTheDocument();
  });

  it('renders footer buttons inside a paired footer container', () => {
    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps}>
          {() => <div>Drawer Body</div>}
        </NavigationDrawer>
      </MantineProvider>,
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const applyButton = screen.getByRole('button', {
      name: 'Show 100 items',
    });
    expect(cancelButton.parentElement).toBe(applyButton.parentElement);
    expect(cancelButton.parentElement?.className).toContain(classes['footer']);
  });

  it('renders "Show items" when draft count is undefined', () => {
    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} currentCount={undefined}>
          {() => <div>Drawer Body</div>}
        </NavigationDrawer>
      </MantineProvider>,
    );

    expect(
      screen.getByRole('button', { name: 'Show items' }),
    ).toBeInTheDocument();
  });

  it('moves draft on tapping non-leaf row without navigating and updates footer count', () => {
    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps}>
          {({ selectedId, onSelect }) => (
            <div>
              <span data-testid="selected">{selectedId}</span>
              <button
                type="button"
                onClick={() =>
                  onSelect({ id: 'clothing', count: 42 }, { isLeaf: false })
                }
              >
                Select Clothing
              </button>
            </div>
          )}
        </NavigationDrawer>
      </MantineProvider>,
    );

    expect(screen.getByTestId('selected')).toHaveTextContent('all');
    expect(
      screen.getByRole('button', { name: 'Show 100 items' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Select Clothing' }));

    expect(screen.getByTestId('selected')).toHaveTextContent('clothing');
    expect(
      screen.getByRole('button', { name: 'Show 42 items' }),
    ).toBeInTheDocument();
    expect(defaultProps.onApply).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('applies immediately and reports navigation on tapping a different leaf row', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} onApply={onApply} onClose={onClose}>
          {({ onSelect }) => (
            <button
              type="button"
              onClick={() =>
                onSelect({ id: 'clothing/shirts', count: 15 }, { isLeaf: true })
              }
            >
              Select Shirts
            </button>
          )}
        </NavigationDrawer>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select Shirts' }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith('clothing/shirts', { replace: true });
    expect(onClose).toHaveBeenCalledWith('navigate');
  });

  it('dismisses without applying when the leaf id equals the current id', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <MantineProvider>
        <NavigationDrawer
          {...defaultProps}
          currentId="clothing/shirts"
          onApply={onApply}
          onClose={onClose}
        >
          {({ onSelect }) => (
            <button
              type="button"
              onClick={() =>
                onSelect({ id: 'clothing/shirts', count: 15 }, { isLeaf: true })
              }
            >
              Select Shirts
            </button>
          )}
        </NavigationDrawer>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select Shirts' }));

    expect(onApply).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith('dismiss');
  });

  it('applies the draft and reports navigation when it differs from the current id', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} onApply={onApply} onClose={onClose}>
          {({ onSelect }) => (
            <button
              type="button"
              onClick={() =>
                onSelect({ id: 'clothing', count: 42 }, { isLeaf: false })
              }
            >
              Select Clothing
            </button>
          )}
        </NavigationDrawer>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select Clothing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show 42 items' }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith('clothing', { replace: true });
    expect(onClose).toHaveBeenCalledWith('navigate');
  });

  it('dismisses without applying when the draft equals the current id', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <MantineProvider>
        <NavigationDrawer
          {...defaultProps}
          currentId="all"
          onApply={onApply}
          onClose={onClose}
        >
          {() => <div>Body</div>}
        </NavigationDrawer>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show 100 items' }));

    expect(onApply).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith('dismiss');
  });

  it('discards the draft and reports dismissal on Cancel click', () => {
    const onClose = vi.fn();
    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} onClose={onClose}>
          {({ onSelect }) => (
            <button
              type="button"
              onClick={() =>
                onSelect({ id: 'clothing', count: 42 }, { isLeaf: false })
              }
            >
              Select Clothing
            </button>
          )}
        </NavigationDrawer>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select Clothing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledWith('dismiss');
    expect(defaultProps.onApply).not.toHaveBeenCalled();
  });

  it('discards the draft and reports dismissal on Close button (✕) click', () => {
    const onClose = vi.fn();
    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} onClose={onClose}>
          {() => <div>Body</div>}
        </NavigationDrawer>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close Categories' }));

    expect(onClose).toHaveBeenCalledWith('dismiss');
  });

  it('does not touch browser history while opening, cancelling or applying', () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    const back = vi.spyOn(window.history, 'back');
    const onClose = vi.fn();

    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} onClose={onClose}>
          {() => <div>Body</div>}
        </NavigationDrawer>
      </MantineProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledWith('dismiss');
    expect(pushState).not.toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
  });

  it('moves focus to the highlighted draft row after drilling', async () => {
    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps}>
          {({ selectedId, onSelect }) => (
            <div>
              <button
                type="button"
                aria-current={selectedId === 'clothing' ? 'true' : undefined}
                data-testid="clothing-btn"
                onClick={() =>
                  onSelect({ id: 'clothing', count: 42 }, { isLeaf: false })
                }
              >
                Clothing
              </button>
            </div>
          )}
        </NavigationDrawer>
      </MantineProvider>,
    );

    const clothingBtn = screen.getByTestId('clothing-btn');
    expect(clothingBtn).not.toHaveFocus();

    fireEvent.click(clothingBtn);

    await waitFor(() => {
      expect(clothingBtn).toHaveFocus();
    });
  });

  it('re-initializes draft to currentId each time the drawer opens', async () => {
    const { rerender } = render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} opened={false}>
          {({ selectedId }) => <span data-testid="selected">{selectedId}</span>}
        </NavigationDrawer>
      </MantineProvider>,
    );

    rerender(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} opened={true} currentId="featured">
          {({ selectedId }) => <span data-testid="selected">{selectedId}</span>}
        </NavigationDrawer>
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected')).toHaveTextContent('featured');
    });
  });
});
