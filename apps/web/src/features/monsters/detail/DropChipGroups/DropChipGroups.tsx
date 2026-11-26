import { Group, Stack, Text, Title } from '@mantine/core';
import type { ReactElement } from 'react';

import { ItemRecordChip } from '@/features/items/shared';
import {
  DropCertaintyDisclosure,
  DropCertaintyLegend,
} from '@/features/monsters/shared';

import type { MonsterDetailDropsView } from '../project';

import classes from './DropChipGroups.module.css';

export interface DropChipGroupsProps {
  readonly drops: MonsterDetailDropsView;
}

/** Render every projected drop, preserving the SDK's within-group order. */
export function DropChipGroups({ drops }: DropChipGroupsProps): ReactElement {
  if (drops.state === 'no-recorded') {
    return <Text size="sm">No recorded drop information.</Text>;
  }

  if (drops.state === 'unavailable') {
    return <Text size="sm">Drop information is unavailable.</Text>;
  }

  return (
    <Stack className={classes['root']} gap="md">
      <DropCertaintyLegend />
      <Stack className={classes['groups']} gap="md">
        {drops.groups.map((group) => (
          <section className={classes['group']} key={group.id}>
            <Title order={3} size="sm" className={classes['heading']}>
              {group.label} ({group.count})
            </Title>
            <Group className={classes['items']} gap="xs">
              {group.entries.map((entry, index) => (
                <ItemRecordChip
                  key={`${entry.name}:${index}`}
                  item={entry}
                  trailing={
                    <DropCertaintyDisclosure
                      itemName={entry.name}
                      confirmed={entry.confirmed}
                      sources={entry.sources}
                    />
                  }
                />
              ))}
            </Group>
          </section>
        ))}
      </Stack>
    </Stack>
  );
}
