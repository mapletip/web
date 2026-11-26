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

export interface RecordFact {
  readonly id: string;
  readonly icon?: ReactNode;
  readonly label: string;
  readonly detail?: string;
  readonly values?: readonly [ReactNode, ReactNode?];
  readonly action?: () => void;
}

interface RecordCardBaseProps {
  /** Main record label shown as the card heading. */
  readonly title: ReactNode;
  /** Place media beside the text with the footer aligned below the text. */
  readonly layout?: 'default' | 'mediaAside' | 'compactMediaAside' | 'identity';
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
  /** Optional host router adapter. */
  readonly renderLink?: RecordCardLinkRenderer;
}

type RecordCardNavigation =
  | {
      readonly destination: RecordCardDestination;
      readonly action?: never;
      readonly isDetailsOpen?: never;
    }
  | {
      readonly destination?: never;
      readonly action: () => void;
      readonly isDetailsOpen?: boolean;
    }
  | {
      readonly destination?: never;
      readonly action?: never;
      readonly isDetailsOpen?: never;
    };

export type RecordCardProps = RecordCardBaseProps &
  RecordCardNavigation &
  (
    | { readonly layout: 'identity'; readonly facts?: readonly RecordFact[] }
    | {
        readonly layout?: 'default' | 'mediaAside' | 'compactMediaAside';
        readonly facts?: never;
      }
  );
