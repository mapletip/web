import { Breadcrumbs, Button, Group, Stack, Text, Title } from '@mantine/core';
import type { DrillDownNode } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import { AnchorLink, ButtonLink } from '@/components/RouterLinks';
import { BUILDS, isBuildId, type BuildId } from '@/config/maplekit';

import { ExactIdNotice } from './ExactIdNotice';
import {
  DEFAULT_NAV_PARAMS,
  ITEM_NAV_TARGET,
  itemBuildRouteParam,
  type ItemNavRouteParams,
} from './navigation';
import type { ExactIdNoticeState } from './search';
import type { ItemBrowseSearch } from './search-params';

export interface ItemBrowseHeaderProps {
  readonly buildId: BuildId;
  readonly navTree: DrillDownNode<ItemNavRouteParams>;
  readonly navPath: readonly DrillDownNode<ItemNavRouteParams>[];
  readonly heading: string;
  readonly search: ItemBrowseSearch;
  readonly exactIdNotice: ExactIdNoticeState | null;
}

/** Renders category breadcrumbs and the build switcher above Items Browse. */
export function ItemBrowseHeader({
  buildId,
  navTree,
  navPath,
  heading,
  search,
  exactIdNotice,
}: ItemBrowseHeaderProps): ReactElement {
  const currentNode = navPath.at(-1) ?? navTree;
  const categoryParams = currentNode.meta ?? DEFAULT_NAV_PARAMS;

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

      <Group justify="space-between" align="baseline" wrap="wrap" gap="sm">
        <Title order={1}>{heading}</Title>
        <Button.Group aria-label="MapleStory game build">
          {Object.entries(BUILDS).map(([id, build]) => {
            if (!isBuildId(id)) return null;
            const active = id === buildId;
            return (
              <ButtonLink
                key={id}
                to={ITEM_NAV_TARGET}
                params={{
                  ...categoryParams,
                  buildId: itemBuildRouteParam({ buildId: id }),
                }}
                search={search}
                variant={active ? 'filled' : 'default'}
                aria-current={active ? 'page' : undefined}
              >
                {build.label}
              </ButtonLink>
            );
          })}
        </Button.Group>
      </Group>

      {exactIdNotice ? (
        <ExactIdNotice
          notice={exactIdNotice}
          navTree={navTree}
          search={search}
        />
      ) : null}
    </Stack>
  );
}
