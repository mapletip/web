import { Image } from '@mantine/core';
import { RecordCard } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import type { MonsterDetailLocationMapView } from '../project';

import classes from './MapRecordCard.module.css';

export interface MapRecordCardProps {
  readonly map: MonsterDetailLocationMapView;
}

/** Map-specific presentation for a monster's location record. */
export function MapRecordCard({ map }: MapRecordCardProps): ReactElement {
  return (
    <RecordCard
      layout="mediaAside"
      title={map.name}
      secondaryLine={map.geographyLine}
      media={
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
        )
      }
      footer={
        <span className={classes['spawnCount']}>
          <strong>{map.placementCount.toLocaleString('en-US')}</strong>{' '}
          {map.placementCount === 1 ? 'spawn' : 'spawns'}
        </span>
      }
    />
  );
}
