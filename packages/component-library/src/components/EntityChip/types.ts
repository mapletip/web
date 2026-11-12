import type { ReactNode } from 'react';

/**
 * A host-owned destination for a chip. The chip never rewrites or classifies
 * the built address.
 */
export interface EntityChipDestination {
  /** Fully built destination, including path parameters and search/hash. */
  readonly href: string;
}

/**
 * Presentation props the chip applies to an ordinary anchor. A host adapter can
 * forward these to a router link without the library importing the router or
 * duplicating the chip's icon and name layout.
 */
export interface EntityChipLinkRenderProps {
  /** Fully built destination, including path parameters and search/hash. */
  readonly href: string;
  readonly className: string;
  /** Library-constructed icon and name. Render this rather than rebuilding it. */
  readonly children: ReactNode;
}

export type EntityChipLinkRenderer = (
  destination: EntityChipDestination,
  props: EntityChipLinkRenderProps,
) => ReactNode;

export interface EntityChipProps {
  /** The related record's display name. */
  readonly name: string;
  /**
   * Resolved icon URL. Omit it when the record has no image, in which case the
   * chip shows a neutral placeholder of the same size.
   */
  readonly iconSrc?: string | undefined;
  /**
   * Destination for the record's own page. When omitted, the icon and name are
   * plain text: not focusable and not announced as a link.
   */
  readonly destination?: EntityChipDestination | undefined;
  /**
   * Optional router-aware replacement for the default anchor. Only used when a
   * destination is supplied. Forward every supplied prop, including `children`,
   * so the chip's icon and name layout is retained. TanStack Router hosts should
   * split the built `href` into `Link`'s `to`, `search` and `hash` options.
   */
  readonly renderLink?: EntityChipLinkRenderer | undefined;
  /**
   * Optional host control shown after the name, outside the link so it keeps its
   * own keyboard focus and activation. The chip owns only its placement.
   */
  readonly trailing?: ReactNode;
}
