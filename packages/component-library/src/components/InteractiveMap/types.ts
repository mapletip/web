import type { CSSProperties, ReactNode } from 'react';

export const INTERACTIVE_MAP_MIN_ZOOM = 0.5;
export const INTERACTIVE_MAP_MAX_ZOOM = 8;

/** Image details used to reserve the stage and label its image. */
export interface InteractiveMapImage {
  /** Resolved image URL. */
  readonly src: string;
  /** Intrinsic image width in pixels. */
  readonly width: number;
  /** Intrinsic image height in pixels. */
  readonly height: number;
  /** Accessible name for the image and its containing group. */
  readonly alt: string;
}

/** Host-rendered content placed at one point in the image. */
export interface InteractiveMapMarker {
  /** Stable identifier for this marker. */
  readonly id: string;
  /** Horizontal position in image pixels. */
  readonly x: number;
  /** Vertical position in image pixels. */
  readonly y: number;
  /** Accessible name for this marker. */
  readonly label: string;
  /** Content rendered with its bottom centre on the supplied point. */
  readonly content: ReactNode;
}

/** A host-named pair of markers to join with a decorative line. */
export interface InteractiveMapConnector {
  /** Stable identifier for this connection. */
  readonly id: string;
  /** Identifier of the marker where the line starts. */
  readonly from: string;
  /** Identifier of the marker where the line ends. */
  readonly to: string;
}

/** A saved camera relative to the fitted image size and in image pixels. */
export interface InteractiveMapView {
  /** Zoom relative to the fitted view. Values are clamped between 0.5 and 8. */
  readonly zoom: number;
  /** Image pixel positioned at the horizontal centre of the stage. */
  readonly centerX: number;
  /** Image pixel positioned at the vertical centre of the stage. */
  readonly centerY: number;
}

/** Props for a fitted image stage with markers supplied by its host. */
export interface InteractiveMapProps {
  /** Additional class name applied to the stage root. */
  readonly className?: string | undefined;
  /** Additional inline styles applied to the stage root. */
  readonly style?: CSSProperties | undefined;
  /** Image to show. Omit it when no image is available. */
  readonly image?: InteractiveMapImage | undefined;
  /** Host-rendered markers positioned in the image's pixel coordinate space. */
  readonly markers: readonly InteractiveMapMarker[];
  /** Optional marker pairs joined by decorative lines in image pixel coordinates. */
  readonly connectors?: readonly InteractiveMapConnector[];
  /** Marker ids selected by the host. */
  readonly selectedIds?: readonly string[];
  /** Reports every id at an activated point. */
  readonly onActivate?: (markerIds: readonly string[]) => void;
  /** Renders details for an activated point, or returns nothing for no panel. */
  readonly renderDetails?: (markerIds: readonly string[]) => ReactNode;
  /** Whether markers can be activated. Defaults to true. */
  readonly interactive?: boolean;
  /** Enables wheel zoom on an interactive stage. Defaults to false. */
  readonly wheelZoom?: boolean;
  /** Saved view to apply on mount and whenever it changes. */
  readonly view?: InteractiveMapView | undefined;
  /** Reports the settled view, or undefined when Fit is selected. */
  readonly onViewChange?: (view: InteractiveMapView | undefined) => void;
  /** Accessible name for the zoom-in control. Defaults to "Zoom in". */
  readonly zoomInLabel?: string;
  /** Accessible name for the zoom-out control. Defaults to "Zoom out". */
  readonly zoomOutLabel?: string;
  /** Accessible name for the stage controls. Defaults to "Stage controls". */
  readonly controlsLabel?: string;
  /** Accessible name for the fit control. Defaults to "Fit". */
  readonly fitLabel?: string;
  /** Host wording shown when the image is missing or fails to load. */
  readonly unavailableMessage: string;
}
