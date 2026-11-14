import { SITE_ORIGIN } from '@/config/site';

export interface DetailBreadcrumbItem {
  readonly label: string;
  readonly path: string;
}

export interface BuildDetailHeadOptions {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath: string;
  readonly ogType: string;
  readonly noIndex?: boolean;
  readonly breadcrumbs?: readonly DetailBreadcrumbItem[];
}

export type DetailHeadMeta =
  | { readonly title: string }
  | { readonly name: string; readonly content: string }
  | { readonly property: string; readonly content: string };

export interface DetailHeadLink {
  readonly rel: 'canonical';
  readonly href: string;
}

export interface DetailHeadScript {
  readonly type: 'application/ld+json';
  readonly children: string;
}

export interface DetailHeadPayload {
  readonly meta: readonly DetailHeadMeta[];
  readonly links: readonly DetailHeadLink[];
  readonly scripts: readonly DetailHeadScript[];
}

/**
 * Build TanStack Router `head` metadata, canonical link, and optional
 * Schema.org `BreadcrumbList` JSON-LD for a record detail page.
 */
export function buildDetailHead({
  title,
  description,
  canonicalPath,
  ogType,
  noIndex = false,
  breadcrumbs,
}: BuildDetailHeadOptions): DetailHeadPayload {
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;
  const meta: DetailHeadMeta[] = [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: ogType },
    { property: 'og:url', content: canonicalUrl },
  ];

  if (noIndex) {
    meta.push({ name: 'robots', content: 'noindex,follow' });
  }

  const scripts: DetailHeadScript[] =
    breadcrumbs && breadcrumbs.length > 0
      ? [
          {
            type: 'application/ld+json',
            children: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: breadcrumbs.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.label,
                item: `${SITE_ORIGIN}${item.path}`,
              })),
            }),
          },
        ]
      : [];

  return {
    meta,
    links: [{ rel: 'canonical', href: canonicalUrl }],
    scripts,
  };
}
