import { Breadcrumbs, Stack, Text, Title } from '@mantine/core';
import type { DrillDownNode } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import { AnchorLink } from '@/components/RouterLinks';

import { DEFAULT_NAV_PARAMS, ITEM_NAV_TARGET } from './navigation';
import type { ItemNavRouteParams } from './navigation';
import type { ItemBrowseSearch } from './search-params';

export interface ItemBrowseHeaderProps {
  readonly navPath: readonly DrillDownNode<ItemNavRouteParams>[];
  readonly heading: string;
  readonly search: ItemBrowseSearch;
}

/** Renders category breadcrumbs and the title above Items Browse. */
export function ItemBrowseHeader({
  navPath,
  heading,
  search,
}: ItemBrowseHeaderProps): ReactElement {
  return (
    <Stack gap="sm">
      <Breadcrumbs separator="/" aria-label="Breadcrumb">
        {navPath.map((node, index) => {
          if (index === navPath.length - 1) {
            return (
              <Text key={node.id} size="sm">
                {node.label}
              </Text>
            );
          }
          return (
            <AnchorLink
              key={node.id}
              to={ITEM_NAV_TARGET}
              params={node.meta ?? DEFAULT_NAV_PARAMS}
              search={search}
              activeOptions={{ exact: true }}
              size="sm"
            >
              {node.label}
            </AnchorLink>
          );
        })}
      </Breadcrumbs>

      <Title order={1}>{heading}</Title>
    </Stack>
  );
}
