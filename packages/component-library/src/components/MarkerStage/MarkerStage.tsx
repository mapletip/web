import { Image, Text } from '@mantine/core';
import { useState, type CSSProperties, type ReactElement } from 'react';

import classes from '@/components/MarkerStage/MarkerStage.module.css';
import type { MarkerStageProps } from '@/components/MarkerStage/types';

/** One image with host-rendered markers placed at image pixel coordinates. */
export function MarkerStage({
  image,
  markers,
  unavailableMessage,
}: MarkerStageProps): ReactElement {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = image?.src;
  const hasSource = src !== undefined && src !== '';
  // Key by source so a replacement image is not treated as the failed one.
  const failed = hasSource && failedSrc === src;
  const availableImage = hasSource && !failed ? image : undefined;
  const accessibleName = availableImage?.alt || unavailableMessage;
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
          {markers.map((marker) => (
            <span
              key={marker.id}
              className={classes['marker']}
              data-marker-id={marker.id}
              style={{
                left: `${(marker.x / availableImage.width) * 100}%`,
                top: `${(marker.y / availableImage.height) * 100}%`,
              }}
            >
              {marker.content}
            </span>
          ))}
        </>
      ) : (
        <Text className={classes['unavailable']} size="sm">
          {unavailableMessage}
        </Text>
      )}
    </div>
  );
}
