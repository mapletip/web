import { Text, VisuallyHidden } from '@mantine/core';
import { useEffect, useState, type ReactElement } from 'react';

export interface SummaryProps {
  readonly text: string;
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
