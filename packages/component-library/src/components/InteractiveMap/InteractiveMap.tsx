import { Text } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';

import classes from '@/components/InteractiveMap/InteractiveMap.module.css';
import { InteractiveMarker } from '@/components/InteractiveMap/InteractiveMarker';
import { TransformControls } from '@/components/InteractiveMap/TransformControls';
import {
  INTERACTIVE_MAP_MAX_ZOOM,
  INTERACTIVE_MAP_MIN_ZOOM,
} from '@/components/InteractiveMap/types';
import type {
  InteractiveMapProps,
  InteractiveMapView,
} from '@/components/InteractiveMap/types';
import {
  transformToView,
  viewToTransform,
} from '@/components/InteractiveMap/view';
import { groupMarkers } from '@/components/StaticMap/markerPlacement';
import { MapPicture, StaticMap } from '@/components/StaticMap/StaticMap';
import staticClasses from '@/components/StaticMap/StaticMap.module.css';

const SELECTION_ANIMATION_MS = 260;
const TRANSFORM_EPSILON = 0.01;
const TRANSFORM_POSITION_EPSILON = 0.5;

function getViewKey(view: InteractiveMapView | undefined): string {
  return view === undefined
    ? 'none'
    : `${view.zoom}\u0000${view.centerX}\u0000${view.centerY}`;
}

interface TransformPosition {
  readonly positionX: number;
  readonly positionY: number;
  readonly scale: number;
}

function transformChanged(
  previous: TransformPosition | null,
  next: TransformPosition,
): boolean {
  return (
    previous !== null &&
    (Math.abs(previous.positionX - next.positionX) > TRANSFORM_EPSILON ||
      Math.abs(previous.positionY - next.positionY) > TRANSFORM_EPSILON ||
      Math.abs(previous.scale - next.scale) > TRANSFORM_EPSILON)
  );
}

function isFittedTransform(transform: ReactZoomPanPinchRef): boolean {
  const { contentComponent, wrapperComponent } = transform.instance;
  if (contentComponent === null || wrapperComponent === null) return false;

  return (
    Math.abs(transform.state.scale - 1) <= TRANSFORM_EPSILON &&
    Math.abs(
      transform.state.positionX -
        (wrapperComponent.clientWidth - contentComponent.offsetWidth) / 2,
    ) <= TRANSFORM_POSITION_EPSILON &&
    Math.abs(
      transform.state.positionY -
        (wrapperComponent.clientHeight - contentComponent.offsetHeight) / 2,
    ) <= TRANSFORM_POSITION_EPSILON
  );
}

/** One image with host-rendered markers placed at image pixel coordinates. */
export function InteractiveMap(props: InteractiveMapProps): ReactElement {
  const staticViewKeyRef = useRef<string | undefined>(undefined);
  const viewKey = getViewKey(props.view);

  useEffect(() => {
    if (props.interactive === false) staticViewKeyRef.current = viewKey;
  }, [props.interactive, viewKey]);

  if (props.interactive === false) {
    return (
      <StaticMap
        className={props.className}
        style={props.style}
        image={props.image}
        markers={props.markers}
        selectedIds={props.selectedIds}
        connectors={props.connectors}
        unavailableMessage={props.unavailableMessage}
      />
    );
  }

  return <InteractiveMapStage {...props} staticViewKeyRef={staticViewKeyRef} />;
}

