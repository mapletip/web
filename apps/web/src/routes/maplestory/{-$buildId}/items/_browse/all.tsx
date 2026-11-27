import {
  createFileRoute,
  getRouteApi,
  stripSearchParams,
} from '@tanstack/react-router';

import { requireBuildId } from '@/features/detail';
import { ItemFrame } from '@/features/items/browse/frame';
import { itemPageHead } from '@/features/items/browse/page';
import { itemBrowseSearch } from '@/features/items/browse/search-params';

const browseRouteApi = getRouteApi('/maplestory/{-$buildId}/items/_browse');
export const Route = createFileRoute(
  '/maplestory/{-$buildId}/items/_browse/all',
)({
  validateSearch: itemBrowseSearch.schema,
  search: { middlewares: [stripSearchParams(itemBrowseSearch.defaultSearch)] },
  head: ({ params, match }) =>
    itemPageHead({
      buildId: requireBuildId(params.buildId),
      search: match.search,
      all: true,
    }),
  component: ItemsPage,
});
function ItemsPage() {
  const params = Route.useParams();
  const buildId = requireBuildId(params.buildId);
  const result = browseRouteApi.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ItemFrame
      buildId={buildId}
      rows={result.rows}
      coverage={result.coverage}
      all
      search={search}
      onSearchChange={({ search: nextSearch, replace }) =>
        navigate({ search: nextSearch, replace })
      }
    />
  );
}
