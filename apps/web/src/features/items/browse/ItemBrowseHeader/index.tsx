import { Anchor, Breadcrumbs, Stack, Text, Title } from '@mantine/core';
import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';

import { getDropCoverageNotice } from '../facets';
import { ItemMobileNav } from '../ItemMobileNav';
import { ITEM_NAV_TARGET, type ItemNavScope } from '../navigation';
import type { ItemCategorySelection } from '../routing';

export interface ItemBrowseHeaderProps {
  readonly buildId: BuildId;
  readonly coverage: ItemBrowseCoverage;
  readonly category: ItemCategorySelection;
  readonly heading: string;
  readonly navScopes: readonly ItemNavScope[];
  readonly currentSearch?: Record<string, unknown> | undefined;
}

export function ItemBrowseHeader({
  buildId,
  coverage,
  category,
  heading,
  navScopes,
  currentSearch,
}: ItemBrowseHeaderProps): ReactElement {
  const dropNotice = getDropCoverageNotice(coverage, category);
  const navSearch = { ...currentSearch };
  delete navSearch['page'];
  const buildParam = buildId === 'cw-launch' ? undefined : buildId;

  const breadcrumbs = [
    <Anchor
      key="home"
      renderRoot={(props) => <Link to="/" {...props} />}
      size="sm"
    >
      Home
    </Anchor>,
    category.scope.slug === 'all' && !category.child ? (
      <Text key="items" size="sm">
        Items
      </Text>
    ) : (
      <Anchor
        key="items"
        renderRoot={(props) => (
          <Link
            to={ITEM_NAV_TARGET}
            params={{
              buildId: buildParam,
              scope: undefined,
              child: undefined,
            }}
            search={navSearch}
            {...props}
          />
        )}
        size="sm"
      >
        Items
      </Anchor>
    ),
  ];

  if (category.scope.slug !== 'all') {
    if (category.child) {
      breadcrumbs.push(
        <Anchor
          key="scope"
          renderRoot={(props) => (
            <Link
              to={ITEM_NAV_TARGET}
              params={{
                buildId: buildParam,
                scope: category.scope.slug,
                child: undefined,
              }}
              search={navSearch}
              {...props}
            />
          )}
          size="sm"
        >
          {category.scope.label}
        </Anchor>,
      );
      breadcrumbs.push(
        <Text key="child" size="sm">
          {category.child.label}
        </Text>,
      );
    } else {
      breadcrumbs.push(
        <Text key="scope" size="sm">
          {category.scope.label}
        </Text>,
      );
    }
  }

  return (
    <Stack gap="sm">
      <Breadcrumbs separator="/" aria-label="Breadcrumb">
        {breadcrumbs}
      </Breadcrumbs>

      <Title order={1}>{heading}</Title>

      {dropNotice && (
        <Text size="sm" c="dimmed">
          {dropNotice}
        </Text>
      )}

      <ItemMobileNav navScopes={navScopes} />
    </Stack>
  );
}
