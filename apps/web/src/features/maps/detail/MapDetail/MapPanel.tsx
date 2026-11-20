import type { InteractiveMapView } from '@mapletip/component-library';
import type { ReactElement, ReactNode } from 'react';

import type { MapDetailFocus } from '../focus';
import type { MapDetailView } from '../project';

import { FindCombobox } from './FindCombobox';
import classes from './MapDetail.module.css';
import { MapStage } from './MapStage';
import { MarkerLegend } from './MarkerLegend';

export function MapPanel({
  view,
  hasStageImage,
  focus,
  selectedIds,
  interactive,
  gestures,
  wheelZoom = false,
  expanded = false,
  stageView,
  onViewChange,
  findText,
  onFindTextChange,
  onActivate,
  onActivateMarkers,
  renderDetails,
}: {
  readonly view: MapDetailView;
  readonly hasStageImage: boolean;
  readonly focus: MapDetailFocus | undefined;
  readonly selectedIds: readonly string[];
  readonly interactive: boolean;
  readonly gestures: boolean;
  readonly wheelZoom?: boolean;
  readonly expanded?: boolean;
  readonly stageView?: InteractiveMapView | undefined;
  readonly onViewChange: (view: InteractiveMapView | undefined) => void;
  readonly findText: string;
  readonly onFindTextChange: (findText: string) => void;
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
        <MapStage
          stage={view.stage}
          className={expanded ? classes['expandedStage'] : undefined}
          interactive={interactive}
          gestures={gestures}
          wheelZoom={wheelZoom}
          view={stageView}
          onViewChange={onViewChange}
          selectedIds={selectedIds}
          onActivate={onActivateMarkers}
          renderDetails={renderDetails}
        />
        {hasStageImage ? (
          <FindCombobox
            entities={view.entities}
            findText={findText}
            onFindTextChange={onFindTextChange}
            onChoose={onActivate}
          />
        ) : null}
      </div>
      {hasStageImage ? (
        <MarkerLegend
          entities={view.entities}
          focus={focus}
          onActivate={onActivate}
        />
      ) : null}
    </div>
  );
}
