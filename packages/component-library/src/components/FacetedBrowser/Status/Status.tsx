import { Alert, Button, EmptyState, Stack, Text } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

export interface StatusProps {
  readonly status: ReactNode;
  readonly loading: boolean;
  readonly error: ReactNode;
  readonly unavailable: ReactNode;
  readonly emptyState: ReactNode;
  readonly totalCount: number;
  /** Whether a search term or filter can be cleared to recover results. */
  readonly hasActiveQuery: boolean;
  readonly recordNoun: string;
  readonly onRetry: (() => void) | undefined;
  readonly onClearFilters: () => void;
}

function capitalizeFirst(value: string): string {
  return value.length === 0
    ? value
    : `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function hasStatus({
  status,
  loading,
  error,
  unavailable,
}: Pick<StatusProps, 'status' | 'loading' | 'error' | 'unavailable'>): boolean {
  return (
    loading ||
    (status !== undefined && status !== null) ||
    (error !== undefined && error !== null) ||
    (unavailable !== undefined && unavailable !== null)
  );
}

/** Selects the explicit status, otherwise the loading/error/unavailable/empty result state. */
export function Status({
  status,
  loading,
  error,
  unavailable,
  emptyState,
  totalCount,
  hasActiveQuery,
  recordNoun,
  onRetry,
  onClearFilters,
}: StatusProps): ReactElement | null {
  if (status !== undefined && status !== null) return <>{status}</>;

  if (loading) {
    return (
      <Text role="status" aria-busy="true">
        Loading {recordNoun}…
      </Text>
    );
  }

  if (error !== undefined && error !== null) {
    return (
      <Alert title={`Could not load ${recordNoun}`} role="alert">
        <Stack gap="sm" align="flex-start">
          <div>{error}</div>
          {onRetry ? (
            <Button type="button" variant="default" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </Stack>
      </Alert>
    );
  }

  if (unavailable !== undefined && unavailable !== null) {
    return (
      <Alert title={`${capitalizeFirst(recordNoun)} are unavailable`}>
        {unavailable}
      </Alert>
    );
  }

  if (totalCount > 0) return null;
  if (emptyState !== undefined && emptyState !== null) {
    return <>{emptyState}</>;
  }

  if (!hasActiveQuery) {
    // No constraint can be cleared: the dataset itself is empty. Offering
    // "Clear filters" here would be a nonfunctional recovery action.
    return (
      <EmptyState title={`No ${recordNoun} available`}>
        <EmptyState.Description style={{ color: 'var(--mantine-color-text)' }}>
          This build does not contain any {recordNoun} yet.
        </EmptyState.Description>
      </EmptyState>
    );
  }

  return (
    <EmptyState title={`No ${recordNoun} match`}>
      <EmptyState.Description style={{ color: 'var(--mantine-color-text)' }}>
        No {recordNoun} match the current search and filters. Remove a filter or
        try another search.
      </EmptyState.Description>
      <EmptyState.Actions>
        <Button
          type="button"
          variant="default"
          w="fit-content"
          onClick={onClearFilters}
        >
          Clear filters
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}
