import type { ReactElement } from 'react';

import portalImage from '@/assets/maplestory/maps/minimap-portal.png?no-inline';
import { MonsterDot } from '@/features/maps/shared/MonsterDot';
import { SpriteMarker } from '@/features/maps/shared/SpriteMarker';

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
    return <MonsterDot className={classes['markerPalette']} />;
  }

  return (
    <SpriteMarker
      spriteUrl={spriteUrl}
      visual="monster-sprite"
      className={inDetails ? classes['detailSprite'] : classes['stageSprite']}
    />
  );
}

export function NpcMarker({
  spriteUrl,
  inDetails = false,
}: {
  readonly spriteUrl?: string | undefined;
  readonly inDetails?: boolean;
}): ReactElement {
  if (spriteUrl !== undefined) {
    return (
      <SpriteMarker
        spriteUrl={spriteUrl}
        visual="npc-sprite"
        className={inDetails ? classes['detailSprite'] : classes['stageSprite']}
      />
    );
  }

  return (
    <span
      className={`${classes['markerPalette']} ${classes['npcDot']}`}
      aria-hidden="true"
      data-marker-visual="npc-dot"
    />
  );
}

function markerVisual({
  kind,
  spriteUrl,
  inDetails,
}: {
  readonly kind: MapDetailEntityView['kind'];
  readonly spriteUrl?: string | undefined;
  readonly inDetails: boolean;
}): ReactElement {
  switch (kind) {
    case 'monster':
      return <MonsterMarker spriteUrl={spriteUrl} inDetails={inDetails} />;
    case 'npc':
      return <NpcMarker spriteUrl={spriteUrl} inDetails={inDetails} />;
    case 'connection':
      return <ConnectionMarker />;
    case 'warp':
      return <WarpMarker />;
  }
}

export function MarkerContent({
  marker,
}: {
  readonly marker: MapDetailStageMarker;
}): ReactElement {
  return markerVisual({
    kind: marker.kind,
    spriteUrl: marker.spriteUrl,
    inDetails: false,
  });
}

export function EntityIcon({
  entity,
}: {
  readonly entity: MapDetailEntityView;
}): ReactElement {
  return markerVisual({
    kind: entity.kind,
    spriteUrl: entity.spriteUrl,
    inDetails: true,
  });
}
