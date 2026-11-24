import { Title } from '@mantine/core';
import { DrillDownNav, FacetedBrowser } from '@mapletip/component-library';
import type {
  BrowseState,
  DrawerOpenedChangeDetails,
  FacetedBrowserNavigation,
  StateChangeDetails,
} from '@mapletip/component-library';
import { Link, useRouter } from '@tanstack/react-router';
import { useCallback, useMemo, type ReactElement } from 'react';

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
import type { MapLocationParams } from '@/features/maps/shared';
import { useRouteOverlay } from '@/features/route-overlay/useRouteOverlay';

import {
  mapFacets,
  MAP_QUERY_FIELDS,
  MAP_SEARCH_FIELDS,
  MAP_SORT_OPTIONS,
} from './facets';
import { mapLocationTree, type MapLocationNode } from './location';
import { LocationLink, mapLocationLinkOptions } from './LocationLink';
import { MapBrowseCard, type MapBrowseCardContext } from './MapBrowseCard';
import { mapPageMetadata } from './metadata';
import type { MapBrowseData } from './project';
import { mapBrowseRecords } from './records';
import { mapBrowseSearch } from './search-params';

export interface MapBrowseProps {
  readonly buildId: BuildId;
  /** Absent when the release carries no Map Browse for the build. */
  readonly data: MapBrowseData | undefined;
  /** The location page being shown; All maps on the index page. */
  readonly location: MapLocationNode;
  readonly search: BrowseSearch;
  readonly onSearchChange: (
    options: OnSearchChangeOptions,
  ) => void | Promise<void>;
}

const SUMMARY_NOUN = { one: 'Map', other: 'Maps' } as const;
/** Two columns from Mantine's `md` breakpoint (992px). */
const CARD_COLUMNS = { base: 1, md: 2 } as const;

