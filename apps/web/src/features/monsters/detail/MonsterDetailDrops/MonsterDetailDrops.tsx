import { Group, Stack, Text, Title } from '@mantine/core';
import { EntityChip } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';
import { DropCertaintyDisclosure } from '@/features/monsters/shared/DropCertaintyDisclosure';
import { DropCertaintyLegend } from '@/features/monsters/shared/DropCertaintyLegend';

import type { MonsterDetailDropsView } from '../project';

import classes from './MonsterDetailDrops.module.css';

export interface MonsterDetailDropsProps {
  readonly drops: MonsterDetailDropsView;
  readonly buildId: BuildId;
}

/** Render every projected drop, preserving the SDK's within-group order. */
export function MonsterDetailDrops({
  drops,
  buildId,
}: MonsterDetailDropsProps): ReactElement {
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
                <EntityChip
                  key={`${entry.name}:${entry.assertionKind}:${entry.sourceBuild ?? ''}:${index}`}
                  name={entry.name}
                  {...(entry.iconUrl === undefined
                    ? {}
                    : { iconSrc: entry.iconUrl })}
                  trailing={
                    <DropCertaintyDisclosure
                      itemName={entry.name}
                      assertionKind={entry.assertionKind}
                      {...(entry.sourceBuild === undefined
                        ? {}
                        : { sourceBuild: entry.sourceBuild })}
                      buildId={buildId}
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
