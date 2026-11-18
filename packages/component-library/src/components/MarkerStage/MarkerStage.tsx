import {
  CloseButton,
  Image,
  Popover,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  Fragment,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';

import classes from '@/components/MarkerStage/MarkerStage.module.css';
import type {
  MarkerStageMarker,
  MarkerStageProps,
} from '@/components/MarkerStage/types';

function groupMarkers(
  markers: readonly MarkerStageMarker[],
): MarkerStageMarker[][] {
  const groups = new Map<string, MarkerStageMarker[]>();

  for (const marker of markers) {
    const key = `${marker.x},${marker.y}`;
    let group = groups.get(key);
    if (group === undefined) {
      group = [];
      groups.set(key, group);
    }
    group.push(marker);
  }

  return [...groups.values()];
}

/** One image with host-rendered markers placed at image pixel coordinates. */
export function MarkerStage({
  image,
  markers,
  connectors = [],
  selectedIds = [],
  onActivate,
  interactive = true,
  renderDetails,
  unavailableMessage,
}: MarkerStageProps): ReactElement {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [openDetailsTarget, setOpenDetailsTarget] = useState<string | null>(
    null,
  );
  const src = image?.src;
  const hasSource = src !== undefined && src !== '';
  // Key by source so a replacement image is not treated as the failed one.
  const failed = hasSource && failedSrc === src;
  const availableImage = hasSource && !failed ? image : undefined;
  const accessibleName = availableImage?.alt || unavailableMessage;
  const selectedIdSet = new Set(selectedIds);
  const markersById = new Map(markers.map((marker) => [marker.id, marker]));
  const stageStyle: CSSProperties = {
    aspectRatio:
      availableImage === undefined
        ? '4 / 3'
        : `${availableImage.width} / ${availableImage.height}`,
  };

  return (
    <div
      className={classes['stage']}
      role="group"
      aria-label={accessibleName}
      style={stageStyle}
      data-unavailable={availableImage === undefined ? 'true' : undefined}
    >
      {availableImage ? (
        <>
          <Image
            className={classes['image']}
            src={availableImage.src}
            alt={availableImage.alt}
            width={availableImage.width}
            height={availableImage.height}
            fit="contain"
            onError={() => setFailedSrc(availableImage.src)}
          />
          {connectors.length > 0 ? (
            <svg
              className={classes['connectors']}
              viewBox={`0 0 ${availableImage.width} ${availableImage.height}`}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
              focusable="false"
              pointerEvents="none"
            >
              {connectors.map(({ id, from, to }) => {
                const start = markersById.get(from);
                const end = markersById.get(to);
                if (start === undefined || end === undefined) return null;

                return (
                  <line
                    key={id}
                    className={classes['connector']}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                  />
                );
              })}
            </svg>
          ) : null}
          {groupMarkers(markers).map((group) => {
            const markerIds = group.map(({ id }) => id);
            const targetKey = `${group[0]!.x},${group[0]!.y}`;
            const selected = markerIds.some((id) => selectedIdSet.has(id));
            const details =
              interactive && openDetailsTarget === targetKey
                ? renderDetails?.(markerIds)
                : undefined;
            const hasDetails = details != null && details !== false;
            const detailsOpen = openDetailsTarget === targetKey && hasDetails;
            const label =
              group.length === 1
                ? group[0]!.label
                : `${group.map(({ label: markerLabel }) => markerLabel).join(', ')} (${group.length})`;
            const markerContent = group.map(({ content, id }) => (
              <Fragment key={id}>{content}</Fragment>
            ));
            const markerStyle: CSSProperties = {
              left: `${(group[0]!.x / availableImage.width) * 100}%`,
              top: `${(group[0]!.y / availableImage.height) * 100}%`,
            };
            const markerClassName = [
              classes['marker'],
              interactive ? classes['markerButton'] : classes['markerStatic'],
              selected ? classes['markerSelected'] : undefined,
            ]
              .filter(Boolean)
              .join(' ');
            const markerData = {
              'data-marker-id':
                markerIds.length === 1 ? markerIds[0] : undefined,
              'data-marker-ids': markerIds.join(' '),
              'data-selected': selected ? 'true' : undefined,
              style: markerStyle,
            };
            const activate = () => {
              onActivate?.(markerIds);
              const activationDetails = renderDetails?.(markerIds);
              setOpenDetailsTarget(
                activationDetails != null && activationDetails !== false
                  ? targetKey
                  : null,
              );
            };

            const target = interactive ? (
              <UnstyledButton
                {...markerData}
                type="button"
                className={markerClassName}
                aria-label={label}
                aria-pressed={selected}
                onClick={activate}
                onKeyDown={(event) => {
                  if (event.key === 'Escape' && detailsOpen) {
                    event.preventDefault();
                    setOpenDetailsTarget(null);
                  }
                }}
              >
                {markerContent}
              </UnstyledButton>
            ) : (
              <span
                {...markerData}
                className={markerClassName}
                aria-hidden="true"
                inert
              >
                {markerContent}
              </span>
            );

            if (!interactive || renderDetails === undefined) {
              return <Fragment key={markerIds[0]}>{target}</Fragment>;
            }

            return (
              <Popover
                key={markerIds[0]}
                opened={detailsOpen}
                onChange={(opened) => {
                  if (!opened) setOpenDetailsTarget(null);
                }}
                position="bottom"
                middlewares={{ flip: true, shift: true, size: true }}
                floatingStrategy="absolute"
                withinPortal={false}
                returnFocus
              >
                <Popover.Target>{target}</Popover.Target>
                <Popover.Dropdown className={classes['detailsDropdown']}>
                  <CloseButton
                    type="button"
                    className={classes['detailsClose']}
                    aria-label="Close details"
                    onClick={() => setOpenDetailsTarget(null)}
                  />
                  <div className={classes['detailsContent']}>{details}</div>
                </Popover.Dropdown>
              </Popover>
            );
          })}
        </>
      ) : (
        <Text className={classes['unavailable']} size="sm">
          {unavailableMessage}
        </Text>
      )}
    </div>
  );
}
