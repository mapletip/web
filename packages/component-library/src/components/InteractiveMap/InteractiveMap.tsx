import {
  CloseButton,
  Image,
  Popover,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import {
  Fragment,
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
  KeepScale,
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';

import classes from '@/components/InteractiveMap/InteractiveMap.module.css';
import { TransformControls } from '@/components/InteractiveMap/TransformControls';
import {
  INTERACTIVE_MAP_MAX_ZOOM,
  INTERACTIVE_MAP_MIN_ZOOM,
} from '@/components/InteractiveMap/types';
import type {
  InteractiveMapImage,
  InteractiveMapMarker,
  InteractiveMapProps,
  InteractiveMapView,
} from '@/components/InteractiveMap/types';
import {
  transformToView,
  viewToTransform,
} from '@/components/InteractiveMap/view';

const SELECTION_ANIMATION_MS = 260;
const TRANSFORM_EPSILON = 0.01;
const TRANSFORM_POSITION_EPSILON = 0.5;

function markerStyle({
  x,
  y,
  imageWidth,
  imageHeight,
}: {
  readonly x: number;
  readonly y: number;
  readonly imageWidth: number;
  readonly imageHeight: number;
}): CSSProperties {
  return {
    left: `${(x / imageWidth) * 100}%`,
    top: `${(y / imageHeight) * 100}%`,
  };
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

function InteractiveMarker({
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

function groupMarkers(
  markers: readonly InteractiveMapMarker[],
): InteractiveMapMarker[][] {
  const groups = new Map<string, InteractiveMapMarker[]>();

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
export function InteractiveMap({
  className,
  style,
  image,
  markers,
  connectors = [],
  selectedIds = [],
  onActivate,
  interactive = true,
  wheelZoom = false,
  view,
  onViewChange,
  zoomInLabel = 'Zoom in',
  zoomOutLabel = 'Zoom out',
  controlsLabel = 'Stage controls',
  fitLabel = 'Fit',
  renderDetails,
  unavailableMessage,
}: InteractiveMapProps): ReactElement {
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const markerTargetRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousSelectionRef = useRef<{
    readonly interactive: boolean;
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
  const viewKey =
    view === undefined
      ? 'none'
      : `${view.zoom}\u0000${view.centerX}\u0000${view.centerY}`;
  const markerGroups = useMemo(() => groupMarkers(markers), [markers]);
  const markersById = new Map(markers.map((marker) => [marker.id, marker]));
  const stageStyle: CSSProperties & {
    readonly '--interactive-map-image-aspect-ratio': string;
  } = {
    ...style,
    '--interactive-map-image-aspect-ratio':
      image === undefined ? '1' : `${image.width / image.height}`,
  };
  const closeDetails = () => setOpenDetails(null);

  useEffect(() => {
    const previousViewKey = previousViewKeyRef.current;
    previousViewKeyRef.current = viewKey;
    if (!interactive || availableImage === undefined) return;

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
  }, [availableImage, interactive, view, viewKey]);

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
    previousSelectionRef.current = { interactive, key: selectedKey, viewKey };
    if (previous === null) return;

    const selectionChanged = previous.key !== selectedKey;
    const viewChanged = previous.viewKey !== viewKey;
    const becameInteractive = !previous.interactive && interactive;
    if (
      (!selectionChanged && !becameInteractive) ||
      !interactive ||
      viewChanged
    ) {
      return;
    }

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
    interactive,
    markerGroups,
    reducedMotion,
    reportView,
    selectedKey,
    viewKey,
  ]);

  const handleFit = (): void => {
    const transform = transformRef.current;
    if (
      view !== undefined &&
      transform !== null &&
      isFittedTransform(transform)
    ) {
      onViewChange?.(undefined);
    }
  };

  const imageBox =
    availableImage === undefined ? null : (
      <div className={classes['imageBox']}>
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
        {markerGroups.map((group) => {
          const markerIds = group.map(({ id }) => id);
          const targetKey = `${group[0]!.x},${group[0]!.y}`;
          const selected = markerIds.some((id) => selectedIdSet.has(id));
          const details =
            interactive && openDetails?.targetKey === targetKey
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

          if (interactive) {
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
          }

          return (
            <span
              key={markerIds[0]}
              className={classes['markerStatic']}
              data-marker-position={markerIds[0]}
              data-marker-id={markerIds.length === 1 ? markerIds[0] : undefined}
              data-marker-ids={markerIds.join(' ')}
              data-selected={selected ? 'true' : undefined}
              style={markerStyle({
                x: group[0]!.x,
                y: group[0]!.y,
                imageWidth: availableImage.width,
                imageHeight: availableImage.height,
              })}
              aria-hidden="true"
              inert
            >
              {group.map(({ content, id }) => (
                <Fragment key={id}>{content}</Fragment>
              ))}
            </span>
          );
        })}
      </div>
    );

  let stageContent: ReactNode;
  if (availableImage === undefined) {
    stageContent = (
      <Text className={classes['unavailable']} size="sm">
        {unavailableMessage}
      </Text>
    );
  } else if (!interactive) {
    stageContent = <>{imageBox}</>;
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
        wheel={{ disabled: !wheelZoom }}
        zoomAnimation={{ disabled: reducedMotion }}
        velocityAnimation={{ disabled: reducedMotion }}
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
          wrapperClass={classes['viewport']!}
          contentClass={classes['transformedContent']!}
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{
            width:
              'min(100cqw, calc(100cqh * var(--interactive-map-image-aspect-ratio)))',
            height:
              'min(100cqh, calc(100cqw / var(--interactive-map-image-aspect-ratio)))',
          }}
        >
          {imageBox}
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
      className={`${classes['stage']} ${className ?? ''}`.trim()}
      role="group"
      aria-label={accessibleName}
      style={stageStyle}
      data-unavailable={availableImage === undefined ? 'true' : undefined}
    >
      {stageContent}
    </div>
  );
}
