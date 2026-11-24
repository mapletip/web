import { BUILDS, DEFAULT_BUILD_ID, type BuildId } from '@/config/maplekit';
import { SITE_ORIGIN } from '@/config/site';

export interface BrowsePageMetadata {
  readonly heading: string;
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
  readonly robots: 'index,follow' | 'noindex,follow';
}

export interface BrowsePageMetadataOptions {
  readonly buildId: BuildId;
  /** What the page lists, as a heading noun: "Items", "Chairs", "Henesys Maps". */
  readonly topic: string;
  /** Site path of the page's canonical (default) view. */
  readonly path: string;
  /** Defaults to "Browse {build} {topic} in MapleStory." */
  readonly description?: string;
  /** False for a search, filter, non-default option or later page. */
  readonly isDefaultView?: boolean;
}

/**
 * Head copy shared by browse pages. Only the default build's default view is
 * indexed; every other view points at its page's canonical address.
 */
export function browsePageMetadata({
  buildId,
  topic,
  path,
  description,
  isDefaultView = true,
}: BrowsePageMetadataOptions): BrowsePageMetadata {
  const { label: buildLabel } = BUILDS[buildId];
  const heading = `MapleStory ${buildLabel} ${topic}`;

  return {
    heading,
    title: `${heading} – MapleTip`,
    description:
      description ??
      `Browse ${buildLabel} ${topic.toLowerCase()} in MapleStory.`,
    canonicalUrl: `${SITE_ORIGIN}${path}`,
    robots:
      buildId === DEFAULT_BUILD_ID && isDefaultView
        ? 'index,follow'
        : 'noindex,follow',
  };
}
