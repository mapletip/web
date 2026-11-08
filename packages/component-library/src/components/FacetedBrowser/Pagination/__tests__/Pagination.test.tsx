import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { BrowseState } from '@/components/FacetedBrowser/hooks/browseState';
import { Pagination } from '@/components/FacetedBrowser/Pagination/Pagination';
import type {
  PageLinkRenderOptions,
  PageLinkRenderer,
} from '@/components/FacetedBrowser/Pagination/Pagination';

const mockState: BrowseState = {
  search: '',
  filters: {},
  sort: { field: 'name', direction: 'asc' as const },
  page: 2,
  pageSize: 20,
  hiddenColumns: [],
};

describe('Pagination with renderPageLink', () => {
  it('passes page, state, and built props to the renderer for items and controls', () => {
    const calls: PageLinkRenderOptions[] = [];
    const renderPageLink: PageLinkRenderer = (options) => {
      calls.push(options);
      return (
        <a href={`/items?page=${options.page}`} {...options.props}>
          {options.props.children}
        </a>
      );
    };

    render(
      <MantineProvider>
        <Pagination
          page={2}
          pageCount={5}
          recordNoun="items"
          state={mockState}
          renderPageLink={renderPageLink}
          onPageChange={vi.fn()}
        />
      </MantineProvider>,
    );

    // Page items (pages 1 to 5)
    const page1Item = calls.find(
      (c) => c.page === 1 && c.props['aria-label'] === 'Page 1',
    );
    expect(page1Item).toBeDefined();
    expect(page1Item?.state).toBe(mockState);
    expect(page1Item?.props.className).toContain('mantine-Pagination-control');
    expect(page1Item?.props.children).toBe(1);
    expect(page1Item?.props['aria-current']).toBeUndefined();

    const page2Item = calls.find(
      (c) => c.page === 2 && c.props['aria-label'] === 'Page 2',
    );
    expect(page2Item).toBeDefined();
    expect(page2Item?.state).toBe(mockState);
    expect(page2Item?.props.className).toContain('mantine-Pagination-control');
    expect(page2Item?.props.children).toBe(2);
    expect(page2Item?.props['aria-current']).toBe('page');

    // Controls: on page 2 of 5, previous is page 1, next is page 3
    const prevControl = calls.find(
      (c) => c.props['aria-label'] === 'Previous page',
    );
    expect(prevControl).toBeDefined();
    expect(prevControl?.page).toBe(1);
    expect(prevControl?.state).toBe(mockState);
    expect(prevControl?.props.className).toContain(
      'mantine-Pagination-control',
    );
    expect(prevControl?.props['aria-current']).toBeUndefined();

    const nextControl = calls.find(
      (c) => c.props['aria-label'] === 'Next page',
    );
    expect(nextControl).toBeDefined();
    expect(nextControl?.page).toBe(3);
    expect(nextControl?.state).toBe(mockState);
    expect(nextControl?.props.className).toContain(
      'mantine-Pagination-control',
    );
    expect(nextControl?.props['aria-current']).toBeUndefined();
  });

  it('keeps the renderer element with Mantine classes and aria-current on the active page', () => {
    const renderPageLink: PageLinkRenderer = ({ page, props }) => (
      <a href={`/items?page=${page}`} data-testid={`page-${page}`} {...props}>
        {props.children}
      </a>
    );

    render(
      <MantineProvider>
        <Pagination
          page={2}
          pageCount={5}
          recordNoun="items"
          state={mockState}
          renderPageLink={renderPageLink}
          onPageChange={vi.fn()}
        />
      </MantineProvider>,
    );

    const activeLink = screen.getByRole('link', { name: 'Page 2' });
    expect(activeLink).toHaveAttribute('href', '/items?page=2');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink).toHaveClass('mantine-Pagination-control');

    const inactiveLink = screen.getByRole('link', { name: 'Page 1' });
    expect(inactiveLink).toHaveAttribute('href', '/items?page=1');
    expect(inactiveLink).not.toHaveAttribute('aria-current');
    expect(inactiveLink).toHaveClass('mantine-Pagination-control');

    const nextLink = screen.getByRole('link', { name: 'Next page' });
    expect(nextLink).toHaveAttribute('href', '/items?page=3');
    expect(nextLink).toHaveClass('mantine-Pagination-control');
  });

  it('renders standard buttons and triggers onPageChange when renderPageLink is omitted', async () => {
    const onPageChange = vi.fn();

    render(
      <MantineProvider>
        <Pagination
          page={1}
          pageCount={5}
          recordNoun="items"
          state={{ ...mockState, page: 1 }}
          renderPageLink={undefined}
          onPageChange={onPageChange}
        />
      </MantineProvider>,
    );

    const page3Button = screen.getByRole('button', { name: 'Page 3' });
    await userEvent.click(page3Button);
    expect(onPageChange).toHaveBeenCalledWith(3);

    const nextButton = screen.getByRole('button', { name: 'Next page' });
    await userEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
