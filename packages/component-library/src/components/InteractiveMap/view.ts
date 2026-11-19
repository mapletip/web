import {
  INTERACTIVE_MAP_MAX_ZOOM,
  INTERACTIVE_MAP_MIN_ZOOM,
  type InteractiveMapView,
} from '@/components/InteractiveMap/types';

interface ViewGeometry {
  readonly stageWidth: number;
  readonly stageHeight: number;
  readonly imageWidth: number;
  readonly imageHeight: number;
}

interface Transform {
  readonly positionX: number;
  readonly positionY: number;
  readonly scale: number;
}

interface ViewToTransformOptions extends ViewGeometry {
  readonly view: InteractiveMapView;
}

interface TransformToViewOptions extends ViewGeometry, Transform {}

function geometry({
  stageWidth,
  stageHeight,
  imageWidth,
  imageHeight,
}: ViewGeometry) {
  const safeStageWidth = Math.max(1, stageWidth);
  const safeStageHeight = Math.max(1, stageHeight);
  const safeImageWidth = Math.max(1, imageWidth);
  const safeImageHeight = Math.max(1, imageHeight);
  const fitScale = Math.min(
    safeStageWidth / safeImageWidth,
    safeStageHeight / safeImageHeight,
  );

  return {
    stageWidth: safeStageWidth,
    stageHeight: safeStageHeight,
    imageWidth: safeImageWidth,
    imageHeight: safeImageHeight,
    fitScale,
  };
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp({
  value,
  minimum,
  maximum,
}: {
  readonly value: number;
  readonly minimum: number;
  readonly maximum: number;
}): number {
  return Math.max(minimum, Math.min(value, maximum));
}

function clampCenter({
  value,
  imageSize,
  stageSize,
  fitScale,
  zoom,
}: {
  readonly value: number;
  readonly imageSize: number;
  readonly stageSize: number;
  readonly fitScale: number;
  readonly zoom: number;
}): number {
  const scaledImageSize = imageSize * fitScale * zoom;
  if (scaledImageSize <= stageSize) return imageSize / 2;

  const visibleHalf = stageSize / (2 * fitScale * zoom);
  return clamp({
    value: finiteOr(value, imageSize / 2),
    minimum: visibleHalf,
    maximum: imageSize - visibleHalf,
  });
}

function clampView(
  view: InteractiveMapView,
  sizes: ReturnType<typeof geometry>,
): InteractiveMapView {
  const zoom = clamp({
    value: finiteOr(view.zoom, 1),
    minimum: INTERACTIVE_MAP_MIN_ZOOM,
    maximum: INTERACTIVE_MAP_MAX_ZOOM,
  });

  return {
    zoom,
    centerX: clampCenter({
      value: view.centerX,
      imageSize: sizes.imageWidth,
      stageSize: sizes.stageWidth,
      fitScale: sizes.fitScale,
      zoom,
    }),
    centerY: clampCenter({
      value: view.centerY,
      imageSize: sizes.imageHeight,
      stageSize: sizes.stageHeight,
      fitScale: sizes.fitScale,
      zoom,
    }),
  };
}

/** Convert a saved, size-independent view into the pan/zoom library transform. */
export function viewToTransform({
  view,
  ...dimensions
}: ViewToTransformOptions): Transform {
  const sizes = geometry(dimensions);
  const boundedView = clampView(view, sizes);

  return {
    scale: boundedView.zoom,
    positionX:
      sizes.stageWidth / 2 -
      boundedView.centerX * sizes.fitScale * boundedView.zoom,
    positionY:
      sizes.stageHeight / 2 -
      boundedView.centerY * sizes.fitScale * boundedView.zoom,
  };
}

/** Convert the pan/zoom library transform into a clamped, size-independent view. */
export function transformToView({
  positionX,
  positionY,
  scale,
  ...dimensions
}: TransformToViewOptions): InteractiveMapView {
  const sizes = geometry(dimensions);
  const zoom = finiteOr(scale, 1);

  return clampView(
    {
      zoom,
      centerX: (sizes.stageWidth / 2 - positionX) / (sizes.fitScale * zoom),
      centerY: (sizes.stageHeight / 2 - positionY) / (sizes.fitScale * zoom),
    },
    sizes,
  );
}
