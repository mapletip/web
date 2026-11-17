import { Stack, Text } from '@mantine/core';
import { MarkerStage, type MarkerStageView } from '@mapletip/component-library';
import { useMemo } from 'react';
import type { ReactElement, ReactNode } from 'react';

import type { MapDetailStageView } from '../project';

import classes from './MapDetail.module.css';
import { MarkerContent } from './markers';

export const MAP_IMAGE_UNAVAILABLE_MESSAGE = "Map image isn't available.";

export function MapDetailStage({
  stage,
  className,
  interactive,
  wheelZoom,
  view,
  onViewChange,
  selectedIds,
  onActivate,
  renderDetails,
}: {
  readonly stage: MapDetailStageView;
  readonly className?: string | undefined;
  readonly interactive: boolean;
  readonly wheelZoom: boolean;
  readonly view?: MarkerStageView | undefined;
  readonly onViewChange: (view: MarkerStageView | undefined) => void;
  readonly selectedIds: readonly string[];
  readonly onActivate: (markerIds: readonly string[]) => void;
  readonly renderDetails: (markerIds: readonly string[]) => ReactNode;
}): ReactElement {
  const markers = useMemo(
    () =>
      stage.markers.map((marker) => ({
        ...marker,
        content: <MarkerContent marker={marker} />,
      })),
    [stage.markers],
  );

  return (
    <Stack className={classes['mapStage']} gap="xs">
      <MarkerStage
        className={className}
        image={stage.image}
        markers={markers}
        connectors={stage.connectors}
        selectedIds={selectedIds}
        onActivate={onActivate}
        renderDetails={renderDetails}
        {...(view === undefined ? {} : { view })}
        onViewChange={onViewChange}
        interactive={interactive}
        wheelZoom={wheelZoom}
        controlsLabel="Map controls"
        fitLabel="Fit map"
        unavailableMessage={MAP_IMAGE_UNAVAILABLE_MESSAGE}
      />
      {stage.positionsUnavailable ? (
        <Text size="sm">Locations on this map aren't available yet.</Text>
      ) : null}
    </Stack>
  );
}
