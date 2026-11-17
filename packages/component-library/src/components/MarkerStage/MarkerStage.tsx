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
  useTransformComponent,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';

import classes from '@/components/MarkerStage/MarkerStage.module.css';
import { TransformControls } from '@/components/MarkerStage/TransformControls';
import type {
  MarkerStageImage,
  MarkerStageMarker,
  MarkerStageProps,
  MarkerStageView,
} from '@/components/MarkerStage/types';
import {
  transformToView,
  viewToTransform,
} from '@/components/MarkerStage/view';

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;
const SELECTION_ANIMATION_MS = 260;
const TRANSFORM_EPSILON = 0.01;

function markerStyle(
  x: number,
  y: number,
  imageWidth: number,
  imageHeight: number,
  scale: number,
): CSSProperties {
  return {
    left: `${(x / imageWidth) * 100}%`,
    top: `${(y / imageHeight) * 100}%`,
    transform: `translate(-50%, -100%) scale(${1 / scale})`,
  };
}

function isFittedTransform(transform: ReactZoomPanPinchRef): boolean {
  const { contentComponent, wrapperComponent } = transform.instance;
  if (contentComponent === null || wrapperComponent === null) return false;

  return (
    Math.abs(transform.state.scale - 1) <= TRANSFORM_EPSILON &&
    Math.abs(
      transform.state.positionX -
        (wrapperComponent.clientWidth - contentComponent.offsetWidth) / 2,
    ) <= TRANSFORM_EPSILON &&
    Math.abs(
      transform.state.positionY -
        (wrapperComponent.clientHeight - contentComponent.offsetHeight) / 2,
    ) <= TRANSFORM_EPSILON
  );
}

