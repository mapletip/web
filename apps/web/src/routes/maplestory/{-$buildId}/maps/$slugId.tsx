import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { useCallback } from 'react';

import { BrowseUnavailable } from '@/components/BrowseUnavailable';
import { BUILDS, DEFAULT_BUILD_ID } from '@/config/maplekit';
import {
  RecordNotFound,
  buildCollectionPath,
  canonicalBuildParam,
  formatRecordAddress,
  parseRecordAddress,
  requireBuildId,
  resolveBuildIdParam,
} from '@/features/detail';
import { mapDetailSearchSchema } from '@/features/maps/detail/focus';
import { loadMapDetail } from '@/features/maps/detail/load';
import { MapDetail } from '@/features/maps/detail/MapDetail';
import { mapDetailMetadata } from '@/features/maps/detail/metadata';
import { MAP_DETAIL_ROUTE } from '@/features/maps/shared';

export const Route = createFileRoute('/maplestory/{-$buildId}/maps/$slugId')({
  validateSearch: mapDetailSearchSchema,
  staleTime: Infinity,
  beforeLoad: ({ params }) => {
    requireBuildId(params.buildId);
  },
  loader: async ({ params, abortController }) => {
    const buildId = requireBuildId(params.buildId);
    const address = parseRecordAddress(params.slugId);
    if (address === null) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound();
    }

    const result = await loadMapDetail({
      buildId,
      publicId: address.publicId,
      signal: abortController.signal,
    });

    if (result.status === 'not-found') {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound();
    }

    if (address.slug !== result.view.slug) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        to: MAP_DETAIL_ROUTE,
        params: {
          buildId: canonicalBuildParam(buildId),
          slugId: formatRecordAddress(result.view.slug, result.view.publicId),
        },
        search: true,
        statusCode: 301,
      });
    }

    return result.view;
  },
  head: ({ loaderData, match }) => {
    if (loaderData === undefined) {
      const title =
        match.status === 'error'
          ? 'Map unavailable – MapleTip'
          : 'Map not found – MapleTip';
      return {
        meta: [{ title }, { name: 'robots', content: 'noindex,follow' }],
      };
    }

    const { focus } = match.search;
    const head = mapDetailMetadata({
      view: loaderData,
      buildId: loaderData.buildId,
      noIndex: focus !== undefined,
    });
    return {
      meta: [...head.meta],
      links: [...head.links],
      scripts: [...head.scripts],
    };
  },
  component: MapDetailPage,
  errorComponent: BrowseUnavailable,
  notFoundComponent: MapDetailNotFound,
});

function MapDetailPage() {
  const view = Route.useLoaderData();
  const { focus } = Route.useSearch();
  const navigate = Route.useNavigate();
  const onFocusChange = useCallback(
    (nextFocus: string | undefined) =>
      navigate({
        search: (previous) => ({ ...previous, focus: nextFocus }),
        state: (previous) => previous,
        replace: true,
        resetScroll: false,
      }),
    [navigate],
  );

  return (
    <MapDetail view={view} focusValue={focus} onFocusChange={onFocusChange} />
  );
}

function MapDetailNotFound() {
  const { buildId: rawBuildId } = Route.useParams();
  const buildId = resolveBuildIdParam(rawBuildId) ?? DEFAULT_BUILD_ID;
  const buildLabel = BUILDS[buildId].label;

  return (
    <RecordNotFound
      title="Map not found"
      backLabel={`Browse ${buildLabel} Maps`}
      backPath={buildCollectionPath('maps', buildId)}
    />
  );
}
