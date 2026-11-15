import { createFileRoute, notFound } from '@tanstack/react-router';

import { BrowseUnavailable } from '@/components/BrowseUnavailable';
import type { BuildId } from '@/config/maplekit';
import { resolveBuildIdParam } from '@/features/detail';
import { MonsterBrowse } from '@/features/monsters/browse';
import { loadMonsterBrowse } from '@/features/monsters/browse/load';
import { monsterPageMetadata } from '@/features/monsters/browse/metadata';

function resolveMonsterBrowseBuildId(rawBuildId?: string): BuildId {
  const buildId = resolveBuildIdParam(rawBuildId);
  if (buildId === null) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  return buildId;
}

export const Route = createFileRoute('/maplestory/{-$buildId}/monsters/')({
  beforeLoad: ({ params }) => {
    resolveMonsterBrowseBuildId(params.buildId);
  },
  loader: ({ params, abortController }) =>
    loadMonsterBrowse(
      resolveMonsterBrowseBuildId(params.buildId),
      abortController.signal,
    ),
  staleTime: Infinity,
  head: ({ params }) => {
    const metadata = monsterPageMetadata(
      resolveMonsterBrowseBuildId(params.buildId),
    );
    return {
      meta: [
        { title: metadata.title },
        { name: 'description', content: metadata.description },
      ],
    };
  },
  component: MonsterBrowsePage,
  errorComponent: BrowseUnavailable,
});

function MonsterBrowsePage() {
  const { buildId: rawBuildId } = Route.useParams();
  const buildId = resolveMonsterBrowseBuildId(rawBuildId);
  const browse = Route.useLoaderData();

  return <MonsterBrowse buildId={buildId} {...browse} />;
}
