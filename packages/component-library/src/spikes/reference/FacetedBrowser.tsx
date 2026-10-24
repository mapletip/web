import { Box } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import classes from './faceted-browser.module.css';

export interface FacetedBrowserProps {
  readonly title: ReactNode;
  readonly search?: ReactNode;
  readonly rail?: ReactNode;
  readonly railLabel?: string;
  readonly quickFacets?: ReactNode;
  readonly activeFilters?: ReactNode;
  readonly summary?: ReactNode;
  readonly toolbar?: ReactNode;
  readonly status?: ReactNode;
  readonly resultsLabel: string;
  readonly table: ReactNode;
  readonly cards: ReactNode;
  readonly pagination?: ReactNode;
}

export function FacetedBrowser({
  title,
  search,
  rail,
  railLabel,
  quickFacets,
  activeFilters,
  summary,
  toolbar,
  status,
  resultsLabel,
  table,
  cards,
  pagination,
}: FacetedBrowserProps): ReactElement {
  return (
    <div className={classes['root']} {...(rail ? { 'data-has-rail': '' } : {})}>
      {rail ? (
        <Box
          component="aside"
          visibleFrom="md"
          className={classes['rail']}
          {...(railLabel ? { 'aria-label': railLabel } : {})}
        >
          {rail}
        </Box>
      ) : null}
      <section className={classes['results']} aria-label={resultsLabel}>
        <div className={classes['header']}>
          {title}
          {search}
        </div>
        {quickFacets ? <Box hiddenFrom="md">{quickFacets}</Box> : null}
        {activeFilters}
        {summary || toolbar ? (
          <div className={classes['bar']}>
            {summary}
            {toolbar}
          </div>
        ) : null}
        {status ?? (
          <>
            <Box visibleFrom="md">{table}</Box>
            <Box hiddenFrom="md">{cards}</Box>
            {pagination}
          </>
        )}
      </section>
    </div>
  );
}
