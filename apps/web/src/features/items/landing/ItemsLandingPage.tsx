import { Paper, SimpleGrid, Stack, Title } from '@mantine/core';
import { Thumbnail } from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';
import { Link } from '@tanstack/react-router';
import { useMemo, type ReactElement } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import { canonicalBuildParam, DetailBreadcrumbs } from '@/features/detail';

import {
  ITEM_GROUPS,
  ITEM_GROUP_ROUTES,
  itemPageMetadata,
} from '../browse/page';
import type { CategorizedItemRow } from '../browse/project';
import { itemBrowseSearch } from '../browse/search-params';
import { ITEM_KINDS } from '../kinds';
import type { ItemKind } from '../kinds/types';

import classes from './ItemsLandingPage.module.css';

interface ItemsLandingPageProps {
  readonly buildId: BuildId;
  readonly rows: readonly CategorizedItemRow[];
}

interface DirectoryCategory {
  readonly kind: ItemKind;
  readonly count: number;
}

interface DirectoryPanel {
  readonly group: (typeof ITEM_GROUPS)[number];
  readonly count: number;
  readonly categories: readonly DirectoryCategory[];
}

const numberFormat = new Intl.NumberFormat('en-US');

function buildDirectoryPanels({
  rows,
}: {
  readonly rows: readonly CategorizedItemRow[];
}): readonly DirectoryPanel[] {
  const countsByKind = new Map<string, number>();
  for (const row of rows) {
    countsByKind.set(row.kind, (countsByKind.get(row.kind) ?? 0) + 1);
  }

  return ITEM_GROUPS.map((group) => {
    const categories: DirectoryCategory[] = [];
    let count = 0;

    for (const kind of ITEM_KINDS) {
      if (kind.group !== group.id) continue;
      const kindCount = countsByKind.get(kind.id) ?? 0;
      if (kindCount === 0) continue;
      categories.push({ kind, count: kindCount });
      count += kindCount;
    }

    return { group, count, categories };
  });
}

/** Four-panel category directory for the Items landing page. */
export function ItemsLandingPage({
  buildId,
  rows,
}: ItemsLandingPageProps): ReactElement {
  const { heading } = itemPageMetadata({ buildId, all: false });
  const buildParam = canonicalBuildParam(buildId);
  const panels = useMemo(() => buildDirectoryPanels({ rows }), [rows]);

  return (
    <BrowsePageShell fillViewport={false}>
      <Stack gap="lg">
        <Stack gap="sm">
          <DetailBreadcrumbs
            items={[
              { label: 'Home', linkProps: { to: '/' } },
              { label: 'Items' },
            ]}
          />
          <Title order={1}>{heading}</Title>
        </Stack>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {panels.map((panel) => {
            const headingId = `items-group-${panel.group.id}`;
            return (
              <Paper
                key={panel.group.id}
                component="section"
                withBorder
                radius="md"
                p="md"
                className={classes['panel']}
                aria-labelledby={headingId}
              >
                <Title
                  order={2}
                  size="h4"
                  id={headingId}
                  className={classes['panelTitle']}
                >
                  <Link
                    to={ITEM_GROUP_ROUTES[panel.group.id]}
                    params={{ buildId: buildParam, kind: undefined }}
                    search={itemBrowseSearch.defaultSearch}
                    className={classes['panelHeadingLink']}
                  >
                    <span className={classes['label']}>
                      {panel.group.label}
                    </span>
                    <span className={classes['count']}>
                      {numberFormat.format(panel.count)}
                    </span>
                  </Link>
                </Title>
                <ul className={classes['list']}>
                  {panel.categories.map(({ kind, count }) => (
                    <li key={kind.id} className={classes['item']}>
                      <Link
                        to={ITEM_GROUP_ROUTES[panel.group.id]}
                        params={{ buildId: buildParam, kind: kind.slug }}
                        search={itemBrowseSearch.defaultSearch}
                        className={classes['categoryLink']}
                      >
                        <Thumbnail
                          src={
                            kind.iconContentId === undefined
                              ? undefined
                              : itemIconUrl(
                                  MAPLEKIT_RELEASE.baseUrl,
                                  kind.iconContentId,
                                )
                          }
                          size={32}
                        />
                        <span className={classes['label']}>{kind.label}</span>
                        <span className={classes['count']}>
                          {numberFormat.format(count)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Paper>
            );
          })}
        </SimpleGrid>
      </Stack>
    </BrowsePageShell>
  );
}
