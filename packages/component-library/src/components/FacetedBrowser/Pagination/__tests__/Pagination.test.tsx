import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from '../Pagination';

const mockState = {
  search: '',
  filters: {},
  sort: { field: 'name', direction: 'asc' as const },
  page: 1,
  pageSize: 20,
  hiddenColumns: [],
};

describe('Pagination with getPageHref', () => {
  it('renders real hrefs and intercepts plain left clicks with preventDefault and onPageChange', () => {
    const onPageChange = vi.fn();
    const getPageHref = (page: number) => `/items?page=${page}`;

    render(
      <MantineProvider>
        <Pagination
          page={1}
          pageCount={5}
          recordNoun="items"
          state={mockState}
          getPageHref={getPageHref}
          onPageChange={onPageChange}
        />
      </MantineProvider>,
    );

    const page2Link = screen.getByRole('link', { name: 'Page 2' });
    expect(page2Link).toHaveAttribute('href', '/items?page=2');

    // Plain left click should prevent default and trigger onPageChange
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    page2Link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('keeps browser default behavior on modified clicks without calling onPageChange', () => {
    const onPageChange = vi.fn();
    const getPageHref = (page: number) => `/items?page=${page}`;

    render(
      <MantineProvider>
        <Pagination
          page={1}
          pageCount={5}
          recordNoun="items"
          state={mockState}
          getPageHref={getPageHref}
          onPageChange={onPageChange}
        />
      </MantineProvider>,
    );

    const page2Link = screen.getByRole('link', { name: 'Page 2' });

    // Ctrl-click
    const ctrlClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      ctrlKey: true,
    });
    page2Link.dispatchEvent(ctrlClick);
    expect(ctrlClick.defaultPrevented).toBe(false);
    expect(onPageChange).not.toHaveBeenCalled();

    // Meta-click (Cmd-click on Mac)
    const metaClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      metaKey: true,
    });
    page2Link.dispatchEvent(metaClick);
    expect(metaClick.defaultPrevented).toBe(false);
    expect(onPageChange).not.toHaveBeenCalled();

    // Shift-click
    const shiftClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      shiftKey: true,
    });
    page2Link.dispatchEvent(shiftClick);
    expect(shiftClick.defaultPrevented).toBe(false);
    expect(onPageChange).not.toHaveBeenCalled();

    // Middle-click (button = 1)
    const middleClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 1,
    });
    page2Link.dispatchEvent(middleClick);
    expect(middleClick.defaultPrevented).toBe(false);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('renders standard buttons and triggers onPageChange when getPageHref is omitted', async () => {
    const onPageChange = vi.fn();

    render(
      <MantineProvider>
        <Pagination
          page={1}
          pageCount={5}
          recordNoun="items"
          state={mockState}
          getPageHref={undefined}
          onPageChange={onPageChange}
        />
      </MantineProvider>,
    );

    const page3Button = screen.getByRole('button', { name: 'Page 3' });
    await userEvent.click(page3Button);

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
