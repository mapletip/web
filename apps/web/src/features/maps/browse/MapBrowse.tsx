import { Title } from '@mantine/core';
import { FacetedBrowser } from '@mapletip/component-library';
import type {
  BrowseState,
  DrawerOpenedChangeDetails,
  StateChangeDetails,
} from '@mapletip/component-library';
import { Link } from '@tanstack/react-router';
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
import { useRouteOverlay } from '@/features/route-overlay/useRouteOverlay';

import {
  MAP_QUERY_FIELDS,
  MAP_SEARCH_FIELDS,
  MAP_SORT_OPTIONS,
} from './facets';
import { MapBrowseCard } from './MapBrowseCard';
import type { MapBrowseData } from './project';
import { mapBrowseRecords } from './records';
import { mapBrowseSearch } from './search-params';

export interface MapBrowseProps {
  readonly buildId: BuildId;
  /** Absent when the release carries no Map Browse for the build. */
  readonly data: MapBrowseData | undefined;
  readonly heading: string;
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
  heading,
  search,
  onSearchChange,
}: MapBrowseProps): ReactElement {
  const records = useMemo(
    () => (data === undefined ? [] : mapBrowseRecords(data)),
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

  return (
    <BrowsePageShell>
      <FacetedBrowser
        title={<Title order={1}>{heading}</Title>}
        records={records}
        idAccessor="publicId"
        queryFields={MAP_QUERY_FIELDS}
        searchFields={MAP_SEARCH_FIELDS}
        sortOptions={MAP_SORT_OPTIONS}
        showFilterHeading={false}
        recordNoun={`${BUILDS[buildId].label} maps`}
        summaryMode="total"
        summaryNoun={SUMMARY_NOUN}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        presentation="cards"
        cardColumns={CARD_COLUMNS}
        renderCard={(record) => (
          <MapBrowseCard record={record} buildId={buildId} />
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
