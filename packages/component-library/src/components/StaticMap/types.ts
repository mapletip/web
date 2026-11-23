import type { CSSProperties } from 'react';

import type {
  InteractiveMapConnector,
  InteractiveMapImage,
  InteractiveMapMarker,
} from '@/components/InteractiveMap/types';

/** Props for a fitted, non-interactive image stage with host-rendered markers. */
export interface StaticMapProps {
  /** Additional class name applied to the stage root. */
  readonly className?: string | undefined;
  /** Additional inline styles applied to the stage root. */
  readonly style?: CSSProperties | undefined;
  /** Image to show. Omit it when no image is available. */
  readonly image?: InteractiveMapImage | undefined;
  /** Host-rendered markers positioned in the image's pixel coordinate space. */
  readonly markers: readonly InteractiveMapMarker[];
  /** Marker ids highlighted in the static image. Defaults to none. */
  readonly selectedIds?: readonly string[] | undefined;
  /** Optional marker pairs joined by decorative lines in image pixel coordinates. */
  readonly connectors?: readonly InteractiveMapConnector[] | undefined;
  /** Host wording shown when the image is missing or fails to load. */
  readonly unavailableMessage: string;
}
