import { Group, Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import { DetailCardList } from '@/features/detail';
import {
  MONSTER_RECORD_CARD_DENSITY,
  MonsterRecordCard,
} from '@/features/monsters/shared';

import type { MapDetailMonstersView } from '../project';

export function MapDetailMonsters({
  monsters,
}: {
  readonly monsters: MapDetailMonstersView;
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
              <Text size="sm">{monster.spawnCountLabel}</Text>
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
