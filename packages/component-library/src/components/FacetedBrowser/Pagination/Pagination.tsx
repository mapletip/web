import { Group, Pagination as MantinePagination } from '@mantine/core';
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';

import type { BrowseState } from '@/components/FacetedBrowser/hooks/browseState';

export type PageLinkRenderProps = ComponentPropsWithoutRef<'a'> & {
  readonly [dataAttribute: `data-${string}`]: unknown;
  readonly disabled?: boolean | undefined;
};

export interface PageLinkRenderOptions {
  readonly page: number;
  readonly state: BrowseState;
  readonly props: PageLinkRenderProps;
}

export type PageLinkRenderer = (options: PageLinkRenderOptions) => ReactNode;

interface PageLinkAdapterProps extends PageLinkRenderProps {
  readonly page?: number | undefined;
  readonly state?: BrowseState | undefined;
  readonly renderPageLink?: PageLinkRenderer | undefined;
}

function PageLinkAdapter({
  page,
  state,
  renderPageLink,
  ...props
}: PageLinkAdapterProps): ReactNode {
  if (!renderPageLink || page === undefined || !state) {
    return null;
  }
  if (props.disabled) {
    const dataAttributes = Object.fromEntries(
      Object.entries(props).filter(([key]) => key.startsWith('data-')),
    );
    return (
      <button
        type="button"
        disabled
        className={props.className}
        style={props.style}
        aria-label={props['aria-label']}
        {...dataAttributes}
      >
        {props.children}
      </button>
    );
  }
  return renderPageLink({
    page,
    state,
    props,
  });
}

type PaginationControl = 'first' | 'previous' | 'next' | 'last';

interface ControlTargetOptions {
  readonly control: PaginationControl;
  readonly page: number;
  readonly pageCount: number;
}

function controlTarget({
  control,
  page,
  pageCount,
}: ControlTargetOptions): number {
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
        {...(renderPageLink ? {} : { onChange: onPageChange })}
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
        getControlProps={(control) => ({
          'aria-label': controlLabel(control),
          ...(renderPageLink
            ? {
                component: PageLinkAdapter,
                page: controlTarget({ control, page, pageCount }),
                state,
                renderPageLink,
              }
            : {}),
        })}
      />
    </Group>
  );
}
