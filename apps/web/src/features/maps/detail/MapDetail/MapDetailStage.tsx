import { Stack, Text } from '@mantine/core';
import { MarkerStage, Thumbnail } from '@mapletip/component-library';
import { Bug, DoorOpen, User } from '@phosphor-icons/react';
import type { ReactElement, ReactNode } from 'react';

import type { MapDetailStageMarker, MapDetailStageView } from '../project';

const MONSTER_MARKER_SIZE = 24;
const PORTAL_MARKER_SIZE = 22;
const NPC_MARKER_SIZE = 22;

export const MAP_IMAGE_UNAVAILABLE_MESSAGE = "Map image isn't available.";

function MapDetailMarkerContent({
  marker,
}: {
  readonly marker: MapDetailStageMarker;
}): ReactElement {
  switch (marker.kind) {
    case 'monster':
      return marker.spriteUrl === undefined ? (
        <Bug aria-hidden="true" size={MONSTER_MARKER_SIZE} />
      ) : (
        <Thumbnail src={marker.spriteUrl} size={MONSTER_MARKER_SIZE} alt="" />
      );
    case 'npc':
      return <User aria-hidden="true" size={NPC_MARKER_SIZE} />;
    case 'connection':
    case 'warp':
      return <DoorOpen aria-hidden="true" size={PORTAL_MARKER_SIZE} />;
  }
}

export function MapDetailStage({
  stage,
  interactive = false,
  selectedIds = [],
  onActivate,
  renderDetails,
}: {
  readonly stage: MapDetailStageView;
  readonly interactive?: boolean;
  readonly selectedIds?: readonly string[];
  readonly onActivate?: (markerIds: readonly string[]) => void;
  readonly renderDetails?: (markerIds: readonly string[]) => ReactNode;
}): ReactElement {
  return (
    <Stack gap="xs">
      <MarkerStage
        image={stage.image}
        markers={stage.markers.map((marker) => ({
          ...marker,
          content: <MapDetailMarkerContent marker={marker} />,
        }))}
        connectors={stage.connectors}
        selectedIds={selectedIds}
        {...(onActivate === undefined ? {} : { onActivate })}
        {...(renderDetails === undefined ? {} : { renderDetails })}
        interactive={interactive}
        unavailableMessage={MAP_IMAGE_UNAVAILABLE_MESSAGE}
      />
      {stage.positionsUnavailable ? (
        <Text size="sm">Locations on this map aren't available yet.</Text>
      ) : null}
    </Stack>
  );
}
