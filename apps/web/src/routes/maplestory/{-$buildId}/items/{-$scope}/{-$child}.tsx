import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { ItemBrowse } from '@/features/items/browse';
import { itemPageMetadata } from '@/features/items/browse/metadata';
import { parseItemRouteParams } from '@/features/items/browse/routing';

const itemsRouteApi = getRouteApi('/maplestory/{-$buildId}/items');

export const Route = createFileRoute(
  '/maplestory/{-$buildId}/items/{-$scope}/{-$child}',
)({
  beforeLoad: ({ params }) => {
    parseItemRouteParams(params);
  },
  head: ({ params }) => {
    const { buildId, category } = parseItemRouteParams(params);
    const { title, description } = itemPageMetadata(buildId, category);
    return {
      meta: [{ title }, { name: 'description', content: description }],
    };
  },
  component: ItemBrowseLeaf,
});

function ItemBrowseLeaf() {
  const params = Route.useParams();
  const { buildId, category } = parseItemRouteParams(params);
  const { rows } = itemsRouteApi.useLoaderData();

  return <ItemBrowse buildId={buildId} rows={rows} category={category} />;
}
