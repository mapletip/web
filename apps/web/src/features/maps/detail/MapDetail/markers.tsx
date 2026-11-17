import type { ReactElement } from 'react';

import portalImage from '@/assets/maplestory/maps/minimap-portal.png?no-inline';

import type { MapDetailEntityView, MapDetailStageMarker } from '../project';

import classes from './MapDetail.module.css';

export function ConnectionMarker(): ReactElement {
  return (
    <span
      className={`${classes['markerPalette']} ${classes['connectionMarker']}`}
      aria-hidden="true"
      data-marker-visual="connection"
    >
      <img className={classes['portalImage']} src={portalImage} alt="" />
    </span>
  );
}

export function WarpMarker(): ReactElement {
  return (
    <span
      className={`${classes['markerPalette']} ${classes['warpMarker']}`}
      aria-hidden="true"
      data-marker-visual="warp"
    >
      <img
        className={`${classes['portalImage']} ${classes['warpImage']}`}
        src={portalImage}
        alt=""
      />
    </span>
  );
}

export function MonsterMarker({
  spriteUrl,
  inDetails = false,
}: {
  readonly spriteUrl?: string | undefined;
  readonly inDetails?: boolean;
}): ReactElement {
  if (spriteUrl === undefined) {
    return (
      <span
        className={`${classes['markerPalette']} ${classes['monsterDot']}`}
        aria-hidden="true"
        data-marker-visual="monster-dot"
      />
    );
  }

  return (
    <img
      className={`${classes['monsterSprite']} ${inDetails ? classes['detailMonsterSprite'] : classes['stageMonsterSprite']}`}
      src={spriteUrl}
      alt=""
      data-marker-visual="monster-sprite"
    />
  );
}

export function NpcMarker(): ReactElement {
  return (
    <span
      className={`${classes['markerPalette']} ${classes['npcDot']}`}
      aria-hidden="true"
      data-marker-visual="npc-dot"
    />
  );
}

export function MarkerContent({
  marker,
}: {
  readonly marker: MapDetailStageMarker;
}): ReactElement {
  switch (marker.kind) {
    case 'monster':
      return <MonsterMarker spriteUrl={marker.spriteUrl} />;
    case 'npc':
      return <NpcMarker />;
    case 'connection':
      return <ConnectionMarker />;
    case 'warp':
      return <WarpMarker />;
  }
}

export function EntityIcon({
  entity,
}: {
  readonly entity: MapDetailEntityView;
}): ReactElement {
  switch (entity.kind) {
    case 'monster':
      return <MonsterMarker spriteUrl={entity.spriteUrl} inDetails />;
    case 'npc':
      return <NpcMarker />;
    case 'connection':
      return <ConnectionMarker />;
    case 'warp':
      return <WarpMarker />;
  }
}