function InteractiveMapStage({
  staticViewKeyRef,
  className,
  style,
  image,
  markers,
  connectors = [],
  selectedIds = [],
  onActivate,
  gestures = 'always',
  wheelZoom = false,
  view,
  onViewChange,
  zoomInLabel = 'Zoom in',
  zoomOutLabel = 'Zoom out',
  controlsLabel = 'Stage controls',
  fitLabel = 'Fit',
  renderDetails,
  unavailableMessage,
}: InteractiveMapProps & {
  readonly staticViewKeyRef: MutableRefObject<string | undefined>;
}): ReactElement {
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const markerTargetRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousSelectionRef = useRef<{
    readonly key: string;
    readonly viewKey: string;
  } | null>(null);
  const previousViewKeyRef = useRef<string | undefined>(undefined);
  const panStartTransformRef = useRef<TransformPosition | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [openDetails, setOpenDetails] = useState<{
    readonly targetKey: string;
    readonly content: ReactNode;
  } | null>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const src = image?.src;
  const hasSource = src !== undefined && src !== '';
  // Key by source so a replacement image is not treated as the failed one.
  const failed = hasSource && failedSrc === src;
  const availableImage = hasSource && !failed ? image : undefined;
  const accessibleName = availableImage?.alt || unavailableMessage;
  const selectedIdSet = new Set(selectedIds);
  const selectedKey = [...selectedIds].sort().join('\u0000');
  const viewKey = getViewKey(view);
  const markerGroups = useMemo(() => groupMarkers(markers), [markers]);
  const stageStyle: CSSProperties & {
    readonly '--interactive-map-image-aspect-ratio': string;
  } = {
    ...style,
    '--interactive-map-image-aspect-ratio':
      image === undefined ? '1' : String(image.width / image.height),
  };
  const closeDetails = () => setOpenDetails(null);
  const updateZoomedState = useCallback(
    (transform: ReactZoomPanPinchRef, state: { readonly scale: number }) => {
      transform.instance.contentComponent?.style.setProperty(
        '--map-zoom',
        String(state.scale),
      );
      setIsZoomedIn(state.scale > 1 + TRANSFORM_EPSILON);
    },
    [],
  );

  useEffect(() => {
    const previousViewKey = previousViewKeyRef.current;
    previousViewKeyRef.current = viewKey;
    if (availableImage === undefined) return;

    const transform = transformRef.current;
    const wrapper = transform?.instance.wrapperComponent;
    if (transform == null || wrapper == null) return;

    if (view === undefined) {
      if (previousViewKey !== undefined && previousViewKey !== 'none') {
        void transform.resetTransform(0);
      }
      return;
    }

    const nextTransform = viewToTransform({
      view,
      stageWidth: wrapper.clientWidth,
      stageHeight: wrapper.clientHeight,
      imageWidth: availableImage.width,
      imageHeight: availableImage.height,
    });
    const currentTransform = transform.state;
    if (
      Math.abs(currentTransform.positionX - nextTransform.positionX) <=
        TRANSFORM_EPSILON &&
      Math.abs(currentTransform.positionY - nextTransform.positionY) <=
        TRANSFORM_EPSILON &&
      Math.abs(currentTransform.scale - nextTransform.scale) <=
        TRANSFORM_EPSILON
    ) {
      return;
    }

    void transform.setTransform(
      nextTransform.positionX,
      nextTransform.positionY,
      nextTransform.scale,
      0,
    );
  }, [availableImage, view, viewKey]);

  const reportView = useCallback(
    (transform: ReactZoomPanPinchRef): void => {
      if (availableImage === undefined) return;
      const wrapper = transform.instance.wrapperComponent;
      if (wrapper === null) return;
      if (isFittedTransform(transform)) {
        onViewChange?.(undefined);
        return;
      }

      const nextView: InteractiveMapView = transformToView({
        ...transform.state,
        stageWidth: wrapper.clientWidth,
        stageHeight: wrapper.clientHeight,
        imageWidth: availableImage.width,
        imageHeight: availableImage.height,
      });
      onViewChange?.(nextView);
    },
    [availableImage, onViewChange],
  );

  useEffect(() => {
    const previous = previousSelectionRef.current;
    previousSelectionRef.current = { key: selectedKey, viewKey };
    const becameInteractive =
      previous === null && staticViewKeyRef.current === viewKey;
    if (previous === null && !becameInteractive) return;

    const selectionChanged = previous !== null && previous.key !== selectedKey;
    const viewChanged = previous !== null && previous.viewKey !== viewKey;
    if ((!selectionChanged && !becameInteractive) || viewChanged) return;

    const transform = transformRef.current;
    const viewport = transform?.instance.wrapperComponent;
    if (transform === null || viewport == null) return;

    const currentSelection = new Set(
      selectedKey === '' ? [] : selectedKey.split('\u0000'),
    );
    const selectedTargets = markerGroups
      .filter((group) => group.some(({ id }) => currentSelection.has(id)))
      .map((group) =>
        markerTargetRefs.current.get(`${group[0]!.x},${group[0]!.y}`),
      )
      .filter((target): target is HTMLButtonElement => target !== undefined);
    if (selectedTargets.length === 0) return;

    const viewportRect = viewport.getBoundingClientRect();
    const selectionVisible = selectedTargets.every((target) => {
      const rect = target.getBoundingClientRect();
      return (
        rect.left >= viewportRect.left &&
        rect.right <= viewportRect.right &&
        rect.top >= viewportRect.top &&
        rect.bottom <= viewportRect.bottom
      );
    });
    if (selectionVisible) return;

    void transform
      .zoomToElement(selectedTargets, {
        minScale: INTERACTIVE_MAP_MIN_ZOOM,
        maxScale: transform.state.scale,
        animationTime: reducedMotion ? 0 : SELECTION_ANIMATION_MS,
      })
      .then(() => reportView(transform));
  }, [
    markerGroups,
    reducedMotion,
    reportView,
    selectedKey,
    staticViewKeyRef,
    viewKey,
  ]);

  const handleFit = (reset: Promise<void>): void => {
    const transform = transformRef.current;
    if (transform === null) return;

    void reset.then(() => reportView(transform));
  };

  let stageContent: ReactNode;
  if (availableImage === undefined) {
    stageContent = (
      <Text className={staticClasses['unavailable']} size="sm">
        {unavailableMessage}
      </Text>
    );
  } else {
    stageContent = (
      <TransformWrapper
        ref={transformRef}
        minScale={INTERACTIVE_MAP_MIN_ZOOM}
        maxScale={INTERACTIVE_MAP_MAX_ZOOM}
        initialScale={1}
        limitToBounds
        centerZoomedOut
        centerOnInit={view === undefined}
        panning={{ disabled: gestures === 'zoomed' && !isZoomedIn }}
        doubleClick={{ disabled: gestures === 'zoomed' }}
        wheel={{ disabled: !wheelZoom }}
        zoomAnimation={{ disabled: reducedMotion }}
        velocityAnimation={{ disabled: reducedMotion }}
        onTransform={updateZoomedState}
        onPanningStart={(ref) => {
          panStartTransformRef.current = {
            positionX: ref.state.positionX,
            positionY: ref.state.positionY,
            scale: ref.state.scale,
          };
        }}
        onPanningStop={(ref, event) => {
          if (event.type === 'wheel') return;
          const changed = transformChanged(panStartTransformRef.current, {
            positionX: ref.state.positionX,
            positionY: ref.state.positionY,
            scale: ref.state.scale,
          });
          panStartTransformRef.current = null;
          if (changed) reportView(ref);
        }}
        onPinchStop={reportView}
        onWheelStop={reportView}
        onZoomStop={(ref, event) => {
          if (event.type !== 'wheel') reportView(ref);
        }}
      >
        <TransformComponent
          wrapperClass={`${classes['viewport']} ${gestures === 'zoomed' && !isZoomedIn ? classes['viewportGesturesOff'] : ''}`.trim()}
          contentClass={classes['transformedContent']!}
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{
            width:
              'min(100cqw, calc(100cqh * var(--interactive-map-image-aspect-ratio)))',
            height:
              'min(100cqh, calc(100cqw / var(--interactive-map-image-aspect-ratio)))',
          }}
        >
          <MapPicture
            image={availableImage}
            markers={markers}
            connectors={connectors}
            onImageError={() => setFailedSrc(availableImage.src)}
          >
            {markerGroups.map((group) => {
              const markerIds = group.map(({ id }) => id);
              const targetKey = `${group[0]!.x},${group[0]!.y}`;
              const selected = markerIds.some((id) => selectedIdSet.has(id));
              const details =
                openDetails?.targetKey === targetKey
                  ? openDetails.content
                  : undefined;
              const hasDetails = details != null && details !== false;
              const detailsOpen =
                openDetails?.targetKey === targetKey && hasDetails;
              const activate = (event: MouseEvent<HTMLButtonElement>) => {
                event.currentTarget.focus();
                onActivate?.(markerIds);
                const activationDetails = renderDetails?.(markerIds);
                setOpenDetails(
                  activationDetails != null && activationDetails !== false
                    ? { targetKey, content: activationDetails }
                    : null,
                );
              };

              return (
                <InteractiveMarker
                  key={markerIds[0]}
                  group={group}
                  image={availableImage}
                  selected={selected}
                  targetKey={targetKey}
                  markerTargetRefs={markerTargetRefs}
                  portalTarget={portalTarget}
                  details={details}
                  hasDetailsRenderer={renderDetails !== undefined}
                  detailsOpen={detailsOpen}
                  onActivate={activate}
                  onCloseDetails={closeDetails}
                />
              );
            })}
          </MapPicture>
        </TransformComponent>
        <TransformControls
          fitLabel={fitLabel}
          controlsLabel={controlsLabel}
          maxScale={INTERACTIVE_MAP_MAX_ZOOM}
          minScale={INTERACTIVE_MAP_MIN_ZOOM}
          motionReduced={reducedMotion}
          onFit={handleFit}
          zoomInLabel={zoomInLabel}
          zoomOutLabel={zoomOutLabel}
        />
      </TransformWrapper>
    );
  }

  return (
    <div
      ref={setPortalTarget}
      className={`${staticClasses['stage']} ${className ?? ''}`.trim()}
      role="group"
      aria-label={accessibleName}
      style={stageStyle}
      data-unavailable={availableImage === undefined ? 'true' : undefined}
      data-gestures={gestures === 'zoomed' && !isZoomedIn ? 'off' : undefined}
    >
      {stageContent}
    </div>
  );
}
