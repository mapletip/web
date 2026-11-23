import { CloseButton, Popover, UnstyledButton } from '@mantine/core';
import {
  Fragment,
  type MouseEvent,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
} from 'react';
import { KeepScale } from 'react-zoom-pan-pinch';

import classes from '@/components/InteractiveMap/InteractiveMap.module.css';
import type {
  InteractiveMapImage,
  InteractiveMapMarker,
} from '@/components/InteractiveMap/types';
import { markerStyle } from '@/components/StaticMap/markerPlacement';

interface InteractiveMarkerProps {
  readonly group: readonly InteractiveMapMarker[];
  readonly image: InteractiveMapImage;
  readonly selected: boolean;
  readonly targetKey: string;
  readonly markerTargetRefs: MutableRefObject<Map<string, HTMLButtonElement>>;
  readonly portalTarget: HTMLDivElement | null;
  readonly details: ReactNode;
  readonly hasDetailsRenderer: boolean;
  readonly detailsOpen: boolean;
  readonly onActivate: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly onCloseDetails: () => void;
}

export function InteractiveMarker({
  group,
  image,
  selected,
  targetKey,
  markerTargetRefs,
  portalTarget,
  details,
  hasDetailsRenderer,
  detailsOpen,
  onActivate,
  onCloseDetails,
}: InteractiveMarkerProps): ReactElement {
  const markerIds = group.map(({ id }) => id);
  const label =
    group.length === 1
      ? group[0]!.label
      : `${group.map(({ label: markerLabel }) => markerLabel).join(', ')} (${group.length})`;
  const markerContent = group.map(({ content, id }) => (
    <Fragment key={id}>{content}</Fragment>
  ));
  const stageBoundary =
    portalTarget === null ? true : { boundary: portalTarget };
  const stageShiftBoundary =
    portalTarget === null ? true : { boundary: portalTarget, crossAxis: true };
  // Mantine handles Escape from the dropdown; mirror it on the trigger.
  const markerButton = (
    <UnstyledButton
      type="button"
      ref={(element) => {
        if (element === null) markerTargetRefs.current.delete(targetKey);
        else markerTargetRefs.current.set(targetKey, element);
      }}
      className={classes['markerButton']}
      data-marker-id={markerIds.length === 1 ? markerIds[0] : undefined}
      data-marker-ids={markerIds.join(' ')}
      data-selected={selected ? 'true' : undefined}
      aria-label={label}
      aria-pressed={selected}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && detailsOpen) {
          event.preventDefault();
          onCloseDetails();
        }
      }}
    >
      <span className={classes['markerContent']}>{markerContent}</span>
    </UnstyledButton>
  );
  const markerAnchor = (target: ReactNode): ReactElement => (
    <span
      className={classes['marker']}
      data-marker-position={markerIds[0]}
      style={markerStyle({
        x: group[0]!.x,
        y: group[0]!.y,
        imageWidth: image.width,
        imageHeight: image.height,
      })}
    >
      <KeepScale className={classes['markerTarget']}>{target}</KeepScale>
    </span>
  );

  if (!hasDetailsRenderer) return markerAnchor(markerButton);

  return (
    <Popover
      opened={detailsOpen}
      onChange={(opened) => {
        if (!opened) onCloseDetails();
      }}
      position="bottom"
      middlewares={{
        flip: stageBoundary,
        shift: stageShiftBoundary,
        size: stageBoundary,
      }}
      preventPositionChangeWhenVisible={false}
      floatingStrategy="absolute"
      portalProps={portalTarget === null ? {} : { target: portalTarget }}
      closeOnEscape
      returnFocus
    >
      {markerAnchor(<Popover.Target>{markerButton}</Popover.Target>)}
      <Popover.Dropdown className={classes['detailsDropdown']}>
        <CloseButton
          type="button"
          className={classes['detailsClose']}
          aria-label="Close details"
          onClick={onCloseDetails}
        />
        <div className={classes['detailsContent']}>{details}</div>
      </Popover.Dropdown>
    </Popover>
  );
}
