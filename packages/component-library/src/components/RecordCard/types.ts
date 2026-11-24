import type { ReactNode } from 'react';

/** A host-owned destination for the record represented by the card. */
export interface RecordCardDestination {
  /** Fully built destination, including path parameters and search/hash. */
  readonly href: string;
}

/** Props applied to the card's title link. */
export interface RecordCardLinkRenderProps {
  readonly href: string;
  readonly className: string;
  readonly children: ReactNode;
}

export type RecordCardLinkRenderer = (
  destination: RecordCardDestination,
  props: RecordCardLinkRenderProps,
) => ReactNode;

export interface RecordCardProps {
  /** Main record label shown as the card heading. */
  readonly title: ReactNode;
  /** Place media beside the text with the footer aligned below the text. */
  readonly layout?: 'default' | 'mediaAside' | 'compactMediaAside';
  /**
   * Scope the destination link to the identity header, leaving footer controls
   * and footer space outside the click box and link feedback. Defaults to the
   * whole card.
   */
  readonly linkScope?: 'card' | 'header';
  readonly secondaryLine?: ReactNode;
  readonly badges?: ReactNode;
  /** Optional illustration or other media shown beside the text. */
  readonly media?: ReactNode;
  readonly footer?: ReactNode;
  /** Omit to render a static card with no focus stop. */
  readonly destination?: RecordCardDestination;
  /** Optional host router adapter. */
  readonly renderLink?: RecordCardLinkRenderer;
}
