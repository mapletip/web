import { Group, Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import classes from '@/components/EntityOption/EntityOption.module.css';
import type { EntityOptionProps } from '@/components/EntityOption/types';

export function EntityOption({
  icon,
  label,
  description,
}: EntityOptionProps): ReactElement {
  return (
    <Group align="center" gap="xs" wrap="nowrap">
      <span aria-hidden="true" className={classes['iconSlot']}>
        {icon}
      </span>
      <Stack gap={0}>
        <Text size="sm">{label}</Text>
        {description === undefined ? null : (
          <Text c="dimmed" size="xs">
            {description}
          </Text>
        )}
      </Stack>
    </Group>
  );
}
