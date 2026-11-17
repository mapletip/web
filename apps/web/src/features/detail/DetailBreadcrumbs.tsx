import { Anchor, Breadcrumbs, Text } from '@mantine/core';
import type { LinkOptions } from '@tanstack/react-router';
import type { ComponentProps, ReactElement } from 'react';

import { AnchorLink } from '@/components/RouterLinks';

import type { DetailBreadcrumbItem } from './head';

export type DetailLinkProps = LinkOptions &
  Omit<ComponentProps<typeof AnchorLink>, 'children' | keyof LinkOptions>;

export interface DetailBreadcrumb extends DetailBreadcrumbItem {
  readonly linkProps?: DetailLinkProps;
}

export interface DetailBreadcrumbsProps {
  readonly items: readonly DetailBreadcrumb[];
}

/**
 * Accessible breadcrumb navigation for record detail pages. Uses SPA router
 * links when `linkProps` is provided and falls back to plain anchors otherwise.
 */
export function DetailBreadcrumbs({
  items,
}: DetailBreadcrumbsProps): ReactElement {
  return (
    <nav aria-label="Breadcrumb">
      <Breadcrumbs separator="/">
        {items.map((item, index) => {
          const key = `${index}:${item.label}`;
          if (index === items.length - 1) {
            return (
              <Text key={key} size="sm" aria-current="page">
                {item.label}
              </Text>
            );
          }
          if (item.linkProps) {
            return (
              <AnchorLink key={key} size="sm" {...item.linkProps}>
                {item.label}
              </AnchorLink>
            );
          }
          if (item.path === undefined) {
            return (
              <Text key={key} size="sm">
                {item.label}
              </Text>
            );
          }
          return (
            <Anchor key={key} href={item.path} size="sm">
              {item.label}
            </Anchor>
          );
        })}
      </Breadcrumbs>
    </nav>
  );
}
