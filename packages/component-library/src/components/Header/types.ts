import type { ReactNode } from 'react';

interface HeaderLinkBase {
  readonly id: string;
  readonly label: string;
  /** The host marks the section containing the current destination. */
  readonly active?: boolean;
  /** The host marks the exact current page. */
  readonly current?: boolean;
}

/** A destination rendered below a top-level navigation item. */
export interface HeaderSubLink extends HeaderLinkBase {
  readonly href: string;
}

/** A directly navigable top-level destination. */
export interface HeaderLeafLink extends HeaderSubLink {
  readonly children?: never;
}

/** A top-level disclosure group with one level of child destinations. */
export interface HeaderGroupLink extends HeaderLinkBase {
  /**
   * Optional parent destination. Omit it when the group label should only
   * disclose children, as in a category that has no landing page.
   */
  readonly href?: string;
  readonly children: readonly HeaderSubLink[];
}

export type HeaderLink = HeaderLeafLink | HeaderGroupLink;

/**
 * Presentation props the Header would apply to an ordinary anchor. A host
 * adapter can forward these to a router link without the library importing the
 * router or duplicating Header markup.
 */
export interface HeaderLinkRenderProps {
  /** Fully built destination, including path parameters and search/hash. */
  readonly href: string;
  readonly className: string;
  readonly 'aria-current': 'page' | undefined;
  readonly 'data-active': 'true' | undefined;
  readonly onClick: (() => void) | undefined;
}

export type HeaderLinkRenderer = (
  link: HeaderSubLink,
  props: HeaderLinkRenderProps,
) => ReactNode;

export interface HeaderProps {
  /**
   * The host-owned brand element. Provide the whole navigable element, usually
   * an anchor containing the mark and name; Header only owns its placement.
   */
  readonly brand: ReactNode;
  /** Ordered host-owned destinations. Children are limited to one level. */
  readonly navigation?: readonly HeaderLink[];
  /**
   * Host-owned utility content. It is mounted once: in the desktop header, or
   * in the mobile drawer while that drawer is open. It may remount when moving
   * between locations, so persistent state belongs to the host.
   */
  readonly utility?: ReactNode;
  /** Accessible name for the primary navigation landmark. */
  readonly navigationLabel?: string;
  /**
   * Optional router-aware replacement for the default anchor. Forward every
   * supplied prop, including `onClick`, so disclosures and the drawer close on
   * navigation. TanStack Router hosts should split the built `href` into
   * `Link`'s `to`, `search` and `hash` options.
   */
  readonly renderLink?: HeaderLinkRenderer;
}
