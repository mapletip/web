import { Group, SegmentedControl, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import type { MonsterLocationSort } from './location-cards';

export function MonsterLocationSortControl({
  value,
  onChange,
}: {
  readonly value: MonsterLocationSort;
  readonly onChange: (value: MonsterLocationSort) => void;
}): ReactElement {
  return (
    <Group gap="sm">
      <Text size="sm" fw={500} component="span">
        Order by
      </Text>
      <SegmentedControl
        aria-label="Order locations"
        value={value}
        onChange={onChange}
        data={[
          { label: 'Spawns', value: 'spawns' },
          { label: 'Map name', value: 'name' },
        ]}
      />
    </Group>
  );
}
