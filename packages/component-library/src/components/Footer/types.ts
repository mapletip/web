import type { ReactNode } from 'react';

/** A host-owned destination rendered inside a Footer navigation group. */
export interface FooterLink {
  readonly id: string;
  readonly label: string;
  /** Fully built destination. The Footer never rewrites or classifies it. */
  readonly href: string;
}

/** An ordered, host-named group of Footer destinations. */
export interface FooterGroup {
  readonly id: string;
  readonly title: string;
  readonly links: readonly FooterLink[];
}

/**
 * Presentation props the Footer applies to an ordinary anchor. A host adapter
 * can forward these to a router link without the library importing the router
 * or duplicating Footer markup.
 */
export interface FooterLinkRenderProps {
  /** Fully built destination, including path parameters and search/hash. */
  readonly href: string;
  readonly className: string;
  /** Library-constructed link contents. Render this rather than rebuilding it. */
  readonly children: ReactNode;
}

export type FooterLinkRenderer = (
  link: FooterLink,
  props: FooterLinkRenderProps,
) => ReactNode;

export interface FooterProps {
  /**
   * The host-owned brand element. Provide the whole element, usually an anchor
   * containing the mark and name; Footer only owns its placement.
   */
  readonly brand?: ReactNode;
  /** Optional host-owned supporting text below the brand. */
  readonly description?: ReactNode;
  /** Ordered host-owned navigation groups. Groups without links are omitted. */
  readonly groups?: readonly FooterGroup[];
  /** Optional host-owned legal, policy and attribution content. */
  readonly legal?: ReactNode;
  /**
   * Heading level for visible group titles. Keep it compatible with the host
   * page's heading outline; defaults to 2.
   */
  readonly headingLevel?: 2 | 3 | 4 | 5 | 6;
  /**
   * Optional router-aware replacement for the default anchor. Forward every
   * supplied prop, including `children`, so Footer presentation is retained.
   * TanStack Router hosts should split the built `href` into `Link`'s `to`,
   * `search` and `hash` options.
   */
  readonly renderLink?: FooterLinkRenderer;
}
