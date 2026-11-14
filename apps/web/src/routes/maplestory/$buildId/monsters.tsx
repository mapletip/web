import { createFileRoute } from '@tanstack/react-router';

import { BrowseUnavailable } from '@/components/BrowseUnavailable';
import { supportedBuildSlug as supportedBuild } from '@/config/maplekit';
import { MonsterBrowse } from '@/features/monsters/browse';
import { loadMonsterBrowse } from '@/features/monsters/browse/load';
import { monsterPageMetadata } from '@/features/monsters/browse/metadata';

export const Route = createFileRoute('/maplestory/$buildId/monsters')({
  beforeLoad: ({ params }) => {
    supportedBuild(params.buildId);
  },
  loader: ({ params, abortController }) =>
    loadMonsterBrowse(supportedBuild(params.buildId), abortController.signal),
  staleTime: Infinity,
  head: ({ params }) => {
    const metadata = monsterPageMetadata(supportedBuild(params.buildId));
    return {
      meta: [
        { title: metadata.title },
        { name: 'description', content: metadata.description },
      ],
    };
  },
  component: VersionedMonsters,
  errorComponent: BrowseUnavailable,
});

function VersionedMonsters() {
  const { buildId } = Route.useParams();
  const browse = Route.useLoaderData();

  return <MonsterBrowse buildId={supportedBuild(buildId)} {...browse} />;
}
