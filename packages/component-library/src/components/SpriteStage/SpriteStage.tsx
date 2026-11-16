import { Image, Text } from '@mantine/core';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import classes from '@/components/SpriteStage/SpriteStage.module.css';
import type { SpriteStageProps } from '@/components/SpriteStage/types';

/**
 * One static sprite standing on a lit pedestal.
 *
 * The pedestal is decorative and carries no meaning: the floor, glow and
 * contact shadow are `aria-hidden` and offer no controls. The sprite is shown at
 * its natural size, shrunk proportionally when it does not fit the stage's box,
 * and never enlarged. There is no measurement and no scale arithmetic; the box
 * and its maximums are CSS only.
 */
export function SpriteStage({
  src,
  name,
  unavailableMessage,
  width,
  height,
}: SpriteStageProps): ReactElement {
  const imageRef = useRef<HTMLImageElement>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasSource = src !== undefined && src !== '';
  // Keyed by source, so a new source is never treated as the failed one.
  const failed = hasSource && failedSrc === src;

  // An image that failed before hydration (a broken response behind server HTML)
  // never fires `error` again, so its state is read from the element instead.
  useEffect(() => {
    if (!hasSource) return;
    const image = imageRef.current;
    if (image?.complete === true && image.naturalWidth === 0) {
      setFailedSrc(src);
    }
  }, [hasSource, src]);

  if (hasSource && !failed) {
    return (
      <div className={classes['stage']}>
        <span className={classes['floor']} aria-hidden="true" />
        <span className={classes['figure']}>
          <span className={classes['glow']} aria-hidden="true" />
          <span className={classes['shadow']} aria-hidden="true" />
          <Image
            ref={imageRef}
            className={classes['sprite']}
            src={src}
            alt={name}
            width={width}
            height={height}
            loading="lazy"
            fit="scale-down"
            onError={() => setFailedSrc(src)}
          />
        </span>
      </div>
    );
  }

  return (
    <div className={classes['stage']} data-unavailable="true">
      <Text className={classes['unavailable']} size="sm">
        {unavailableMessage}
      </Text>
    </div>
  );
}
