import { Stack } from '@mantine/core';
import type { ReactElement } from 'react';

import { DetailCardList } from '@/features/detail';
import { NPC_RECORD_CARD_DENSITY, NpcRecordCard } from '@/features/npcs/shared';

import type { MapDetailNpcsView } from '../project';

export function NpcCardList({
  npcs,
}: {
  readonly npcs: MapDetailNpcsView;
}): ReactElement {
  return (
    <Stack gap="md">
      <DetailCardList
        items={npcs.npcs}
        getKey={(npc) => npc.key}
        density={NPC_RECORD_CARD_DENSITY}
        equalHeightRows
        itemTestId="map-npc-card"
        renderItem={(npc) => <NpcRecordCard npc={npc} />}
      />
    </Stack>
  );
}
