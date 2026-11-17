import { HoverCard, Image } from '@mantine/core';
import { RecordCard } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import type { MonsterDetailLocationMapView } from '../project';

import classes from './MapRecordCard.module.css';

export interface MapRecordCardProps {
  readonly map: MonsterDetailLocationMapView;
  readonly canHoverMinimap: boolean;
}

/** Map-specific presentation for a monster's location record. */
export function MapRecordCard({
  map,
  canHoverMinimap,
}: MapRecordCardProps): ReactElement {
  const minimap =
    map.minimapUrl === undefined ? undefined : (
      <div className={classes['minimapWell']} data-map-minimap="true">
        <Image
          src={map.minimapUrl}
          alt={`${map.name} minimap`}
          w="100%"
          h="100%"
          fit="contain"
          loading="lazy"
        />
      </div>
    );

  return (
    <RecordCard
      layout="mediaAside"
      title={map.name}
      secondaryLine={map.geographyLine}
      media={
        minimap === undefined || !canHoverMinimap ? (
          minimap
        ) : (
          <HoverCard
            openDelay={350}
            closeDelay={120}
            position="top"
            offset={8}
            withinPortal
            shadow="lg"
            role="tooltip"
          >
            <HoverCard.Target>
              <button
                type="button"
                className={classes['minimapTrigger']}
                aria-label={`Enlarge ${map.name} minimap`}
              >
                {minimap}
              </button>
            </HoverCard.Target>
            <HoverCard.Dropdown
              className={classes['minimapPopover']}
              aria-label={`${map.name} full-size minimap preview`}
            >
              <Image
                src={map.minimapUrl}
                alt={`${map.name} minimap enlarged`}
                className={classes['expandedMinimap']}
              />
            </HoverCard.Dropdown>
          </HoverCard>
        )
      }
      footer={
        <span
          className={classes['spawnCount']}
          data-testid="monster-location-spawn-count"
        >
          <strong>{map.placementCount.toLocaleString('en-US')}</strong>{' '}
          {map.placementCount === 1 ? 'spawn' : 'spawns'}
        </span>
      }
    />
  );
}
