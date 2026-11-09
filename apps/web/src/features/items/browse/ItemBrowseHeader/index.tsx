import { Anchor, Breadcrumbs, Group, Stack, Text, Title } from '@mantine/core';
import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';

import { getDropCoverageNotice } from '../facets';
import { ItemMobileNav } from '../ItemMobileNav';
import { ITEM_NAV_TARGET, type ItemNavScope } from '../navigation';
import type { ItemCategorySelection } from '../routing';

import classes from './styles.module.css';

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
  const isCw = buildId === 'cw-launch';
  const dropNotice = getDropCoverageNotice(coverage, category);
  const navSearch = { ...currentSearch };
  delete navSearch['page'];
  const buildParam = isCw ? undefined : buildId;
  const scopeSlug =
    category.scope.slug === 'all' ? undefined : category.scope.slug;
  const childSlug = category.child?.slug;

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

      <Group justify="space-between" align="baseline" wrap="wrap" gap="sm">
        <Title order={1}>{heading}</Title>
        <div
          className={classes['buildSwitcher']}
          role="group"
          aria-label="MapleStory game build"
        >
          <Link
            to={ITEM_NAV_TARGET}
            params={{
              buildId: undefined,
              scope: scopeSlug,
              child: childSlug,
            }}
            search={navSearch}
            className={classes['buildLink']}
            {...(isCw ? { 'aria-current': 'page' } : {})}
          >
            Classic World
          </Link>
          <Link
            to={ITEM_NAV_TARGET}
            params={{
              buildId: 'gms-v83',
              scope: scopeSlug,
              child: childSlug,
            }}
            search={navSearch}
            className={classes['buildLink']}
            {...(!isCw ? { 'aria-current': 'page' } : {})}
          >
            GMS v83
          </Link>
        </div>
      </Group>

      {dropNotice && (
        <Text size="sm" c="dimmed">
          {dropNotice}
        </Text>
      )}

      <ItemMobileNav navScopes={navScopes} />
    </Stack>
  );
}
