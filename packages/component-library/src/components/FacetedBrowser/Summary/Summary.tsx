import { Text, VisuallyHidden } from '@mantine/core';
import { useEffect, useState, type ReactElement } from 'react';

export interface SummaryProps {
  readonly text: string;
}

/**
 * The one place the two summary shapes are formatted: the visible page window
 * (`1–25 of 98 records`) by default, or the total-only count (`98 records`) when a
 * host opts in.
 */
export function formatSummaryText({
  mode,
  pageStart,
  pageEnd,
  total,
  noun,
}: {
  readonly mode: 'page-window' | 'total';
  readonly pageStart: number;
  readonly pageEnd: number;
  readonly total: number;
  readonly noun: string;
}): string {
  return mode === 'total'
    ? `${total.toLocaleString('en-US')} ${noun}`
    : `${pageStart}–${pageEnd} of ${total} ${noun}`;
}

/** Visible range plus one delayed polite announcement per committed query. */
export function Summary({ text }: SummaryProps): ReactElement {
  const [announced, setAnnounced] = useState(text);

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnnounced(text), 450);
    return () => window.clearTimeout(timeout);
  }, [text]);

  return (
    <>
      <Text size="sm" c="dimmed" fw={500} aria-hidden="true">
        {text}
      </Text>
      <VisuallyHidden aria-live="polite" aria-atomic="true">
        {announced}
      </VisuallyHidden>
    </>
  );
}
