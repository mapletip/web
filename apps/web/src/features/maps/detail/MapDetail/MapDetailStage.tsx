import { Stack, Text } from '@mantine/core';
import { MarkerStage } from '@mapletip/component-library';
import type { ReactElement, ReactNode } from 'react';

import type { MapDetailStageView } from '../project';

import { MarkerContent } from './markers';

export const MAP_IMAGE_UNAVAILABLE_MESSAGE = "Map image isn't available.";

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
          content: <MarkerContent marker={marker} />,
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
