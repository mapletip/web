import { Button, Group, Loader, Stack, Text } from '@mantine/core';
import { useEffect, useState, type ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';
import { DetailCardList } from '@/features/detail';
import { MapRecordCard, MAP_RECORD_CARD_DENSITY } from '@/features/maps/shared';

import {
  compareMonsterLocations,
  type MonsterLocationSort,
} from '../shared/location-cards';
import { MonsterLocationSortControl } from '../shared/MonsterLocationSortControl';

import {
  projectBrowseLocationCards,
  type MonsterBrowseLocationMap,
  type MonsterLocationReader,
} from './locations';
import type { MonsterBrowseRow } from './project';

export function MonsterLocationListing({
  record,
  buildId,
  reader,
}: {
  readonly record: MonsterBrowseRow;
  readonly buildId: BuildId;
  readonly reader: MonsterLocationReader;
}): ReactElement {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<MonsterLocationSort>('spawns');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<
    | { readonly maps: readonly MonsterBrowseLocationMap[] }
    | { readonly retry: () => void }
  >();

  useEffect(() => {
    let active = true;
    const request = reader.read();
    void request
      .then((browse) => {
        if (!active) return;
        setResult({
          maps: projectBrowseLocationCards(browse, record, buildId),
        });
      })
      .catch(() => {
        if (!active) return;
        setResult({
          retry: () => {
            reader.forget(request);
            setResult(undefined);
            setAttempt((count) => count + 1);
          },
        });
      });

    return () => {
      active = false;
    };
  }, [attempt, buildId, reader, record]);

  let list: ReactElement;
  if (result === undefined) {
    list = (
      <Group gap="xs" role="status">
        <Loader size="xs" aria-hidden="true" />
        <Text size="sm">Loading locations…</Text>
      </Group>
    );
  } else if ('retry' in result) {
    list = (
      <Stack gap="xs" align="flex-start">
        <Text size="sm" role="alert">
          Locations could not be loaded.
        </Text>
        <Button variant="default" size="compact-sm" onClick={result.retry}>
          Retry
        </Button>
      </Stack>
    );
  } else {
    const maps =
      sort === 'spawns'
        ? result.maps
        : result.maps
            .slice()
            .sort((left, right) => compareMonsterLocations(left, right, sort));
    list = (
      <Stack gap="md">
        {maps.length > 1 ? (
          <MonsterLocationSortControl value={sort} onChange={setSort} />
        ) : null}
        <DetailCardList<MonsterBrowseLocationMap>
          items={maps}
          getKey={(map) => map.key}
          density={MAP_RECORD_CARD_DENSITY}
          itemTestId="monster-browse-location-card"
          equalHeightRows
          listLabel="Recorded maps"
          renderItem={(map) => (
            <MapRecordCard
              map={{ ...map, minimapPreview: false }}
              preloadLink={false}
            />
          )}
          {...(result.maps.length <= 3
            ? {}
            : {
                search: {
                  label: 'Find a map',
                  placeholder: 'Map or street name',
                  noMatchesMessage: 'No maps match your search',
                  matches: (map, normalizedQuery) =>
                    normalizedQuery === '' ||
                    map.publishedName
                      ?.toLocaleLowerCase('en')
                      .includes(normalizedQuery) === true ||
                    map.secondaryLine
                      ?.toLocaleLowerCase('en')
                      .includes(normalizedQuery) === true,
                  value: query,
                  onChange: setQuery,
                },
              })}
        />
      </Stack>
    );
  }
  return (
    <Stack gap="sm">
      {record.locations.state === 'unresolved' ? (
        <Text size="sm">
          Location data is incomplete. Only resolved maps are shown.
        </Text>
      ) : null}
      {list}
    </Stack>
  );
}
