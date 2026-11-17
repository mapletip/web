import { Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import { MapPin } from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import { DetailCardList } from '@/features/detail';
import {
  MONSTER_RECORD_CARD_DENSITY,
  MonsterRecordCard,
} from '@/features/monsters/shared';

import { isMapDetailEntityFocused, type MapDetailFocus } from '../focus';
import type { MapDetailMonstersView } from '../project';

import classes from './MapDetailMonsters.module.css';

export function MapDetailMonsters({
  monsters,
  focus,
  onLocate,
}: {
  readonly monsters: MapDetailMonstersView;
  readonly focus: MapDetailFocus | undefined;
  readonly onLocate: (focusKey: string) => void;
}): ReactElement {
  return (
    <Stack gap="md">
      {monsters.notice === undefined ? null : <Text>{monsters.notice}</Text>}
      {monsters.summary === undefined ? null : <Text>{monsters.summary}</Text>}
      <DetailCardList
        items={monsters.monsters}
        getKey={(monster) => monster.key}
        density={MONSTER_RECORD_CARD_DENSITY}
        itemTestId="map-monster-card"
        renderItem={(monster) => (
          <MonsterRecordCard monster={monster}>
            <Group gap="xs" wrap="wrap">
              {monster.canLocate ? (
                <Tooltip
                  label="Locate"
                  openDelay={300}
                  events={{ hover: true, focus: true, touch: true }}
                >
                  <Button
                    type="button"
                    variant="subtle"
                    size="xs"
                    aria-label={monster.locateAccessibleName}
                    data-selected={
                      isMapDetailEntityFocused({
                        focus,
                        focusKey: monster.focusKey,
                        kind: 'monster',
                      })
                        ? 'true'
                        : 'false'
                    }
                    className={classes['locateButton']}
                    onClick={() => onLocate(monster.focusKey)}
                  >
                    <span className={classes['locateVisual']}>
                      <MapPin
                        className={classes['locatePin']}
                        aria-hidden="true"
                        size={16}
                        weight="fill"
                      />
                      <span className={classes['spawnCount']}>
                        {monster.spawnCountLabel}
                      </span>
                    </span>
                  </Button>
                </Tooltip>
              ) : (
                <Text size="sm" className={classes['spawnCount']}>
                  {monster.spawnCountLabel}
                </Text>
              )}
              {monster.respawnLabel === undefined ? null : (
                <Text size="sm">{monster.respawnLabel}</Text>
              )}
            </Group>
          </MonsterRecordCard>
        )}
      />
    </Stack>
  );
}
