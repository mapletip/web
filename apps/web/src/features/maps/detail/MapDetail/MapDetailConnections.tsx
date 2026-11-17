import { Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import { DetailCardList } from '@/features/detail';
import { MAP_RECORD_CARD_DENSITY, MapRecordCard } from '@/features/maps/shared';

import type { MapDetailConnectionsView } from '../project';

export interface MapDetailConnectionsProps {
  readonly connections: MapDetailConnectionsView;
}

/** Display the projected connection state and its map cards. */
export function MapDetailConnections({
  connections,
}: MapDetailConnectionsProps): ReactElement {
  return (
    <Stack gap="md">
      {connections.notice === undefined ? null : (
        <Text>{connections.notice}</Text>
      )}
      <DetailCardList
        items={connections.maps}
        getKey={(map) => map.key}
        density={MAP_RECORD_CARD_DENSITY}
        itemTestId="map-connection-card"
        renderItem={(map) => <MapRecordCard map={map} />}
      />
    </Stack>
  );
}
