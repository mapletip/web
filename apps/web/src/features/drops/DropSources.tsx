import { Anchor, Text } from '@mantine/core';
import { Fragment, type ReactElement } from 'react';

import type { DropSource } from './drop-sources';

export interface DropSourcesProps {
  readonly sources: readonly DropSource[];
}

/** One line naming a drop's sources; a source with a link opens it in a new tab. */
export function DropSources({
  sources,
}: DropSourcesProps): ReactElement | null {
  if (sources.length === 0) return null;
  return (
    <Text size="xs" c="dimmed">
      {sources.length === 1 ? 'Source' : 'Sources'}:{' '}
      {sources.map((source, index) => (
        <Fragment key={`${source.label}:${index}`}>
          {index === 0 ? null : ', '}
          {source.href === undefined ? (
            source.label
          ) : (
            <Anchor
              size="xs"
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.label}
            </Anchor>
          )}
        </Fragment>
      ))}
      .
    </Text>
  );
}
