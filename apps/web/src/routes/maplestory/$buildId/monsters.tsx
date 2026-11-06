import { createFileRoute, notFound } from '@tanstack/react-router';

import { isBuildId, type BuildId } from '@/config/maplekit';
import {
  MonsterBrowse,
  MonsterBrowseUnavailable,
} from '@/features/monsters/browse';
import { loadMonsterBrowse } from '@/features/monsters/browse/load';
import { monsterPageMetadata } from '@/features/monsters/browse/metadata';

/**
 * One parameterized version route for every explicitly supported build. The
 * canonical Classic World page has its own unversioned URL, so that slug is
 * refused here to avoid duplicate content; anything else unknown is a genuine
 * not-found before any SDK work happens.
 */
function supportedBuild(slug: string): BuildId {
  if (slug === 'cw-launch' || !isBuildId(slug)) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  return slug;
}

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
