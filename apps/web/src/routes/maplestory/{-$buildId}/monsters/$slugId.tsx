import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { BrowseUnavailable } from '@/components/BrowseUnavailable';
import { BUILDS, DEFAULT_BUILD_ID, type BuildId } from '@/config/maplekit';
import {
  RecordNotFound,
  buildCollectionPath,
  canonicalBuildParam,
  formatRecordAddress,
  parseRecordAddress,
  resolveBuildIdParam,
} from '@/features/detail';
import {
  MonsterDetail,
  monsterDetailMetadata,
} from '@/features/monsters/detail';
import { loadMonsterDetail } from '@/features/monsters/detail/load';

function resolveMonsterDetailBuildId(rawBuildId?: string): BuildId {
  const buildId = resolveBuildIdParam(rawBuildId);
  if (buildId === null) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  return buildId;
}

export const Route = createFileRoute(
  '/maplestory/{-$buildId}/monsters/$slugId',
)({
  beforeLoad: ({ params }) => {
    resolveMonsterDetailBuildId(params.buildId);
  },
  loader: async ({ params, abortController }) => {
    const buildId = resolveMonsterDetailBuildId(params.buildId);
    const address = parseRecordAddress(params.slugId);
    if (address === null) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound();
    }

    const result = await loadMonsterDetail({
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
        to: '/maplestory/{-$buildId}/monsters/$slugId',
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
          ? 'Monster unavailable – MapleTip'
          : 'Monster not found – MapleTip';
      return {
        meta: [{ title }, { name: 'robots', content: 'noindex,follow' }],
      };
    }

    const head = monsterDetailMetadata({
      view: loaderData,
      buildId: loaderData.buildId,
    });
    return {
      meta: [...head.meta],
      links: [...head.links],
      scripts: [...head.scripts],
    };
  },
  component: MonsterDetailPage,
  errorComponent: BrowseUnavailable,
  notFoundComponent: MonsterDetailNotFound,
});

function MonsterDetailPage() {
  const view = Route.useLoaderData();

  return <MonsterDetail view={view} />;
}

function MonsterDetailNotFound() {
  const { buildId: rawBuildId } = Route.useParams();
  const buildId = resolveBuildIdParam(rawBuildId) ?? DEFAULT_BUILD_ID;
  const buildLabel = BUILDS[buildId].label;

  return (
    <RecordNotFound
      title="Monster not found"
      backLabel={`Browse ${buildLabel} Monsters`}
      backPath={buildCollectionPath('monsters', buildId)}
      backLinkProps={{
        to: '/maplestory/{-$buildId}/monsters',
        params: { buildId: canonicalBuildParam(buildId) },
      }}
    />
  );
}
