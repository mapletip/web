import type { ReactNode } from 'react';

/** A host-owned destination for the record represented by the card. */
export interface RecordCardDestination {
  /** Fully built destination, including path parameters and search/hash. */
  readonly href: string;
}

/** Props applied to the single link surrounding a linked card. */
export interface RecordCardLinkRenderProps {
  readonly href: string;
  readonly className: string;
  readonly children: ReactNode;
  readonly 'aria-label': string;
}

export type RecordCardLinkRenderer = (
  destination: RecordCardDestination,
  props: RecordCardLinkRenderProps,
) => ReactNode;

export interface RecordCardProps {
  /** Main record label and the accessible name when the card is linked. */
  readonly title: string;
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
