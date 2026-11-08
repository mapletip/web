import { Group, Pagination as MantinePagination } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import type { BrowseState } from '@/components/FacetedBrowser/hooks/browseState';

export interface PageLinkRenderProps {
  readonly className: string;
  readonly children: ReactNode;
  readonly 'aria-label': string | undefined;
  readonly 'aria-current': 'page' | undefined;
}

export interface PageLinkRenderOptions {
  readonly page: number;
  readonly state: BrowseState;
  readonly props: PageLinkRenderProps;
}

export type PageLinkRenderer = (options: PageLinkRenderOptions) => ReactNode;

interface PageLinkAdapterProps {
  readonly className: string;
  readonly children: ReactNode;
  readonly 'aria-label'?: string | undefined;
  readonly 'aria-current'?: 'page' | undefined;
  readonly page?: number | undefined;
  readonly state?: BrowseState | undefined;
  readonly renderPageLink?: PageLinkRenderer | undefined;
}

function PageLinkAdapter({
  className,
  children,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
  page,
  state,
  renderPageLink,
}: PageLinkAdapterProps): ReactNode {
  if (!renderPageLink || page === undefined || !state) {
    return null;
  }
  return renderPageLink({
    page,
    state,
    props: {
      className,
      children,
      'aria-label': ariaLabel,
      'aria-current': ariaCurrent,
    },
  });
}

type PaginationControl = 'first' | 'previous' | 'next' | 'last';

function controlTarget(
  control: PaginationControl,
  page: number,
  pageCount: number,
): number {
  switch (control) {
    case 'first':
      return 1;
    case 'previous':
      return page - 1;
    case 'next':
      return page + 1;
    case 'last':
      return pageCount;
  }
}

function controlLabel(control: PaginationControl): string {
  switch (control) {
    case 'first':
      return 'First page';
    case 'previous':
      return 'Previous page';
    case 'next':
      return 'Next page';
    case 'last':
      return 'Last page';
  }
}

function isControlDisabled(
  control: PaginationControl,
  page: number,
  pageCount: number,
): boolean {
  switch (control) {
    case 'first':
    case 'previous':
      return page <= 1;
    case 'next':
    case 'last':
      return page >= pageCount;
  }
}

export interface PaginationProps {
  readonly page: number;
  readonly pageCount: number;
  readonly recordNoun: string;
  readonly state: BrowseState;
  readonly renderPageLink?: PageLinkRenderer | undefined;
  readonly onPageChange: (page: number) => void;
}

/** Semantic buttons locally, real host links when a link renderer is supplied. */
export function Pagination({
  page,
  pageCount,
  recordNoun,
  state,
  renderPageLink,
  onPageChange,
}: PaginationProps): ReactElement | null {
  if (pageCount <= 1) return null;

  return (
    <Group justify="flex-end" align="center" wrap="wrap">
      <MantinePagination
        total={pageCount}
        value={page}
        onChange={onPageChange}
        aria-label={`${recordNoun} pages`}
        getItemProps={(pageNumber) => ({
          'aria-label': `Page ${pageNumber}`,
          ...(renderPageLink
            ? {
                component: PageLinkAdapter,
                page: pageNumber,
                state,
                renderPageLink,
              }
            : {}),
        })}
        getControlProps={(control) => {
          const label = controlLabel(control);
          if (isControlDisabled(control, page, pageCount)) {
            return { 'aria-label': label, disabled: true };
          }
          const target = controlTarget(control, page, pageCount);
          return {
            'aria-label': label,
            ...(renderPageLink
              ? {
                  component: PageLinkAdapter,
                  page: target,
                  state,
                  renderPageLink,
                }
              : {}),
          };
        }}
      />
    </Group>
  );
}
