import {
  Box,
  Button,
  Drawer,
  Image,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { RecordCard } from '@mapletip/component-library';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';

import type { MonsterDetailLocationsView } from '../project';

import classes from './MonsterDetailLocations.module.css';

export interface MonsterDetailLocationsProps {
  readonly locations: MonsterDetailLocationsView;
  readonly drawerOpened: boolean;
  readonly onDrawerOpen: () => void;
  readonly onDrawerClose: () => void;
}

type LocationSort = 'spawns' | 'name';

function drawerTitle(count: number): string {
  return `All ${count} ${count === 1 ? 'map' : 'maps'}`;
}

const MOBILE_CAP = 5;
const DESKTOP_CAP = 10;

/** Locations cards with responsive initial caps and whole-list controls. */
export function MonsterDetailLocations({
  locations,
  drawerOpened,
  onDrawerOpen,
  onDrawerClose,
}: MonsterDetailLocationsProps): ReactElement {
  const locationsId = useId();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LocationSort>('spawns');

  if (locations.state === 'no-locations') {
    return <Text>No locations are listed for this monster.</Text>;
  }
  if (locations.state === 'unavailable') {
    return <Text>Location information is unavailable.</Text>;
  }

  const normalizedQuery = query.trim().toLocaleLowerCase('en');
  const maps = locations.maps
    .filter((map) => map.name.toLocaleLowerCase('en').includes(normalizedQuery))
    .slice()
    .sort((left, right) => {
      if (sort === 'name') {
        return (
          left.name.localeCompare(right.name, 'en', {
            sensitivity: 'base',
            numeric: true,
          }) ||
          right.placementCount - left.placementCount ||
          left.key.localeCompare(right.key)
        );
      }
      return (
        right.placementCount - left.placementCount ||
        left.name.localeCompare(right.name, 'en', { sensitivity: 'base' }) ||
        left.key.localeCompare(right.key)
      );
    });
  const previewMaps = maps.slice(0, DESKTOP_CAP);

  const showControls = locations.maps.length > 3;
  const showMobileExpand = locations.maps.length > MOBILE_CAP;
  const showDesktopExpand = locations.maps.length > DESKTOP_CAP;
  const mobileExpandLabel =
    maps.length > MOBILE_CAP ? `View all ${maps.length} maps` : 'Open map list';
  const desktopExpandLabel =
    maps.length > DESKTOP_CAP
      ? `View all ${maps.length} maps`
      : 'Open map list';

  function renderControls(surface: 'preview' | 'drawer'): ReactElement {
    return (
      <div className={classes['controls']} data-location-controls={surface}>
        <TextInput
          id={`${locationsId}-${surface}-map-search`}
          label="Find a map"
          placeholder="Map name"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <div className={classes['sort']}>
          <Text size="sm" fw={500} component="span">
            Order by
          </Text>
          <SegmentedControl
            aria-label="Order locations"
            value={sort}
            onChange={(value) => setSort(value)}
            data={[
              { label: 'Spawns', value: 'spawns' },
              { label: 'Map name', value: 'name' },
            ]}
          />
        </div>
      </div>
    );
  }

  function renderMapList(mapList: typeof maps, drawer = false): ReactElement {
    return (
      <Box
        component="ul"
        className={classes['list']}
        data-location-drawer={drawer ? 'true' : undefined}
      >
        {mapList.map((map) => (
          <Box
            component="li"
            className={classes['item']}
            data-testid="monster-location-card"
            key={map.key}
          >
            <RecordCard
              title={map.name}
              secondaryLine={map.geographyLine}
              media={
                map.minimapUrl === undefined ? undefined : (
                  <div
                    className={classes['minimapWell']}
                    data-map-minimap="true"
                  >
                    <Image
                      src={map.minimapUrl}
                      alt={`${map.name} minimap`}
                      w="100%"
                      h="100%"
                      fit="contain"
                      loading="lazy"
                    />
                  </div>
                )
              }
              footer={map.placementLabel}
            />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Stack gap="md" className={classes['locations']}>
      {showControls ? renderControls('preview') : null}

      {maps.length === 0 ? (
        <Text role="status">No maps match your search.</Text>
      ) : (
        renderMapList(previewMaps)
      )}

      {showMobileExpand ? (
        <Button
          className={classes['mobileExpand']}
          hiddenFrom="sm"
          variant="light"
          aria-haspopup="dialog"
          aria-expanded={drawerOpened}
          onClick={onDrawerOpen}
        >
          {mobileExpandLabel}
        </Button>
      ) : null}
      {showDesktopExpand ? (
        <Button
          className={classes['desktopExpand']}
          visibleFrom="sm"
          variant="light"
          aria-haspopup="dialog"
          aria-expanded={drawerOpened}
          onClick={onDrawerOpen}
        >
          {desktopExpandLabel}
        </Button>
      ) : null}
      <Drawer
        opened={drawerOpened}
        onClose={onDrawerClose}
        title={drawerTitle(maps.length)}
        position="right"
        size="min(100%, 44rem)"
        closeButtonProps={{ 'aria-label': 'Close map list' }}
      >
        {showControls ? renderControls('drawer') : null}
        {maps.length === 0 ? (
          <Text role="status">No maps match your search.</Text>
        ) : (
          renderMapList(maps, true)
        )}
      </Drawer>
    </Stack>
  );
}
