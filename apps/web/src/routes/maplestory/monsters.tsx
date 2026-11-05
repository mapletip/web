import { createFileRoute } from '@tanstack/react-router';

import {
  MonsterBrowse,
  MonsterBrowseUnavailable,
} from '@/features/monsters/browse';
import { loadMonsterBrowse } from '@/features/monsters/browse/load';
import { MONSTER_BUILDS } from '@/features/monsters/browse/release';

const build = MONSTER_BUILDS['cw-launch'];

export const Route = createFileRoute('/maplestory/monsters')({
  loader: ({ abortController }) =>
    loadMonsterBrowse(build.buildId, abortController.signal),
  head: () => ({
    meta: [
      { title: build.title },
      { name: 'description', content: build.description },
    ],
  }),
  component: ClassicWorldMonsters,
  errorComponent: MonsterBrowseUnavailable,
});

function ClassicWorldMonsters() {
  const rows = Route.useLoaderData();

  return <MonsterBrowse build={build} rows={rows} />;
}
