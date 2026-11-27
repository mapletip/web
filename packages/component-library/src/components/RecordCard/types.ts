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
  readonly selected?: boolean;
}

export interface RecordCardInlineLabel {
  readonly id: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly tone: 'brand' | 'muted' | 'success';
}

interface RecordCardBaseProps {
  /** Main record label shown as the card heading. */
  readonly title: ReactNode;
  /** Place media beside the text with the footer aligned below the text. */
  readonly layout?:
    | 'default'
    | 'mediaAside'
    | 'compactMediaAside'
    | 'identity'
    | 'quietIdentity'
    | 'picture';
  /**
   * Scope the destination link to the identity header, leaving footer controls
   * and footer space outside the click box and link feedback. Defaults to the
   * whole card.
   */
  readonly linkScope?: 'card' | 'header';
  readonly secondaryLine?: ReactNode;
  /** Maximum number of lines shown for the secondary line. */
  readonly secondaryLineClamp?: number;
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
    | {
        readonly layout: 'identity';
        readonly facts?: readonly RecordFact[];
        /** Short line under the title. */
        readonly leadLine?: ReactNode;
        readonly secondaryLine?: never;
      }
    | {
        /** Identity card on one surface: no header band, no fact rows. */
        readonly layout: 'quietIdentity';
        readonly leadLine?: ReactNode;
        /** Short labels in one line under the header; colour is never the only signal. */
        readonly inlineLabels?: readonly RecordCardInlineLabel[];
        /** One quiet line under the header, such as where the record comes from. */
        readonly detailLine?: ReactNode;
        /** Show the detail line before the labels. */
        readonly detailFirst?: boolean;
        readonly facts?: never;
        readonly secondaryLine?: never;
      }
    | {
        readonly layout: 'picture';
        /** Short line under the title. */
        readonly leadLine?: ReactNode;
        readonly facts?: never;
      }
    | {
        readonly layout?: 'default' | 'mediaAside' | 'compactMediaAside';
        readonly leadLine?: never;
        readonly facts?: never;
      }
  );
