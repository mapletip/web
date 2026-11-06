import { createFileRoute } from '@tanstack/react-router';

import { DEFAULT_BUILD_ID } from '@/config/maplekit';
import {
  MonsterBrowse,
  MonsterBrowseUnavailable,
} from '@/features/monsters/browse';
import { loadMonsterBrowse } from '@/features/monsters/browse/load';
import { monsterPageMetadata } from '@/features/monsters/browse/metadata';

const metadata = monsterPageMetadata(DEFAULT_BUILD_ID);

export const Route = createFileRoute('/maplestory/monsters')({
  loader: ({ abortController }) =>
    loadMonsterBrowse(DEFAULT_BUILD_ID, abortController.signal),
  head: () => ({
    meta: [
      { title: metadata.title },
      { name: 'description', content: metadata.description },
    ],
  }),
  component: ClassicWorldMonsters,
  errorComponent: MonsterBrowseUnavailable,
});

function ClassicWorldMonsters() {
  const rows = Route.useLoaderData();

  return <MonsterBrowse buildId={DEFAULT_BUILD_ID} rows={rows} />;
}
