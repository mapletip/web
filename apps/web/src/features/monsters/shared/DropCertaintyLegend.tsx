import { Group, Text } from '@mantine/core';
import { Check, Question } from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import classes from './drop-certainty.module.css';

/** Shared legend for Monster drop certainty markers. */
export function DropCertaintyLegend(): ReactElement {
  return (
    <Group
      gap="md"
      role="group"
      aria-label="Drop certainty legend"
      className={classes['legend']}
    >
      <Group gap={4} wrap="nowrap">
        <span className={classes['certainty']} data-confirmed="true">
          <Check size={14} aria-hidden="true" />
        </span>
        <Text size="xs">Confirmed</Text>
      </Group>
      <Group gap={4} wrap="nowrap">
        <span className={classes['certainty']} data-confirmed="false">
          <Question size={14} aria-hidden="true" />
        </span>
        <Text size="xs">Unconfirmed</Text>
      </Group>
    </Group>
  );
}
