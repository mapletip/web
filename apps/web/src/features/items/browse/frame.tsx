import { Stack, Title } from '@mantine/core';
import {
  DrillDownNav,
  FacetedBrowser,
  type BrowseState,
  type DrillDownNode,
  type DrawerOpenedChangeDetails,
  type FacetDefinition,
  type QueryFieldDefinition,
  type StateChangeDetails,
} from '@mapletip/component-library';
import type {
  ItemBrowseCoverage,
  StaticItemBrowseV2_2,
} from '@mapletip/data/items';
import { Link, useRouter } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { BUILDS, type BuildId } from '@/config/maplekit';
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

import { ITEM_KINDS, ITEM_KINDS_BY_ID } from '../kinds';
import { relationFilter, relationQueryField } from '../kinds/relation-filter';
import type { ItemKind } from '../kinds/types';

import { formatFullness } from './fullness';
import { itemCardColumns, ITEM_KIND_LABELS, renderItemCard } from './item-card';
import { formatItemFacts, ItemDrawerBody } from './ItemDrawerBody';
import { ItemsGroupShelves } from './ItemsGroupPage';
import { numberFormat } from './number-format';
import {
  ITEM_GROUPS,
  ITEM_GROUP_ROUTES,
  itemPageMetadata,
  itemPath,
  type ItemGroup,
} from './page';
import type { CategorizedItemRow } from './project';
import type { ProjectedRelations } from './relation-projection';
import { createItemRelationReader } from './relations';
import { itemBrowseSearch, ITEM_SORT_OPTIONS } from './search-params';

interface ItemFrameProps {
  readonly buildId: BuildId;
  readonly rows: readonly CategorizedItemRow[];
  readonly coverage?: ItemBrowseCoverage | undefined;
  readonly scrollTargetIcons?: StaticItemBrowseV2_2['scrollTargetIcons'];
  readonly relations?: ProjectedRelations | undefined;
  readonly descriptions?: Readonly<Record<string, string>>;
  readonly group?: ItemGroup | undefined;
  readonly kind?: ItemKind | undefined;
  readonly all?: boolean;
  readonly search: BrowseSearch;
  readonly onSearchChange: (
    options: OnSearchChangeOptions,
  ) => void | Promise<void>;
}

const SUMMARY_NOUN = { one: 'Item', other: 'Items' } as const;
const itemKinds: readonly ItemKind[] = ITEM_KINDS;

const CATEGORY_QUERY_FIELDS: readonly QueryFieldDefinition<CategorizedItemRow>[] =
  [
    'name',
    { id: 'kindPath', accessor: 'kindPath', sortable: false },
    {
      id: 'questReward',
      accessor: (row) => (row.questRewardCount ?? 0) > 0,
      sortable: false,
    },
  ];

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
];

const CATEGORY_SEARCH_FIELDS = ['name'] as const;
const ALL_SEARCH_FIELDS = ['name', 'sourceId'] as const;
const QUEST_REWARD_FACET: FacetDefinition<CategorizedItemRow> = {
  id: 'quest-reward',
  field: 'questReward',
  label: 'Quest reward',
  kind: 'boolean',
};
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
  QUEST_REWARD_FACET,
];

export function categoryFacets({
  rows,
  kind,
  coverage,
  relations = {},
}: {
  readonly rows: readonly CategorizedItemRow[];
  readonly kind: ItemKind | undefined;
  readonly coverage: ItemBrowseCoverage | undefined;
  readonly relations?: ProjectedRelations | undefined;
}): readonly FacetDefinition<CategorizedItemRow>[] {
  if (kind === undefined) return [];
  const categoryRows = rows.filter((row) => row.kind === kind.id);
  return [
    ...(kind.card?.facets?.({
      rows: categoryRows,
      coverage,
      relations,
    }) ?? []),
    ...(categoryRows.some((row) => (row.questRewardCount ?? 0) > 0)
      ? [QUEST_REWARD_FACET]
      : []),
  ];
}

