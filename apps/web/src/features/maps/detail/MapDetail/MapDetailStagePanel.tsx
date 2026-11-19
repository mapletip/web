import type { ReactElement, ReactNode } from 'react';

import type { MapDetailFocus } from '../focus';
import type { MapDetailView } from '../project';

import classes from './MapDetail.module.css';
import { MapDetailFind } from './MapDetailFind';
import { MapDetailLegend } from './MapDetailLegend';
import { MapDetailStage } from './MapDetailStage';

export function MapDetailStagePanel({
  view,
  focus,
  selectedIds,
  interactive,
  wheelZoom = false,
  expanded = false,
  onActivate,
  onActivateMarkers,
  renderDetails,
}: {
  readonly view: MapDetailView;
  readonly focus: MapDetailFocus | undefined;
  readonly selectedIds: readonly string[];
  readonly interactive: boolean;
  readonly wheelZoom?: boolean;
  readonly expanded?: boolean;
  readonly onActivate: (focusKey: string, modified?: boolean) => void;
  readonly onActivateMarkers: (markerIds: readonly string[]) => void;
  readonly renderDetails: (markerIds: readonly string[]) => ReactNode;
}): ReactElement {
  return (
    <div
      className={classes['stagePanel']}
      data-expanded={expanded ? 'true' : undefined}
      data-testid="map-detail-stage-panel"
    >
      <div className={classes['stageWithFind']}>
        <MapDetailStage
          stage={view.stage}
          interactive={interactive}
          wheelZoom={wheelZoom}
          selectedIds={selectedIds}
          onActivate={onActivateMarkers}
          renderDetails={renderDetails}
        />
        <MapDetailFind entities={view.entities} onChoose={onActivate} />
      </div>
      <MapDetailLegend
        entities={view.entities}
        focus={focus}
        onActivate={onActivate}
      />
    </div>
  );
}