interface InteractiveMarkerProps {
  readonly group: readonly MarkerStageMarker[];
  readonly image: MarkerStageImage;
  readonly selected: boolean;
  readonly targetKey: string;
  readonly markerTargetRefs: MutableRefObject<Map<string, HTMLButtonElement>>;
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
  details,
  hasDetailsRenderer,
  detailsOpen,
  onActivate,
  onCloseDetails,
}: InteractiveMarkerProps): ReactElement {
  const scale = useTransformComponent(({ state }) => state.scale);
  const markerIds = group.map(({ id }) => id);
  const label =
    group.length === 1
      ? group[0]!.label
      : `${group.map(({ label: markerLabel }) => markerLabel).join(', ')} (${group.length})`;
  const markerContent = group.map(({ content, id }) => (
    <Fragment key={id}>{content}</Fragment>
  ));
  // Mantine handles Escape from the dropdown; mirror it on the trigger.
  const markerButton = (
    <UnstyledButton
      type="button"
      ref={(element) => {
        if (element === null) markerTargetRefs.current.delete(targetKey);
        else markerTargetRefs.current.set(targetKey, element);
      }}
      className={`${classes['marker']} ${classes['markerButton']}`}
      data-marker-position={markerIds[0]}
      data-marker-id={markerIds.length === 1 ? markerIds[0] : undefined}
      data-marker-ids={markerIds.join(' ')}
      data-selected={selected ? 'true' : undefined}
      style={markerStyle(
        group[0]!.x,
        group[0]!.y,
        image.width,
        image.height,
        scale,
      )}
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
      {markerContent}
    </UnstyledButton>
  );

  if (!hasDetailsRenderer) {
    return markerButton;
  }

  return (
    <Popover
      opened={detailsOpen}
      onChange={(opened) => {
        if (!opened) onCloseDetails();
      }}
      position="bottom"
      middlewares={{ flip: true, shift: true, size: true }}
      floatingStrategy="absolute"
      withinPortal={false}
      closeOnEscape
      returnFocus
    >
      <Popover.Target>{markerButton}</Popover.Target>
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
  wheelZoom = false,
  view,
  onViewChange,
  zoomInLabel = 'Zoom in',
  zoomOutLabel = 'Zoom out',
  fitLabel = 'Fit map',
  renderDetails,
  unavailableMessage,
}: MarkerStageProps): ReactElement {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const markerTargetRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousSelectionRef = useRef<{
    readonly interactive: boolean;
    readonly key: string;
    readonly viewKey: string;
  } | null>(null);
  const previousViewKeyRef = useRef<string | undefined>(undefined);
  const fitPendingRef = useRef(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [openDetailsTarget, setOpenDetailsTarget] = useState<string | null>(
    null,
  );
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
    readonly '--marker-stage-image-aspect-ratio': string;
  } = {
    aspectRatio:
      availableImage === undefined
        ? '4 / 3'
        : `${availableImage.width} / ${availableImage.height}`,
    '--marker-stage-image-aspect-ratio':
      availableImage === undefined
        ? '1'
        : `${availableImage.width / availableImage.height}`,
  };
  const closeDetails = () => setOpenDetailsTarget(null);

  useEffect(() => {
    // TransformComponent owns this node and exposes it through the transform instance.
    viewportRef.current =
      transformRef.current?.instance.wrapperComponent ?? null;
  }, [availableImage, interactive]);

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
    const viewport = viewportRef.current;
    if (transform === null || viewport === null) return;

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

    void transform.zoomToElement(selectedTargets, {
      minScale: MIN_SCALE,
      maxScale: transform.state.scale,
      animationTime: reducedMotion ? 0 : SELECTION_ANIMATION_MS,
    });
  }, [interactive, markerGroups, reducedMotion, selectedKey, viewKey]);

  const reportView = (transform: ReactZoomPanPinchRef): void => {
    if (availableImage === undefined) return;
    const wrapper = transform.instance.wrapperComponent;
    if (wrapper === null) return;

    const nextView: MarkerStageView = transformToView({
      ...transform.state,
      stageWidth: wrapper.clientWidth,
      stageHeight: wrapper.clientHeight,
      imageWidth: availableImage.width,
      imageHeight: availableImage.height,
    });
    onViewChange?.(nextView);
  };

  const handleFit = (): void => {
    const transform = transformRef.current;
    const alreadyFitted = transform !== null && isFittedTransform(transform);

    fitPendingRef.current = !alreadyFitted;
    if (alreadyFitted) onViewChange?.(undefined);
  };

  const renderImageBox = (): ReactElement => (
    <div className={classes['imageBox']}>
      <Image
        className={classes['image']}
        src={availableImage!.src}
        alt={availableImage!.alt}
        width={availableImage!.width}
        height={availableImage!.height}
        fit="contain"
        onError={() => setFailedSrc(availableImage!.src)}
      />
      {connectors.length > 0 ? (
        <svg
          className={classes['connectors']}
          viewBox={`0 0 ${availableImage!.width} ${availableImage!.height}`}
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
          interactive && openDetailsTarget === targetKey
            ? renderDetails?.(markerIds)
            : undefined;
        const hasDetails = details != null && details !== false;
        const detailsOpen = openDetailsTarget === targetKey && hasDetails;
        const activate = (event: MouseEvent<HTMLButtonElement>) => {
          event.currentTarget.focus();
          onActivate?.(markerIds);
          const activationDetails = renderDetails?.(markerIds);
          setOpenDetailsTarget(
            activationDetails != null && activationDetails !== false
              ? targetKey
              : null,
          );
        };

        if (interactive) {
          return (
            <InteractiveMarker
              key={markerIds[0]}
              group={group}
              image={availableImage!}
              selected={selected}
              targetKey={targetKey}
              markerTargetRefs={markerTargetRefs}
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
            style={markerStyle(
              group[0]!.x,
              group[0]!.y,
              availableImage!.width,
              availableImage!.height,
              1,
            )}
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

  let stageContent: ReactElement;
  if (availableImage === undefined) {
    stageContent = (
      <Text className={classes['unavailable']} size="sm">
        {unavailableMessage}
      </Text>
    );
  } else if (!interactive) {
    stageContent = renderImageBox();
  } else {
    stageContent = (
      <TransformWrapper
        ref={transformRef}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        initialScale={1}
        limitToBounds
        centerZoomedOut
        wheel={{ disabled: !wheelZoom }}
        zoomAnimation={{ disabled: reducedMotion }}
        velocityAnimation={{ disabled: reducedMotion }}
        onPanningStop={(ref, event) => {
          if (event.type !== 'wheel') reportView(ref);
        }}
        onPinchStop={reportView}
        onWheelStop={reportView}
        onZoomStop={(ref, event) => {
          if (event.type === 'wheel') return;
          if (fitPendingRef.current) {
            if (isFittedTransform(ref)) {
              fitPendingRef.current = false;
              onViewChange?.(undefined);
              return;
            }
          }
          reportView(ref);
        }}
      >
        <TransformComponent
          wrapperClass={classes['viewport']!}
          contentClass={classes['transformedContent']!}
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{
            width:
              'min(100cqw, calc(100cqh * var(--marker-stage-image-aspect-ratio)))',
            height:
              'min(100cqh, calc(100cqw / var(--marker-stage-image-aspect-ratio)))',
          }}
        >
          {renderImageBox()}
        </TransformComponent>
        <TransformControls
          fitLabel={fitLabel}
          maxScale={MAX_SCALE}
          minScale={MIN_SCALE}
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
      className={classes['stage']}
      role="group"
      aria-label={accessibleName}
      style={stageStyle}
      data-unavailable={availableImage === undefined ? 'true' : undefined}
    >
      {stageContent}
    </div>
  );
}
