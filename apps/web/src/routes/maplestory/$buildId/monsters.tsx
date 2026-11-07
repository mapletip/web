import { createFileRoute } from '@tanstack/react-router';

import { supportedBuildSlug as supportedBuild } from '@/config/maplekit';
import {
  MonsterBrowse,
  MonsterBrowseUnavailable,
} from '@/features/monsters/browse';
import { loadMonsterBrowse } from '@/features/monsters/browse/load';
import { monsterPageMetadata } from '@/features/monsters/browse/metadata';

export const Route = createFileRoute('/maplestory/$buildId/monsters')({
  beforeLoad: ({ params }) => {
    supportedBuild(params.buildId);
  },
  loader: ({ params, abortController }) =>
    loadMonsterBrowse(supportedBuild(params.buildId), abortController.signal),
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
  errorComponent: MonsterBrowseUnavailable,
});

function VersionedMonsters() {
  const { buildId } = Route.useParams();
  const rows = Route.useLoaderData();

  return <MonsterBrowse buildId={supportedBuild(buildId)} rows={rows} />;
}
