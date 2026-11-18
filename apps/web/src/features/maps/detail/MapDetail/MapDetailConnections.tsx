import { Box, Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import { MapRecordCard } from '@/features/maps/shared';

import type { MapDetailConnectionsView } from '../project';

import classes from './RecordCardGrid.module.css';

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
      {connections.maps.length === 0 ? null : (
        <Box component="ul" className={classes['list']}>
          {connections.maps.map((map) => (
            <Box
              component="li"
              className={classes['item']}
              data-testid="map-connection-card"
              key={map.key}
            >
              <MapRecordCard map={map} />
            </Box>
          ))}
        </Box>
      )}
    </Stack>
  );
}
