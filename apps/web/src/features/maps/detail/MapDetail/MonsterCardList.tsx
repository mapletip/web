import { Button, Group, Select, Stack, Text, Tooltip } from '@mantine/core';
import { MapPin } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import { DetailCardList } from '@/features/detail';
import {
  MONSTER_RECORD_CARD_DENSITY,
  MonsterRecordCard,
} from '@/features/monsters/shared';

import {
  comparatorForMapDetailMonsters,
  type MapDetailMonsterSort,
  type MapDetailMonstersView,
} from '../project';

import classes from './MonsterCardList.module.css';

const monsterSortOptions = [
  { label: 'Level: Low to high', value: 'level' },
  { label: 'Spawns: Most to fewest', value: 'spawns' },
  { label: 'Name: A to Z', value: 'name' },
] as const satisfies readonly {
  label: string;
  value: MapDetailMonsterSort;
}[];

export function MonsterCardList({
  monsters,
  onLocate,
}: {
  readonly monsters: MapDetailMonstersView;
  readonly onLocate: (focusKey: string) => void;
}): ReactElement {
  const [sort, setSort] = useState<MapDetailMonsterSort>('level');
  const hasSort = monsters.monsters.length >= 7;
  const sortedMonsters = useMemo(
    () => [...monsters.monsters].sort(comparatorForMapDetailMonsters({ sort })),
    [monsters.monsters, sort],
  );
  return (
    <Stack gap="md">
      {monsters.notice === undefined ? null : <Text>{monsters.notice}</Text>}
      {monsters.summary === undefined ? null : <Text>{monsters.summary}</Text>}
      {hasSort ? (
        <div className={classes['sort']}>
          <Select
            aria-label="Sort monsters"
            value={sort}
            data={monsterSortOptions.map(({ label, value }) => ({
              label,
              value,
            }))}
            onChange={(value) => {
              if (value !== null) setSort(value);
            }}
          />
        </div>
      ) : null}
      <DetailCardList
        items={sortedMonsters}
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
