import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { DEFAULT_BUILD_ID } from '@/config/maplekit';
import { ItemBrowse } from '@/features/items/browse';

const itemsRouteApi = getRouteApi('/maplestory/items');

export const Route = createFileRoute('/maplestory/items/')({
  head: () => ({
    meta: [
      { title: 'MapleStory Classic World Items – MapleTip' },
      {
        name: 'description',
        content: 'Browse Classic World items in MapleStory.',
      },
    ],
  }),
  component: DefaultItemsPage,
});

function DefaultItemsPage() {
  const { rows } = itemsRouteApi.useLoaderData();
  return <ItemBrowse buildId={DEFAULT_BUILD_ID} rows={rows} scope="all" />;
}
