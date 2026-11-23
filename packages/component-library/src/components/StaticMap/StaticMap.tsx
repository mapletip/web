import { Image, Text } from '@mantine/core';
import {
  Fragment,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';

import type {
  InteractiveMapConnector,
  InteractiveMapImage,
  InteractiveMapMarker,
} from '@/components/InteractiveMap/types';
import {
  groupMarkers,
  markerStyle,
} from '@/components/StaticMap/markerPlacement';
import classes from '@/components/StaticMap/StaticMap.module.css';
import type { StaticMapProps } from '@/components/StaticMap/types';

interface MapPictureProps {
  readonly image: InteractiveMapImage;
  readonly markers: readonly InteractiveMapMarker[];
  readonly connectors: readonly InteractiveMapConnector[];
  readonly loading?: 'eager' | 'lazy' | undefined;
  readonly onImageError: () => void;
  readonly children: ReactNode;
}

/** Shared fitted image, line overlay and marker layer used by both map modes. */
export function MapPicture({
  image,
  markers,
  connectors,
  loading,
  onImageError,
  children,
}: MapPictureProps): ReactElement {
  const markersById = new Map(markers.map((marker) => [marker.id, marker]));

  return (
    <div className={classes['imageBox']}>
      <Image
        className={classes['image']}
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        fit="contain"
        loading={loading}
        onError={onImageError}
      />
      {connectors.length > 0 ? (
        <svg
          className={classes['connectors']}
          viewBox={'0 0 ' + image.width + ' ' + image.height}
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
      {children}
    </div>
  );
}

function StaticMarkers({
  image,
  markers,
  selectedIds,
}: {
  readonly image: InteractiveMapImage;
  readonly markers: readonly InteractiveMapMarker[];
  readonly selectedIds: readonly string[];
}): ReactElement {
  const selectedIdSet = new Set(selectedIds);

  return (
    <>
      {groupMarkers(markers).map((group) => {
        const markerIds = group.map(({ id }) => id);
        const target = group[0]!;
        const selected = markerIds.some((id) => selectedIdSet.has(id));

        return (
          <span
            key={target.id}
            className={classes['markerStatic']}
            data-marker-position={target.id}
            data-marker-id={markerIds.length === 1 ? markerIds[0] : undefined}
            data-marker-ids={markerIds.join(' ')}
            data-selected={selected ? 'true' : undefined}
            style={markerStyle({
              x: target.x,
              y: target.y,
              imageWidth: image.width,
              imageHeight: image.height,
              size: target.size,
              anchor: target.anchor,
            })}
            data-sized={target.size === undefined ? undefined : 'true'}
            aria-hidden="true"
            inert
          >
            {group.map(({ content, id }) => (
              <Fragment key={id}>{content}</Fragment>
            ))}
          </span>
        );
      })}
    </>
  );
}

/** One fitted image with host-rendered markers, with no interactive behavior. */
export function StaticMap({
  className,
  style,
  image,
  markers,
  selectedIds = [],
  connectors = [],
  loading,
  unavailableMessage,
}: StaticMapProps): ReactElement {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = image?.src;
  const hasSource = src !== undefined && src !== '';
  const availableImage = hasSource && failedSrc !== src ? image : undefined;
  const accessibleName = availableImage?.alt || unavailableMessage;
  const stageStyle: CSSProperties & {
    readonly '--interactive-map-image-aspect-ratio': string;
  } = {
    ...style,
    '--interactive-map-image-aspect-ratio':
      image === undefined ? '1' : String(image.width / image.height),
  };

  return (
    <div
      className={`${classes['stage']} ${className ?? ''}`.trim()}
      role="group"
      aria-label={accessibleName}
      style={stageStyle}
      data-unavailable={availableImage === undefined ? 'true' : undefined}
    >
      {availableImage === undefined ? (
        <Text className={classes['unavailable']} size="sm">
          {unavailableMessage}
        </Text>
      ) : (
        <MapPicture
          image={availableImage}
          markers={markers}
          connectors={connectors}
          loading={loading}
          onImageError={() => setFailedSrc(availableImage.src)}
        >
          <StaticMarkers
            image={availableImage}
            markers={markers}
            selectedIds={selectedIds}
          />
        </MapPicture>
      )}
    </div>
  );
}
