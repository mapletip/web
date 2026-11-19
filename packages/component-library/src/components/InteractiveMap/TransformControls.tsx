import { ActionIcon, Stack, Tooltip } from '@mantine/core';
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
  readonly onFit: () => void;
  readonly zoomInLabel: string;
  readonly zoomOutLabel: string;
}): ReactElement {
  const { resetTransform, zoomIn, zoomOut } = useControls();
  const transform = useTransformContext();
  const scale = useTransformComponent(readScale);
  const animationTime = motionReduced ? 0 : ZOOM_ANIMATION_MS;

  return (
    <Stack
      className={classes['controls']}
      gap={0}
      role="group"
      aria-label={controlsLabel}
    >
      <Tooltip label={zoomInLabel} withArrow>
        <ActionIcon
          aria-label={zoomInLabel}
          variant="white"
          size={44}
          disabled={scale >= maxScale - SCALE_EPSILON}
          onClick={() => {
            const currentScale = transform.state.scale;
            void zoomIn(currentScale * (Math.SQRT2 - 1), animationTime);
          }}
        >
          <Plus size={20} aria-hidden="true" />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={zoomOutLabel} withArrow>
        <ActionIcon
          aria-label={zoomOutLabel}
          variant="white"
          size={44}
          disabled={scale <= minScale + SCALE_EPSILON}
          onClick={() => {
            const currentScale = transform.state.scale;
            void zoomOut(currentScale * (1 - 1 / Math.SQRT2), animationTime);
          }}
        >
          <Minus size={20} aria-hidden="true" />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={fitLabel} withArrow>
        <ActionIcon
          aria-label={fitLabel}
          variant="white"
          size={44}
          onClick={() => {
            onFit();
            void resetTransform(animationTime);
          }}
        >
          <span className={classes['fitLabel']}>Fit</span>
        </ActionIcon>
      </Tooltip>
    </Stack>
  );
}