/** Map Browse: every map of one build as cards, with address state. */
export function MapBrowse({
  buildId,
  data,
  location,
  search,
  onSearchChange,
}: MapBrowseProps): ReactElement {
  const router = useRouter();
  const { heading } = mapPageMetadata({ buildId, location, path: '' });
  const records = useMemo(
    () => (data === undefined ? [] : mapBrowseRecords(data)),
    [data],
  );
  const facets = useMemo(
    () => (data === undefined ? [] : mapFacets(data)),
    [data],
  );
  const browseOverlay = useRouteOverlay(browseOverlayOptions);

  const onFilterDrawerOpenedChange = useCallback(
    (opened: boolean, details?: DrawerOpenedChangeDetails) => {
      if (opened) {
        browseOverlay.open({ type: 'filters' });
        return;
      }
      if (details?.reason === 'invalidate') {
        void browseOverlay.invalidate('filters');
        return;
      }
      if (details?.reason === 'apply') return;
      browseOverlay.dismiss('filters');
    },
    [browseOverlay],
  );

  const { browseState, handleStateChange: commitBrowseState } =
    useBrowseUrlState({ address: mapBrowseSearch, search, onSearchChange });

  const handleStateChange = useCallback(
    (nextState: BrowseState, details?: StateChangeDetails) => {
      if (details?.reason === 'apply') {
        void browseOverlay.apply('filters', () =>
          commitBrowseState(nextState, details),
        );
        return;
      }
      void commitBrowseState(nextState, details);
    },
    [browseOverlay, commitBrowseState],
  );

  const selectedMonsters = browseState.filters['monster'];
  const selectedNpcs = browseState.filters['npc'];
  const levelFilter = browseState.filters['level'];
  const sortField = browseState.sort?.field;
  // The card shows a figure only when the filter or sort is about it.
  const cardContext = useMemo((): MapBrowseCardContext => {
    const keys = (value: unknown) =>
      new Set(Array.isArray(value) ? (value as readonly string[]) : []);
    return {
      monsters: keys(selectedMonsters),
      npcs: keys(selectedNpcs),
      levels:
        levelFilter !== undefined ||
        sortField === 'lowestMonsterLevel' ||
        sortField === 'highestMonsterLevel',
      spawns: sortField === 'spawnPointCount',
    };
  }, [selectedMonsters, selectedNpcs, levelFilter, sortField]);

  // Choosing a location keeps the search and filters and returns to page one.
  const locationSearch = mapBrowseSearch.browseStateToUrl({
    state: browseState,
    includePage: false,
  });
  const locationParams = useMemo(() => {
    if (data === undefined) return new Map<string, MapLocationParams>();
    const entries: [string, MapLocationParams][] = [];
    const visit = (node: ReturnType<typeof mapLocationTree>) => {
      entries.push([node.id, node.meta ?? {}]);
      node.children?.forEach(visit);
    };
    visit(mapLocationTree({ geography: data.geography, buildId }));
    return new Map(entries);
  }, [buildId, data]);

  const applyLocation = useCallback(
    (id: string, options: { readonly replace: true }) => {
      void router.navigate({
        ...mapLocationLinkOptions({
          buildId,
          params: locationParams.get(id) ?? {},
          search: locationSearch,
        }),
        replace: options.replace,
      });
    },
    [buildId, locationParams, locationSearch, router],
  );

  const navigation: FacetedBrowserNavigation | undefined =
    data === undefined
      ? undefined
      : {
          label: 'Locations',
          currentLabel: location.label,
          currentId: location.id,
          field: 'locationKeys',
          apply: applyLocation,
          opened: browseOverlay.overlay?.type === 'navigation',
          onOpenedChange: (opened, reason) => {
            if (opened) {
              browseOverlay.open({ type: 'navigation' });
              return;
            }
            if (reason === 'dismiss') browseOverlay.dismiss('navigation');
          },
          render: (context) => {
            const root = mapLocationTree({
              geography: data.geography,
              buildId,
              counts: context.counts,
            });
            if (context.mode === 'drawer') {
              return (
                <DrillDownNav
                  root={root}
                  currentId={context.selectedId}
                  label="Locations"
                  onSelect={context.onSelect}
                />
              );
            }
            return (
              <DrillDownNav
                root={root}
                currentId={location.id}
                label="Locations"
                renderLink={(node, props) => (
                  <LocationLink
                    buildId={buildId}
                    params={node.meta ?? {}}
                    search={locationSearch}
                    props={props}
                  />
                )}
                {...(context.onNavigate
                  ? { onNavigate: context.onNavigate }
                  : {})}
              />
            );
          },
        };

  return (
    <BrowsePageShell fillViewport={false}>
      <FacetedBrowser
        title={<Title order={1}>{heading}</Title>}
        {...(navigation === undefined ? {} : { navigation })}
        records={records}
        idAccessor="publicId"
        queryFields={MAP_QUERY_FIELDS}
        searchFields={MAP_SEARCH_FIELDS}
        facets={facets}
        sortOptions={MAP_SORT_OPTIONS}
        recordNoun={`${BUILDS[buildId].label} maps`}
        summaryMode="total"
        summaryNoun={SUMMARY_NOUN}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        presentation="cards"
        cardColumns={CARD_COLUMNS}
        renderCard={(record) => (
          <MapBrowseCard
            record={record}
            buildId={buildId}
            location={location}
            context={cardContext}
          />
        )}
        {...(data === undefined
          ? { unavailable: 'Map data is unavailable for this build.' }
          : {})}
        state={browseState}
        onStateChange={handleStateChange}
        drawerOpened={browseOverlay.overlay?.type === 'filters'}
        onDrawerOpenedChange={onFilterDrawerOpenedChange}
        renderPageLink={({ page, state, props }) => {
          const { target, disabled, ...linkProps } = props;
          const routerLinkProps: Omit<typeof linkProps, 'href'> = linkProps;
          return (
            <Link
              to="."
              search={mapBrowseSearch.browseStateToUrl({
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
