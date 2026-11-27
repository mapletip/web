import { Stack, Title } from '@mantine/core';
import {
  DrillDownNav,
  FacetedBrowser,
  RecordCard,
  Thumbnail,
  type BrowseState,
  type DrillDownNode,
  type DrawerOpenedChangeDetails,
  type FacetDefinition,
  type QueryFieldDefinition,
  type StateChangeDetails,
} from '@mapletip/component-library';
import { itemIconUrl, type ItemBrowseCoverage } from '@mapletip/data/items';
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

import { formatItemFacts, ItemDrawerBody } from './ItemDrawerBody';
import {
  ITEM_GROUPS,
  ITEM_GROUP_ROUTES,
  itemPageMetadata,
  itemPath,
  type ItemGroup,
} from './page';
import type { CategorizedItemRow } from './project';
import { createItemRelationReader } from './relations';
import { itemBrowseSearch, ITEM_SORT_OPTIONS } from './search-params';

interface ItemFrameProps {
  readonly buildId: BuildId;
  readonly rows: readonly CategorizedItemRow[];
  readonly coverage?: ItemBrowseCoverage | undefined;
  readonly group?: ItemGroup | undefined;
  readonly kind?: ItemKind | undefined;
  readonly all?: boolean;
  readonly search: BrowseSearch;
  readonly onSearchChange: (
    options: OnSearchChangeOptions,
  ) => void | Promise<void>;
}

const SUMMARY_NOUN = { one: 'Item', other: 'Items' } as const;
const CARD_COLUMNS = { base: 2, md: 4, lg: 5 } as const;
const KIND_LABELS: ReadonlyMap<string, string> = new Map(
  ITEM_KINDS.map((entry) => [entry.id, entry.label]),
);
const numberFormat = new Intl.NumberFormat('en-US');

const CATEGORY_QUERY_FIELDS: readonly QueryFieldDefinition<CategorizedItemRow>[] =
  ['name', { id: 'kindPath', accessor: 'kindPath', sortable: false }];

const ALL_QUERY_FIELDS: readonly QueryFieldDefinition<CategorizedItemRow>[] = [
  ...CATEGORY_QUERY_FIELDS,
  { id: 'kind', accessor: 'kind', sortable: false },
  {
    id: 'sourceId',
    accessor: 'sourceId',
    searchMatch: ({ value, query }) =>
      typeof value === 'string' && value.toLowerCase() === query,
  },
  {
    id: 'requiredByQuests',
    accessor: (row) => (row.neededForQuestCount ?? 0) > 0,
    sortable: false,
  },
  {
    id: 'usedInRecipes',
    accessor: (row) => (row.usedInRecipeCount ?? 0) > 0,
    sortable: false,
  },
  {
    id: 'questReward',
    accessor: (row) => (row.questRewardCount ?? 0) > 0,
    sortable: false,
  },
];

const CATEGORY_SEARCH_FIELDS = ['name'] as const;
const ALL_SEARCH_FIELDS = ['name', 'sourceId'] as const;
const EMPTY_FACETS: readonly FacetDefinition<CategorizedItemRow>[] = [];
const ALL_FACETS: readonly FacetDefinition<CategorizedItemRow>[] = [
  {
    id: 'kind',
    field: 'kind',
    label: 'Category',
    kind: 'multi-select',
    placement: 'results',
    // Same order as the rail: Use, ETC, Set-up, then Pets & Cash.
    options: ITEM_GROUPS.flatMap((group) =>
      ITEM_KINDS.filter((entry) => entry.group === group.id).map((entry) => ({
        value: entry.id,
        label: entry.label,
      })),
    ),
  },
  {
    id: 'required-by-quests',
    field: 'requiredByQuests',
    label: 'Required by quests',
    kind: 'boolean',
  },
  {
    id: 'used-in-recipes',
    field: 'usedInRecipes',
    label: 'Used in recipes',
    kind: 'boolean',
  },
  {
    id: 'quest-reward',
    field: 'questReward',
    label: 'Quest reward',
    kind: 'boolean',
  },
];

