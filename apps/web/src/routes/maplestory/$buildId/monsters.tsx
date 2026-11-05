import { createFileRoute, notFound } from '@tanstack/react-router';

import {
  MonsterBrowse,
  MonsterBrowseUnavailable,
} from '@/features/monsters/browse';
import { loadMonsterBrowse } from '@/features/monsters/browse/load';
import {
  isMonsterBuildId,
  MONSTER_BUILDS,
  type MonsterBuild,
} from '@/features/monsters/browse/release';

/**
 * One parameterized version route for every explicitly supported build. The
 * canonical Classic World page has its own unversioned URL, so that slug is
 * refused here to avoid duplicate content; anything else unknown is a genuine
 * not-found before any SDK work happens.
 */
function supportedBuild(slug: string): MonsterBuild {
  if (slug === 'cw-launch' || !isMonsterBuildId(slug)) {
    // TanStack Router's control-flow sentinel, not an Error object.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  return MONSTER_BUILDS[slug];
}

export const Route = createFileRoute('/maplestory/$buildId/monsters')({
  beforeLoad: ({ params }) => {
    supportedBuild(params.buildId);
  },
  loader: ({ params, abortController }) =>
    loadMonsterBrowse(
      supportedBuild(params.buildId).buildId,
      abortController.signal,
    ),
  head: ({ params }) => {
    const build = supportedBuild(params.buildId);
    return {
      meta: [
        { title: build.title },
        { name: 'description', content: build.description },
      ],
    };
  },
  component: VersionedMonsters,
  errorComponent: MonsterBrowseUnavailable,
});

function VersionedMonsters() {
  const { buildId } = Route.useParams();
  const build = supportedBuild(buildId);
  const rows = Route.useLoaderData();

  return <MonsterBrowse build={build} rows={rows} />;
}
