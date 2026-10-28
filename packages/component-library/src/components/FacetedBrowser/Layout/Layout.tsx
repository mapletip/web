import { Box } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import classes from '@/components/FacetedBrowser/FacetedBrowser.module.css';

export interface LayoutProps {
  /** Page heading, e.g. `<Title order={1}>`. */
  readonly title: ReactNode;
  readonly search?: ReactNode;
  /** Persistent filter rail, shown at md and wider. */
  readonly rail?: ReactNode;
  /** aria-label for the rail landmark (`<aside>`). Required when `rail` is set. */
  readonly railLabel?: string;
  /** Quick facet row, shown below md. */
  readonly quickFacets?: ReactNode;
  readonly activeFilters?: ReactNode;
  readonly summary?: ReactNode;
  readonly toolbar?: ReactNode;
  /** Replaces the results (table, cards and pagination) when defined. */
  readonly status?: ReactNode;
  /** aria-label for the results region. */
  readonly resultsLabel: string;
  /**
   * Dual presentation slots (e.g. desktop comparison table + mobile cards).
   * When both are supplied, table is visible at md and wider, and cards below md.
   */
  readonly table?: ReactNode;
  readonly cards?: ReactNode;
  /**
   * Domain-owned results presentation across viewports
   * (e.g. location-first discovery cards, visual collections).
   * When provided, rendered directly without forcing a desktop comparison table.
   */
  readonly results?: ReactNode;
  readonly children?: ReactNode;
  readonly pagination?: ReactNode;
}

function ResultsContent({
  results,
  children,
  table,
  cards,
}: Pick<
  LayoutProps,
  'results' | 'children' | 'table' | 'cards'
>): ReactElement | null {
  const custom = results ?? children;
  if (custom !== undefined && custom !== null) return <>{custom}</>;
  if (table && cards) {
    return (
      <>
        <Box visibleFrom="md">{table}</Box>
        <Box hiddenFrom="md">{cards}</Box>
      </>
    );
  }
  if (table) return <Box visibleFrom="md">{table}</Box>;
  return cards ? <>{cards}</> : null;
}

export function Layout({
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
  results,
  children,
  pagination,
}: LayoutProps): ReactElement {
  return (
    <div className={classes['root']} {...(rail ? { 'data-has-rail': '' } : {})}>
      {rail ? (
        <Box
          component="aside"
          visibleFrom="md"
          className={classes['rail']}
          aria-label={railLabel ?? 'Filters'}
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
        {status ? (
          <div className={classes['status']}>{status}</div>
        ) : (
          <>
            <ResultsContent results={results} table={table} cards={cards}>
              {children}
            </ResultsContent>
            {pagination}
          </>
        )}
      </section>
    </div>
  );
}
