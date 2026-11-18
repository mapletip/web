import type { ReactNode } from 'react';

/** Image details used to reserve the stage and label its image. */
export interface MarkerStageImage {
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
export interface MarkerStageMarker {
  /** Stable identifier for this marker. */
  readonly id: string;
  /** Horizontal position in image pixels. */
  readonly x: number;
  /** Vertical position in image pixels. */
  readonly y: number;
  /** Content rendered with its bottom centre on the supplied point. */
  readonly content: ReactNode;
}

/** Props for a fitted image stage with markers supplied by its host. */
export interface MarkerStageProps {
  /** Image to show. Omit it when no image is available. */
  readonly image?: MarkerStageImage | undefined;
  /** Host-rendered markers positioned in the image's pixel coordinate space. */
  readonly markers: readonly MarkerStageMarker[];
  /** Host wording shown when the image is missing or fails to load. */
  readonly unavailableMessage: string;
}
