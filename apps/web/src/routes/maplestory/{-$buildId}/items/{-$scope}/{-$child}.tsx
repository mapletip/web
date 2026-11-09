import {
  createFileRoute,
  getRouteApi,
  stripSearchParams,
} from '@tanstack/react-router';

import { ItemBrowse } from '@/features/items/browse';
import { itemPageMetadata } from '@/features/items/browse/metadata';
import { parseItemRouteParams } from '@/features/items/browse/routing';
import {
  ITEM_BROWSE_DEFAULT_SEARCH,
  itemBrowseSearchSchema,
} from '@/features/items/browse/search-params';

const itemsRouteApi = getRouteApi('/maplestory/{-$buildId}/items');

export const Route = createFileRoute(
  '/maplestory/{-$buildId}/items/{-$scope}/{-$child}',
)({
  validateSearch: itemBrowseSearchSchema,
  search: {
    middlewares: [stripSearchParams(ITEM_BROWSE_DEFAULT_SEARCH)],
  },
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
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { buildId, category } = parseItemRouteParams(params);
  const { rows, coverage } = itemsRouteApi.useLoaderData();

  return (
    <ItemBrowse
      buildId={buildId}
      rows={rows}
      coverage={coverage}
      category={category}
      search={search}
      onSearchChange={({ search: nextSearch, replace }) => {
        void navigate({
          search: nextSearch,
          replace,
        });
      }}
    />
  );
}
