import type { ReactNode } from 'react';

export type RecordSectionCount = number | 'unknown';

export interface RecordSection {
  /** Stable id used by the section heading and its in-page navigation link. */
  readonly id: string;
  /** Section title shown in the navigation and heading. */
  readonly title: string;
  /** Optional decorative icon shown beside the title. */
  readonly icon?: ReactNode;
  /** Omit when no count should be shown; use `unknown` to show `?`. */
  readonly count?: RecordSectionCount;
  /** Section content. The host owns empty and unavailable wording. */
  readonly content: ReactNode;
}

export interface RecordSectionsProps {
  /** Sections in both navigation and page order. Omit a section to hide it. */
  readonly sections: readonly RecordSection[];
}