/** First published fact shown on cross-category picture cards, or undefined if none. */
export function itemPrimaryFact({
  record,
}: {
  readonly record: CategorizedItemRow;
}): string | undefined {
  const category: ItemKind | undefined = ITEM_KINDS_BY_ID.get(record.kind);
  const categoryLead = category?.card?.lead(record, {
    coverage: undefined,
    relations: {},
  });
  if (typeof categoryLead === 'string') return categoryLead;
  if (record.success !== undefined) {
    return `${numberFormat.format(record.success)}% success`;
  }
  if (record.fullness !== undefined) {
    return formatFullness({ fullness: record.fullness });
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

/** Build the DrillDownNav tree for Items pages with non-empty categories in rail order. */
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
  scrollTargetIcons,
  relations = {},
  descriptions,
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
  const sortOptions = useMemo(() => {
    const options = [...ITEM_SORT_OPTIONS, ...(kind?.card?.sortOptions ?? [])];
    const preferred = kind?.card?.defaultSort;
    return preferred === undefined
      ? options
      : [
          preferred,
          ...options.filter(
            (option) =>
              option.field !== preferred.field ||
              option.direction !== preferred.direction,
          ),
        ];
  }, [kind]);
  const { browseState, handleStateChange: commitState } = useBrowseUrlState({
    address: itemBrowseSearch,
    search,
    sortOptions,
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
      const target = ITEM_KINDS_BY_ID.get(id);
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
  const displayedRows = useMemo(
    () =>
      kind?.card?.group?.({
        rows: rows.filter((row) => row.kind === kind.id),
        coverage,
        relations,
      }) ?? rows,
    [kind, rows, coverage, relations],
  );
  const facets = useMemo(() => {
    if (!all)
      return categoryFacets({ rows: displayedRows, kind, coverage, relations });
    return [
      ...ALL_FACETS.filter(
        (facet) =>
          facet.id !== 'used-in-recipes' ||
          coverage?.relationships['used-in-recipe'] !== 'unsupported',
      ),
      ...relationFilter({
        relations,
        kind: 'needed-for-quest',
        label: 'Quest',
      }),
      ...relationFilter({ relations, kind: 'monster-drop', label: 'Monster' }),
    ];
  }, [all, coverage, displayedRows, kind, relations]);
  const allQueryFields = useMemo(
    () => [
      ...ALL_QUERY_FIELDS,
      relationQueryField({
        relations,
        kind: 'needed-for-quest',
        label: 'Quest',
      }),
      relationQueryField({ relations, kind: 'monster-drop', label: 'Monster' }),
    ],
    [relations],
  );
  const rowBySourceId = useMemo(() => {
    const detailsRows = new Map(rows.map((row) => [row.sourceId, row]));
    for (const entry of itemKinds) {
      const card = entry.card;
      if (card?.group === undefined) continue;
      const groupedRows =
        entry.id === kind?.id
          ? displayedRows
          : card.group({
              rows: rows.filter((row) => row.kind === entry.id),
              coverage,
              relations,
            });
      for (const groupedRow of groupedRows) {
        for (const member of card.groupMembers?.({
          record: groupedRow,
        }) ?? [groupedRow]) {
          detailsRows.set(member.sourceId, member);
        }
      }
    }
    return detailsRows;
  }, [coverage, displayedRows, kind, relations, rows]);
  const categorySearchFields = kind?.card?.group
    ? (['name', 'names'] as const)
    : CATEGORY_SEARCH_FIELDS;
  const searchFields = all ? ALL_SEARCH_FIELDS : categorySearchFields;
  const itemDrawerContent = useCallback(
    (record: CategorizedItemRow) => {
      const itemKind: ItemKind | undefined = ITEM_KINDS_BY_ID.get(record.kind);
      return itemKind?.card?.drawerContent?.({
        record,
        selectedRecordId: details?.recordId ?? record.sourceId,
        context: {
          coverage,
          relations,
          ...(descriptions === undefined ? {} : { descriptions }),
          ...(scrollTargetIcons ? { scrollTargetIcons } : {}),
        },
        openRecordDetails: (sourceId) =>
          overlay.open({ type: 'record-details', recordId: sourceId }),
      });
    },
    [
      coverage,
      descriptions,
      details?.recordId,
      overlay,
      relations,
      scrollTargetIcons,
    ],
  );

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
        records={displayedRows}
        idAccessor="sourceId"
        resolveRecordDetails={(selectedId) => rowBySourceId.get(selectedId)}
        queryFields={
          all
            ? allQueryFields
            : [
                ...CATEGORY_QUERY_FIELDS,
                ...(kind?.card?.queryFields?.({ coverage, relations }) ?? []),
              ]
        }
        searchFields={searchFields}
        facets={facets}
        sortOptions={sortOptions}
        recordNoun={`${BUILDS[buildId].label} items`}
        summaryMode="total"
        summaryNoun={SUMMARY_NOUN}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        {...(group !== undefined && kind === undefined
          ? {
              presentation: 'custom' as const,
              showPagination: false,
              renderResults: ({
                matchingRecords,
              }: {
                matchingRecords: readonly CategorizedItemRow[];
              }) => (
                <ItemsGroupShelves
                  buildId={buildId}
                  group={group}
                  records={matchingRecords}
                  context={{ coverage, relations }}
                  selectedRecordId={details?.recordId}
                  openDetails={(recordId) =>
                    overlay.open({ type: 'record-details', recordId })
                  }
                />
              ),
            }
          : {
              presentation: 'cards' as const,
              cardColumns: itemCardColumns({ kind }),
              renderCard: (
                record: CategorizedItemRow,
                {
                  openDetails,
                  isDetailsOpen,
                }: { openDetails?: () => void; isDetailsOpen?: boolean },
              ) =>
                renderItemCard({
                  record,
                  context: {
                    coverage,
                    relations,
                    ...(descriptions === undefined ? {} : { descriptions }),
                    ...(scrollTargetIcons ? { scrollTargetIcons } : {}),
                  },
                  openDetails,
                  openItemDetails: (recordId) =>
                    overlay.open({ type: 'record-details', recordId }),
                  isDetailsOpen,
                  ...(all
                    ? { secondaryLine: itemPrimaryFact({ record }) }
                    : {}),
                  crossCategory: all,
                }),
            })}
        recordDetailsTitle={(record) => record.name}
        recordDetailsSideOnDesktop
        recordDetailsSideSize="md"
        recordDetailsContent={(record) => {
          const additionalContent = itemDrawerContent(record);
          return (
            <ItemDrawerBody
              record={record}
              categoryLabel={ITEM_KIND_LABELS.get(record.kind)}
              reader={relationReader}
              {...(descriptions === undefined ? {} : { descriptions })}
              {...(additionalContent === undefined
                ? {}
                : { additionalContent })}
            />
          );
        }}
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
