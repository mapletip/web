import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { BUILDS, supportedBuildSlug } from '@/config/maplekit';
import { ItemBrowse } from '@/features/items/browse';

const versionedItemsRouteApi = getRouteApi('/maplestory/$buildId/items');

export const Route = createFileRoute('/maplestory/$buildId/items/')({
  head: ({ params }) => {
    const buildId = supportedBuildSlug(params.buildId);
    const label = BUILDS[buildId].label;
    return {
      meta: [
        { title: `MapleStory ${label} Items – MapleTip` },
        {
          name: 'description',
          content: `Browse ${label} items in MapleStory.`,
        },
      ],
    };
  },
  component: VersionedItemsPage,
});

function VersionedItemsPage() {
  const { buildId } = Route.useParams();
  const validBuildId = supportedBuildSlug(buildId);
  const { rows } = versionedItemsRouteApi.useLoaderData();

  return <ItemBrowse buildId={validBuildId} rows={rows} scope="all" />;
}
