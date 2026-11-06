import { createFileRoute } from '@tanstack/react-router';

import { DEFAULT_BUILD_ID } from '@/config/maplekit';
import {
  MonsterBrowse,
  MonsterBrowseUnavailable,
} from '@/features/monsters/browse';
import { loadMonsterBrowse } from '@/features/monsters/browse/load';
import { monsterPageMetadata } from '@/features/monsters/browse/metadata';

// The canonical URL is build-agnostic: it renders whichever build the shared
// configuration designates as the default, so nothing here is named after one.
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
  component: MonsterBrowsePage,
  errorComponent: MonsterBrowseUnavailable,
});

function MonsterBrowsePage() {
  const rows = Route.useLoaderData();

  return <MonsterBrowse buildId={DEFAULT_BUILD_ID} rows={rows} />;
}
