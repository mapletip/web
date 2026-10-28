import { Group, Pagination as MantinePagination } from '@mantine/core';
import type { ReactElement } from 'react';

import type { BrowseState } from '@/components/FacetedBrowser/hooks/browseState';

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

const ignorePageChange = () => undefined;

export interface PaginationProps {
  readonly page: number;
  readonly pageCount: number;
  readonly recordNoun: string;
  readonly state: BrowseState;
  readonly getPageHref:
    ((page: number, nextState: BrowseState) => string) | undefined;
  readonly onPageChange: (page: number) => void;
}

/** Semantic buttons locally, real host links when a URL factory is supplied. */
export function Pagination({
  page,
  pageCount,
  recordNoun,
  state,
  getPageHref,
  onPageChange,
}: PaginationProps): ReactElement | null {
  if (pageCount <= 1) return null;

  const hrefFor = (target: number) =>
    getPageHref?.(target, { ...state, page: target });

  return (
    <Group justify="flex-end" align="center" wrap="wrap">
      <MantinePagination
        total={pageCount}
        value={page}
        onChange={getPageHref ? ignorePageChange : onPageChange}
        aria-label={`${recordNoun} pages`}
        getItemProps={(pageNumber) => ({
          'aria-label': `Page ${pageNumber}`,
          ...(getPageHref
            ? {
                component: 'a' as const,
                href: hrefFor(pageNumber),
              }
            : {}),
        })}
        getControlProps={(control) => {
          const target = controlTarget(control, page, pageCount);
          const label = controlLabel(control);
          if (target < 1 || target > pageCount) {
            return { 'aria-label': label, disabled: true };
          }
          return {
            'aria-label': label,
            ...(getPageHref
              ? {
                  component: 'a' as const,
                  href: hrefFor(target),
                }
              : {}),
          };
        }}
      />
    </Group>
  );
}