/** First published fact shown on cross-category picture cards, or undefined if none. */
export function itemPrimaryFact({
  record,
}: {
  readonly record: CategorizedItemRow;
}): string | undefined {
  if (
    record.hp !== undefined ||
    record.hpPercent !== undefined ||
    record.mp !== undefined ||
    record.mpPercent !== undefined ||
    (record.buff !== undefined && record.buff.effects.length > 0) ||
    record.attack !== undefined
  ) {
    return formatItemFacts({ record })[0];
  }
  if (record.success !== undefined) {
    return `${numberFormat.format(record.success)}% success`;
  }
  if (record.seatHp !== undefined || record.seatMp !== undefined) {
    const parts = [
      record.seatHp === undefined
        ? undefined
        : `+${numberFormat.format(record.seatHp)} HP`,
      record.seatMp === undefined
        ? undefined
        : `+${numberFormat.format(record.seatMp)} MP`,
    ].filter((part): part is string => part !== undefined);
    return parts.join(', ');
  }
  if (record.fullness !== undefined) {
    return `Restores ${numberFormat.format(record.fullness)} fullness`;
  }
  if ((record.neededForQuestCount ?? 0) > 0) {
    return record.neededForQuestCount === 1
      ? 'Required by a quest'
      : `Required by ${numberFormat.format(record.neededForQuestCount!)} quests`;
  }
  if ((record.usedInRecipeCount ?? 0) > 0) {
    return record.usedInRecipeCount === 1
      ? 'Used in a recipe'
      : `Used in ${numberFormat.format(record.usedInRecipeCount!)} recipes`;
  }
  if ((record.monsterDropCount ?? 0) > 0) {
    return record.monsterDropCount === 1
      ? 'Dropped by a monster'
      : `Dropped by ${numberFormat.format(record.monsterDropCount!)} monsters`;
  }
  return formatItemFacts({ record })[0];
}

function itemNavigationTree({
  buildId,
  nonEmptyKinds,
  currentId,
  counts,
}: {
  readonly buildId: BuildId;
  readonly nonEmptyKinds: ReadonlySet<string>;
  readonly currentId: string;
  readonly counts: ReadonlyMap<string, number> | undefined;
}): DrillDownNode {
  return {
    id: 'all',
    label: 'All items',
    href: `${itemPath({ buildId })}/all`,
    count: counts?.get('all') ?? 0,
    children: ITEM_GROUPS.map((entry) => ({
      id: entry.id,
      label: entry.label,
      href: itemPath({ buildId, group: entry.id }),
      count: counts?.get(entry.id) ?? 0,
      children: ITEM_KINDS.filter(
        (candidate) =>
          candidate.group === entry.id &&
          (nonEmptyKinds.has(candidate.id) || candidate.id === currentId),
      ).map((candidate) => ({
        id: candidate.id,
        label: candidate.label,
        href: itemPath({ buildId, group: entry.id, kind: candidate.slug }),
        count: counts?.get(candidate.id) ?? 0,
      })),
    })),
  };
}

/** Shared group and category results, driven by the category registry. */
export function ItemFrame({
  buildId,
  rows,
  coverage,
  group,
  kind,
  all = false,
  search,
  onSearchChange,
}: ItemFrameProps) {
  const router = useRouter();
  const overlay = useRouteOverlay(browseOverlayOptions);
  const relationReader = useMemo(
    () => createItemRelationReader(buildId),
    [buildId],
  );
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
  const nonEmptyKinds = useMemo(
    () => new Set(rows.map((row) => row.kind)),
    [rows],
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
  const facets = useMemo(() => {
    if (!all) return EMPTY_FACETS;
    if (coverage?.relationships['used-in-recipe'] === 'unsupported') {
      return ALL_FACETS.filter((facet) => facet.id !== 'used-in-recipes');
    }
    return ALL_FACETS;
  }, [all, coverage]);
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
                              to: ITEM_GROUP_ROUTES[group],
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
              root={itemNavigationTree({
                buildId,
                nonEmptyKinds,
                currentId,
                counts: context.counts,
              })}
              currentId={
                context.mode === 'drawer' ? context.selectedId : currentId
              }
              label="Item categories"
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
        queryFields={all ? ALL_QUERY_FIELDS : CATEGORY_QUERY_FIELDS}
        searchFields={all ? ALL_SEARCH_FIELDS : CATEGORY_SEARCH_FIELDS}
        facets={facets}
        sortOptions={ITEM_SORT_OPTIONS}
        recordNoun={`${BUILDS[buildId].label} items`}
        summaryMode="total"
        summaryNoun={SUMMARY_NOUN}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        presentation="cards"
        cardColumns={CARD_COLUMNS}
        renderCard={(record, { openDetails, isDetailsOpen }) => {
          const secondaryLine = all ? itemPrimaryFact({ record }) : undefined;
          return (
            <RecordCard
              layout="picture"
              title={record.name}
              leadLine={KIND_LABELS.get(record.kind)}
              {...(secondaryLine === undefined ? {} : { secondaryLine })}
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
          );
        }}
        recordDetailsTitle={(record) => record.name}
        recordDetailsSideOnDesktop
        recordDetailsSideSize="md"
        recordDetailsContent={(record) => (
          <ItemDrawerBody
            record={record}
            categoryLabel={KIND_LABELS.get(record.kind)}
            reader={relationReader}
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
