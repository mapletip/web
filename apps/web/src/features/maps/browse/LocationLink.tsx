import type { DrillDownLinkRenderProps } from '@mapletip/component-library';
import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';
import type { BrowseSearch } from '@/features/browse/search-params';
import { canonicalBuildParam } from '@/features/detail';
import {
  MAP_LOCATION_ROUTE,
  MAPS_ROUTE,
  type MapLocationParams,
} from '@/features/maps/shared';

/** Typed router options for a location page in a build. */
export function mapLocationLinkOptions({
  buildId,
  params,
  search,
}: {
  readonly buildId: BuildId;
  readonly params: MapLocationParams;
  readonly search: BrowseSearch;
}) {
  const buildParam = canonicalBuildParam(buildId);
  return params.location === undefined
    ? ({ to: MAPS_ROUTE, params: { buildId: buildParam }, search } as const)
    : ({
        to: MAP_LOCATION_ROUTE,
        params: {
          buildId: buildParam,
          location: params.location,
          area: params.area,
        },
        search,
      } as const);
}

/** DrillDownNav link adapter: a router Link to the node's location page. */
export function LocationLink({
  buildId,
  params,
  search,
  props,
}: {
  readonly buildId: BuildId;
  readonly params: MapLocationParams;
  readonly search: BrowseSearch;
  readonly props: DrillDownLinkRenderProps;
}): ReactElement {
  return (
    <Link
      {...mapLocationLinkOptions({ buildId, params, search })}
      className={props.className}
      aria-current={props['aria-current']}
      onClick={props.onClick}
    >
      {props.children}
    </Link>
  );
}
