import { Group, Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import type { MonsterBrowseRelation } from './MonsterBrowseActions';
import { MonsterSprite } from './MonsterSprite';
import type { MonsterBrowseRow } from './project';

export function MonsterBrowseDrawerTitle({
  record,
  relation = 'drops',
}: {
  readonly record: MonsterBrowseRow;
  readonly relation?: MonsterBrowseRelation;
}): ReactElement {
  const levelLabel =
    record.level === undefined ? 'Level unknown' : `Level ${record.level}`;

  return (
    <Group gap="sm" wrap="nowrap">
      <MonsterSprite sprite={record.sprite} />
      <Stack gap={0}>
        <Text fw={600}>{record.name}</Text>
        <Text size="xs" c="dimmed">
          {relation === 'locations' ? 'Locations' : levelLabel}
        </Text>
      </Stack>
    </Group>
  );
}
