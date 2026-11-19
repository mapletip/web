import { Stack, Text } from '@mantine/core';
import { useState } from 'react';
import type { ReactElement } from 'react';

import { DetailCardList } from '@/features/detail';
import { MAP_RECORD_CARD_DENSITY, MapRecordCard } from '@/features/maps/shared';

import {
  mapDetailConnectionMatchesSearch,
  type MapDetailConnectionsView,
} from '../project';

export interface MapDetailConnectionsProps {
  readonly connections: MapDetailConnectionsView;
}

/** Display the projected connection state and its map cards. */
export function MapDetailConnections({
  connections,
}: MapDetailConnectionsProps): ReactElement {
  const [query, setQuery] = useState('');
  const hasSearch = connections.maps.length >= 7;
  return (
    <Stack gap="md">
      {connections.notice === undefined ? null : (
        <Text>{connections.notice}</Text>
      )}
      <DetailCardList
        items={connections.maps}
        getKey={(map) => map.key}
        density={MAP_RECORD_CARD_DENSITY}
        renderItem={(map) => <MapRecordCard map={map} />}
        itemTestId="map-connection-card"
        {...(hasSearch
          ? {
              search: {
                label: 'Search connected maps',
                placeholder: 'Map name',
                noMatchesMessage: 'No connected maps match.',
                value: query,
                onChange: setQuery,
                matches: mapDetailConnectionMatchesSearch,
                countMessage: (matchingCount, totalCount) =>
                  query.trim().length === 0 ? null : (
                    <Text>
                      Showing {matchingCount.toLocaleString('en-US')} of{' '}
                      {totalCount.toLocaleString('en-US')} connected maps
                    </Text>
                  ),
              },
            }
          : {})}
      />
    </Stack>
  );
}
