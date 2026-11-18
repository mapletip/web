import { Badge, Box, Group, Image, Stack, Text } from '@mantine/core';
import { RecordCard } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import { createRecordCardLinkRenderer } from '@/components/RouterLinks';

import type { MapDetailMonstersView } from '../project';

import classes from './RecordCardGrid.module.css';

export function MapDetailMonsters({
  monsters,
}: {
  readonly monsters: MapDetailMonstersView;
}): ReactElement {
  return (
    <Stack gap="md">
      {monsters.notice === undefined ? null : <Text>{monsters.notice}</Text>}
      {monsters.summary === undefined ? null : <Text>{monsters.summary}</Text>}
      {monsters.monsters.length === 0 ? null : (
        <Box component="ul" className={classes['list']}>
          {monsters.monsters.map((monster) => (
            <Box
              component="li"
              className={classes['item']}
              data-testid="map-monster-card"
              key={monster.key}
            >
              <RecordCard
                layout="mediaAside"
                title={monster.name}
                secondaryLine={monster.levelLabel}
                badges={
                  monster.bossLabel === undefined ? undefined : (
                    <Badge size="sm">{monster.bossLabel}</Badge>
                  )
                }
                media={
                  monster.spriteUrl === undefined ? undefined : (
                    <Box className={classes['spriteBox']}>
                      <Image
                        src={monster.spriteUrl}
                        alt=""
                        w={monster.spriteWidth ?? 44}
                        h={monster.spriteHeight ?? 44}
                        fit="contain"
                        loading="lazy"
                        className={classes['sprite']}
                      />
                    </Box>
                  )
                }
                footer={
                  <Group gap="xs" wrap="wrap">
                    <Text size="sm">{monster.spawnCountLabel}</Text>
                    {monster.respawnLabel === undefined ? null : (
                      <Text size="sm">{monster.respawnLabel}</Text>
                    )}
                  </Group>
                }
                {...(monster.destination === undefined
                  ? {}
                  : {
                      destination: { href: monster.destination.href },
                      renderLink: createRecordCardLinkRenderer({
                        to: '/maplestory/{-$buildId}/monsters/$slugId',
                        params: monster.destination.params,
                      }),
                    })}
              />
            </Box>
          ))}
        </Box>
      )}
    </Stack>
  );
}
