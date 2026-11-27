import { Stack, Title } from '@mantine/core';
import {
  DrillDownNav,
  FacetedBrowser,
  RecordCard,
  Thumbnail,
  type BrowseState,
  type DrillDownNode,
  type DrawerOpenedChangeDetails,
  type StateChangeDetails,
} from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';
import { Link, useRouter } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { BUILDS, MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import {
  PAGE_SIZE_OPTIONS,
  type BrowseSearch,
} from '@/features/browse/search-params';
import {
  useBrowseUrlState,
  type OnSearchChangeOptions,
} from '@/features/browse/useBrowseUrlState';
import { browseOverlayOptions } from '@/features/browse-overlay/browseOverlay';
import { canonicalBuildParam, DetailBreadcrumbs } from '@/features/detail';
import { useRouteOverlay } from '@/features/route-overlay/useRouteOverlay';

import { ITEM_KINDS } from '../kinds';
import type { ItemKind } from '../kinds/types';

import { ItemDrawerBody } from './ItemDrawerBody';
import {
  ITEM_GROUPS,
  itemPageMetadata,
  itemPath,
  type ItemGroup,
} from './page';
import type { CategorizedItemRow } from './project';
import { itemBrowseSearch, ITEM_SORT_OPTIONS } from './search-params';

interface ItemFrameProps {
  readonly buildId: BuildId;
  readonly rows: readonly CategorizedItemRow[];
  readonly group?: ItemGroup | undefined;
  readonly kind?: ItemKind | undefined;
  readonly all?: boolean;
  readonly search: BrowseSearch;
  readonly onSearchChange: (
    options: OnSearchChangeOptions,
  ) => void | Promise<void>;
}

const GROUP_ROUTES = {
  use: '/maplestory/{-$buildId}/items/use/{-$kind}',
  etc: '/maplestory/{-$buildId}/items/etc/{-$kind}',
  setup: '/maplestory/{-$buildId}/items/setup/{-$kind}',
  cash: '/maplestory/{-$buildId}/items/cash/{-$kind}',
} as const satisfies Record<ItemGroup, string>;

const SUMMARY_NOUN = { one: 'Item', other: 'Items' } as const;
const CARD_COLUMNS = { base: 2, md: 4, lg: 5 } as const;
const KIND_LABELS: ReadonlyMap<string, string> = new Map(
  ITEM_KINDS.map((entry) => [entry.id, entry.label]),
);

/** Shared group and category results, driven by the category registry. */
export function ItemFrame({
  buildId,
  rows,
  group,
  kind,
  all = false,
  search,
  onSearchChange,
}: ItemFrameProps) {
  const router = useRouter();
  const overlay = useRouteOverlay(browseOverlayOptions);
  const { browseState, handleStateChange: commitState } = useBrowseUrlState({
    address: itemBrowseSearch,
    search,
    onSearchChange,
  });
  const groupLabel = ITEM_GROUPS.find((entry) => entry.id === group)?.label;
  const label = kind?.label ?? (all ? 'All items' : (groupLabel ?? 'Items'));
  const { heading } = itemPageMetadata({
    buildId,
    group,
    slug: kind?.slug,
    all,
  });
  const tree = useMemo(
    (): DrillDownNode => ({
      id: 'all',
      label: 'All items',
      href: `${itemPath({ buildId })}/all`,
      count: rows.length,
      children: ITEM_GROUPS.map((entry) => ({
        id: entry.id,
        label: entry.label,
        href: itemPath({ buildId, group: entry.id }),
        count: rows.filter((row) => row.kindPath[1] === entry.id).length,
        children: ITEM_KINDS.filter(
          (candidate) => candidate.group === entry.id,
        ).map((candidate) => ({
          id: candidate.id,
          label: candidate.label,
          href: itemPath({ buildId, group: entry.id, kind: candidate.slug }),
          count: rows.filter((row) => row.kind === candidate.id).length,
        })),
      })),
    }),
    [buildId, rows],
  );
  const currentId = kind?.id ?? group ?? 'all';
  const navSearch = itemBrowseSearch.browseStateToUrl({
    state: {
      ...browseState,
      filters: {},
      sort:
        browseState.sort?.field === 'name'
          ? browseState.sort
          : itemBrowseSearch.defaultState.sort,
    },
    includePage: false,
  });
  const navigateNode = useCallback(
    (id: string, options: { readonly replace: true }) => {
      const target = ITEM_KINDS.find((candidate) => candidate.id === id);
      const targetGroup =
        target?.group ?? ITEM_GROUPS.find((entry) => entry.id === id)?.id;
      void router.navigate({
        to:
          itemPath({ buildId, group: targetGroup, kind: target?.slug }) +
          (id === 'all' ? '/all' : ''),
        search: navSearch,
        replace: options.replace,
      });
    },
    [buildId, navSearch, router],
  );
  const onStateChange = useCallback(
    (state: BrowseState, details?: StateChangeDetails) => {
      if (details?.reason === 'apply') {
        void overlay.apply('filters', () => commitState(state, details));
        return;
      }
      void commitState(state, details);
    },
    [commitState, overlay],
  );
  const onFilterDrawerOpenedChange = useCallback(
    (opened: boolean, details?: DrawerOpenedChangeDetails) => {
      if (opened) overlay.open({ type: 'filters' });
      else if (details?.reason === 'invalidate')
        void overlay.invalidate('filters');
      else if (details?.reason !== 'apply') overlay.dismiss('filters');
    },
    [overlay],
  );
  const details =
    overlay.overlay?.type === 'record-details' ? overlay.overlay : undefined;

  return (
    <BrowsePageShell fillViewport={false}>
      <FacetedBrowser
        title={
          <Stack gap="sm">
            <DetailBreadcrumbs
              items={[
                { label: 'Home', linkProps: { to: '/' } },
                {
                  label: 'Items',
                  linkProps: {
                    to: '/maplestory/{-$buildId}/items',
                    params: { buildId: canonicalBuildParam(buildId) },
                  },
                },
                ...(all ? [{ label: 'All items' }] : []),
                ...(group === undefined || groupLabel === undefined
                  ? []
                  : [
                      kind === undefined
                        ? { label: groupLabel }
                        : {
                            label: groupLabel,
                            linkProps: {
                              to: GROUP_ROUTES[group],
                              params: {
                                buildId: canonicalBuildParam(buildId),
                                kind: undefined,
                              },
                            },
                          },
                    ]),
                ...(kind === undefined ? [] : [{ label: kind.label }]),
              ]}
            />
            <Title order={1}>{heading}</Title>
          </Stack>
        }
        navigation={{
          label: 'Item categories',
          currentLabel: label,
          currentId,
          field: 'kindPath',
          apply: navigateNode,
          opened: overlay.overlay?.type === 'navigation',
          onOpenedChange: (opened, reason) => {
            if (opened) overlay.open({ type: 'navigation' });
            else if (reason === 'dismiss') overlay.dismiss('navigation');
          },
          render: (context) => (
            <DrillDownNav
              root={tree}
              currentId={
                context.mode === 'drawer' ? context.selectedId : currentId
              }
              label="Item categories"
              hideEmpty
              {...(context.mode === 'drawer'
                ? { onSelect: context.onSelect }
                : {
                    onNavigate: context.onNavigate,
                    renderLink: (node, props) => (
                      <Link
                        to={node.href}
                        search={navSearch}
                        activeOptions={{ exact: true }}
                        className={props.className}
                        aria-current={props['aria-current']}
                        onClick={props.onClick}
                      >
                        {props.children}
                      </Link>
                    ),
                  })}
            />
          ),
        }}
        records={rows}
        idAccessor="sourceId"
        queryFields={[
          'name',
          { id: 'kindPath', accessor: 'kindPath', sortable: false },
        ]}
        searchFields={['name']}
        facets={[]}
        sortOptions={ITEM_SORT_OPTIONS}
        recordNoun={`${BUILDS[buildId].label} items`}
        summaryMode="total"
        summaryNoun={SUMMARY_NOUN}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        presentation="cards"
        cardColumns={CARD_COLUMNS}
        renderCard={(record, { openDetails, isDetailsOpen }) => (
          <RecordCard
            layout="picture"
            title={record.name}
            leadLine={KIND_LABELS.get(record.kind)}
            media={
              <Thumbnail
                src={
                  record.icon === undefined
                    ? undefined
                    : itemIconUrl(MAPLEKIT_RELEASE.baseUrl, record.icon)
                }
                size={80}
                magnify={2}
              />
            }
            {...(openDetails === undefined
              ? {}
              : { action: openDetails, isDetailsOpen })}
          />
        )}
        recordDetailsTitle={(record) => record.name}
        recordDetailsSideOnDesktop
        recordDetailsSideSize="md"
        recordDetailsContent={(record) => (
          <ItemDrawerBody
            record={record}
            categoryLabel={KIND_LABELS.get(record.kind)}
          />
        )}
        recordDetails={{
          selectedId: details?.recordId ?? null,
          onSelectedIdChange: (selectedId, reason) => {
            if (reason === 'open' && selectedId !== null) {
              overlay.open({ type: 'record-details', recordId: selectedId });
            } else if (reason === 'invalidate') {
              void overlay.invalidate('record-details');
            } else if (reason === 'dismiss') {
              overlay.dismiss('record-details');
            }
          },
        }}
        state={browseState}
        onStateChange={onStateChange}
        drawerOpened={overlay.overlay?.type === 'filters'}
        onDrawerOpenedChange={onFilterDrawerOpenedChange}
        renderPageLink={({ page, state, props }) => {
          const { target, disabled, ...linkProps } = props;
          const routerLinkProps: Omit<typeof linkProps, 'href'> = linkProps;
          return (
            <Link
              to="."
              search={itemBrowseSearch.browseStateToUrl({
                state: { ...state, page },
              })}
              {...routerLinkProps}
              {...(target === undefined ? {} : { target })}
              {...(disabled === undefined ? {} : { disabled })}
            />
          );
        }}
      />
    </BrowsePageShell>
  );
}
