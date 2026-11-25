import {
  Box,
  Button,
  Drawer,
  Group,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Thumbnail } from '@mapletip/component-library';
import { CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';

import { DetailCardList } from '@/features/detail';
import { MAP_RECORD_CARD_DENSITY, MapRecordCard } from '@/features/maps/shared';

import {
  compareMonsterLocations,
  type MonsterLocationSort,
} from '../../shared/location-cards';
import { MonsterLocationSortControl } from '../../shared/MonsterLocationSortControl';
import type { MonsterDetailLocationsView } from '../project';

import classes from './LocationCardList.module.css';

export interface LocationCardListProps {
  readonly locations: MonsterDetailLocationsView;
  readonly monsterName: string;
  readonly monsterSpriteUrl: string | undefined;
  readonly drawerOpened: boolean;
  readonly onDrawerOpen: () => void;
  readonly onDrawerClose: () => void;
}

function drawerTitle(
  monsterName: string,
  monsterSpriteUrl: string | undefined,
): ReactElement {
  return (
    <Group className={classes['drawerTitle']} gap="sm" wrap="nowrap">
      <Box className={classes['drawerPortrait']}>
        <Thumbnail src={monsterSpriteUrl} size={44} alt="" />
      </Box>
      <Stack className={classes['drawerTitleCopy']} gap={0}>
        <Text component="span" fw={600} size="md">
          All maps
        </Text>
        <Text component="span" size="sm" c="dimmed">
          {monsterName}
        </Text>
      </Stack>
    </Group>
  );
}

const MOBILE_CAP = 5;
const DESKTOP_CAP = 10;

/** Locations cards with responsive initial caps and whole-list controls. */
export function LocationCardList({
  locations,
  monsterName,
  monsterSpriteUrl,
  drawerOpened,
  onDrawerOpen,
  onDrawerClose,
}: LocationCardListProps): ReactElement {
  const locationsId = useId();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<MonsterLocationSort>('spawns');
  const desktopDrawer = useMediaQuery('(min-width: 48em)', false);

  if (locations.state === 'no-locations') {
    return <Text>No locations are listed for this monster.</Text>;
  }
  if (locations.state === 'unavailable') {
    return <Text>Location information is unavailable.</Text>;
  }

  const normalizedQuery = query.trim().toLocaleLowerCase('en');
  const maps = locations.maps
    .filter((map) => map.name.toLocaleLowerCase('en').includes(normalizedQuery))
    .sort((left, right) => compareMonsterLocations(left, right, sort));
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
          leftSection={<MagnifyingGlass aria-hidden="true" size={16} />}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <MonsterLocationSortControl value={sort} onChange={setSort} />
      </div>
    );
  }

  function renderMapList(mapList: typeof maps, drawer = false): ReactElement {
    return (
      <DetailCardList
        items={mapList}
        getKey={(map) => map.key}
        density={MAP_RECORD_CARD_DENSITY}
        itemTestId="monster-location-card"
        equalHeightRows
        {...(drawer ? {} : { mobileItemLimit: MOBILE_CAP })}
        renderItem={(map) => (
          <MapRecordCard map={{ ...map, minimapPreview: desktopDrawer }} />
        )}
      />
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
          fullWidth
          variant="default"
          rightSection={<CaretRight aria-hidden="true" size={16} />}
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
          fullWidth
          variant="default"
          rightSection={<CaretRight aria-hidden="true" size={16} />}
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
        title={drawerTitle(monsterName, monsterSpriteUrl)}
        position={desktopDrawer ? 'right' : 'bottom'}
        size={desktopDrawer ? '75vw' : '94dvh'}
        radius={desktopDrawer ? 0 : 'md'}
        closeButtonProps={{ 'aria-label': 'Close map list' }}
      >
        <Stack gap="md">
          {showControls ? renderControls('drawer') : null}
          {maps.length === 0 ? (
            <Text role="status">No maps match your search.</Text>
          ) : (
            renderMapList(maps, true)
          )}
        </Stack>
      </Drawer>
    </Stack>
  );
}
