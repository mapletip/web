import { Group, Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import { MonsterSprite } from '../../MonsterSprite';
import type { MonsterBrowseRow } from '../../project';

/**
 * Drawer heading for a monster's drops: the identity the card already shows,
 * so the shared drawer names the selected record without domain copy in the
 * component library.
 */
export function MonsterDropTitle({
  record,
}: {
  readonly record: MonsterBrowseRow;
}): ReactElement {
  const levelLabel =
    record.level === undefined ? 'Level unknown' : `Level ${record.level}`;

  return (
    <Group gap="sm" wrap="nowrap">
      <MonsterSprite sprite={record.sprite} />
      <Stack gap={0}>
        <Text fw={600}>{record.name}</Text>
        <Text size="xs" c="dimmed">
          {levelLabel}
        </Text>
      </Stack>
    </Group>
  );
}
