import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

  it('pushes a history entry when opened', () => {
    const history = {
      push: vi.fn(),
      back: vi.fn(),
    };

    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} history={history}>
          {() => <div>Drawer Body</div>}
        </NavigationDrawer>
      </MantineProvider>,
    );

    expect(history.push).toHaveBeenCalledTimes(1);
    expect(history.back).not.toHaveBeenCalled();
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

  it('applies immediately and closes on tapping leaf row without calling history.back', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    const history = { push: vi.fn(), back: vi.fn() };

    render(
      <MantineProvider>
        <NavigationDrawer
          {...defaultProps}
          onApply={onApply}
          onClose={onClose}
          history={history}
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

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith('clothing/shirts', { replace: true });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(history.back).not.toHaveBeenCalled();
  });

  it('applies draft and replaces history on footer apply click when draft differs from current', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    const history = { push: vi.fn(), back: vi.fn() };

    render(
      <MantineProvider>
        <NavigationDrawer
          {...defaultProps}
          onApply={onApply}
          onClose={onClose}
          history={history}
        >
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
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(history.back).not.toHaveBeenCalled();
  });

  it('just closes and pops history on footer apply click when draft equals current', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    const history = { push: vi.fn(), back: vi.fn() };

    render(
      <MantineProvider>
        <NavigationDrawer
          {...defaultProps}
          currentId="all"
          onApply={onApply}
          onClose={onClose}
          history={history}
        >
          {() => <div>Body</div>}
        </NavigationDrawer>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show 100 items' }));

    expect(onApply).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(history.back).toHaveBeenCalledTimes(1);
  });

  it('discards draft, calls history.back and onClose on Cancel click', () => {
    const onClose = vi.fn();
    const history = { push: vi.fn(), back: vi.fn() };

    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} onClose={onClose} history={history}>
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

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(history.back).toHaveBeenCalledTimes(1);
    expect(defaultProps.onApply).not.toHaveBeenCalled();
  });

  it('discards draft, calls history.back and onClose on Close button (✕) click', () => {
    const onClose = vi.fn();
    const history = { push: vi.fn(), back: vi.fn() };

    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} onClose={onClose} history={history}>
          {() => <div>Body</div>}
        </NavigationDrawer>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close Categories' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(history.back).toHaveBeenCalledTimes(1);
  });

  it('closes and discards draft without calling history.back when browser popstate fires', () => {
    const onClose = vi.fn();
    const history = { push: vi.fn(), back: vi.fn() };

    render(
      <MantineProvider>
        <NavigationDrawer {...defaultProps} onClose={onClose} history={history}>
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

    // Simulate browser Back (popstate)
    fireEvent(window, new PopStateEvent('popstate'));

    expect(onClose).toHaveBeenCalledTimes(1);
    // history.back must NOT be called since browser already popped
    expect(history.back).not.toHaveBeenCalled();
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
