import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

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
import { MapDetail, mapDetailMetadata } from '@/features/maps/detail';
import { loadMapDetail } from '@/features/maps/detail/load';

export const Route = createFileRoute('/maplestory/{-$buildId}/maps/$slugId')({
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
        to: '/maplestory/{-$buildId}/maps/$slugId',
        params: {
          buildId: canonicalBuildParam(buildId),
          slugId: formatRecordAddress(result.view.slug, result.view.publicId),
        },
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

    const head = mapDetailMetadata({
      view: loaderData,
      buildId: loaderData.buildId,
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

  return <MapDetail view={view} />;
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
