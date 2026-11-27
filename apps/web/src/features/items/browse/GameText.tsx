import { Text } from '@mantine/core';
import type { ReactNode } from 'react';

import type { GameTextSegment } from './game-text';

export function GameText({
  segments,
}: {
  readonly segments: readonly GameTextSegment[];
}): ReactNode {
  return segments.map(({ text, emphasis }, index) =>
    emphasis ? (
      <Text key={index} span fw={600} c="var(--mapletip-color-brand-text)">
        {text}
      </Text>
    ) : (
      text
    ),
  );
}
