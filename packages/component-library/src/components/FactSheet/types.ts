import type { ReactNode } from 'react';

interface FactBase {
  /** Short label shown against the value. */
  readonly label: string;
  /** Decorative icon shown beside the label. */
  readonly icon?: ReactNode;
  /** Optional explanation shown on hover and on keyboard focus. */
  readonly explanation?: string;
}

/** A fact with a value the host has already formatted for display. */
export interface KnownFact extends FactBase {
  readonly value: string;
  readonly notKnown?: never;
}

/** A fact without a known value, worded by the host. */
export interface NotKnownFact extends FactBase {
  readonly notKnown: string;
  readonly value?: never;
}

export type Fact = KnownFact | NotKnownFact;

export interface FactSheetProps {
  /** Facts in reading order. An empty list renders nothing. */
  readonly facts: readonly Fact[];
}
