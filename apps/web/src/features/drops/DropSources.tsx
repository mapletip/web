import { Anchor, Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import type { DropSource } from './drop-sources';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

function timeLabel(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export interface DropSourcesProps {
  readonly sources: readonly DropSource[];
}

/** Shared source list for drop evidence across Monster and Item views. */
export function DropSources({
  sources,
}: DropSourcesProps): ReactElement | null {
  if (sources.length === 0) return null;
  if (sources.every(({ observed }) => !observed)) {
    return (
      <Text size="xs" c="dimmed">
        {sources.length === 1 ? 'Source' : 'Sources'}:{' '}
        {sources.map(({ label }) => label).join(', ')}.
      </Text>
    );
  }
  return (
    <Stack gap="xs">
      {sources.length > 1 ? (
        <Text size="xs" c="dimmed">
          Sources:
        </Text>
      ) : null}
      {sources.map((source, index) => (
        <Stack gap={0} key={`${source.label}:${source.buildLabel}:${index}`}>
          <Text size="sm" fw={500}>
            {source.label}
          </Text>
          <Text size="xs" c="dimmed">
            {[
              source.buildLabel,
              source.date === undefined
                ? undefined
                : dateFormatter.format(new Date(`${source.date}T00:00:00Z`)),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {source.href === undefined ? null : (
            <Anchor
              size="xs"
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.startSeconds === undefined
                ? 'Open link'
                : `Open at ${timeLabel(source.startSeconds)}`}
            </Anchor>
          )}
        </Stack>
      ))}
    </Stack>
  );
}
