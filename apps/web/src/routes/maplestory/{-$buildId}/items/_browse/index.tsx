import {
  createFileRoute,
  getRouteApi,
  stripSearchParams,
} from '@tanstack/react-router';

import { requireBuildId } from '@/features/detail';
import { itemPageHead } from '@/features/items/browse/page';
import { itemBrowseSearch } from '@/features/items/browse/search-params';
import { ItemsLandingPage } from '@/features/items/landing/ItemsLandingPage';

const browseRouteApi = getRouteApi('/maplestory/{-$buildId}/items/_browse');

export const Route = createFileRoute('/maplestory/{-$buildId}/items/_browse/')({
  validateSearch: itemBrowseSearch.schema,
  search: { middlewares: [stripSearchParams(itemBrowseSearch.defaultSearch)] },
  head: ({ params, match }) =>
    itemPageHead({
      buildId: requireBuildId(params.buildId),
      search: match.search,
      all: false,
    }),
  component: ItemsPage,
});

function ItemsPage() {
  const params = Route.useParams();
  const buildId = requireBuildId(params.buildId);
  const result = browseRouteApi.useLoaderData();
  return (
    <ItemsLandingPage
      buildId={buildId}
      rows={result.rows}
      coverage={result.coverage}
    />
  );
}
