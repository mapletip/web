import { ActionIcon, Tooltip } from '@mantine/core';
import { Minus, Plus } from '@phosphor-icons/react';
import type { ReactElement } from 'react';
import {
  useControls,
  useTransformComponent,
  useTransformContext,
  type ReactZoomPanPinchContextState,
} from 'react-zoom-pan-pinch';

import classes from '@/components/InteractiveMap/InteractiveMap.module.css';

const ZOOM_ANIMATION_MS = 220;
const SCALE_EPSILON = 0.00001;

function readScale(context: ReactZoomPanPinchContextState): number {
  return context.state.scale;
}

export function TransformControls({
  fitLabel,
  controlsLabel,
  maxScale,
  minScale,
  motionReduced,
  onFit,
  zoomInLabel,
  zoomOutLabel,
}: {
  readonly fitLabel: string;
  readonly controlsLabel: string;
  readonly maxScale: number;
  readonly minScale: number;
  readonly motionReduced: boolean;
  readonly onFit: (reset: Promise<void>) => void;
  readonly zoomInLabel: string;
  readonly zoomOutLabel: string;
}): ReactElement {
  const { resetTransform, zoomIn, zoomOut } = useControls();
  const transform = useTransformContext();
  const scale = useTransformComponent(readScale);
  const animationTime = motionReduced ? 0 : ZOOM_ANIMATION_MS;

  return (
    <ActionIcon.Group
      className={classes['controls']}
      orientation="vertical"
      role="group"
      aria-label={controlsLabel}
    >
      <Tooltip label={zoomInLabel} withArrow>
        <ActionIcon
          aria-label={zoomInLabel}
          variant="default"
          size="md"
          disabled={scale >= maxScale - SCALE_EPSILON}
          onClick={() => {
            const currentScale = transform.state.scale;
            void zoomIn(currentScale * (Math.SQRT2 - 1), animationTime);
          }}
        >
          <Plus size={16} aria-hidden="true" />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={zoomOutLabel} withArrow>
        <ActionIcon
          aria-label={zoomOutLabel}
          variant="default"
          size="md"
          disabled={scale <= minScale + SCALE_EPSILON}
          onClick={() => {
            const currentScale = transform.state.scale;
            void zoomOut(currentScale * (1 - 1 / Math.SQRT2), animationTime);
          }}
        >
          <Minus size={16} aria-hidden="true" />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={fitLabel} withArrow>
        <ActionIcon
          aria-label={fitLabel}
          variant="default"
          size="md"
          onClick={() => {
            const reset = resetTransform(animationTime);
            onFit(reset);
          }}
        >
          <span className={classes['fitLabel']}>Fit</span>
        </ActionIcon>
      </Tooltip>
    </ActionIcon.Group>
  );
}
