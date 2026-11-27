import {
  createFileRoute,
  getRouteApi,
  stripSearchParams,
} from '@tanstack/react-router';

import { requireBuildId } from '@/features/detail';
import { ItemFrame } from '@/features/items/browse/frame';
import type { LoadedItemBrowse } from '@/features/items/browse/load';
import { itemPageHead } from '@/features/items/browse/page';
import { loadProjectedRelations } from '@/features/items/browse/relation-projection';
import { itemBrowseSearch } from '@/features/items/browse/search-params';

const browseRouteApi = getRouteApi('/maplestory/{-$buildId}/items/_browse');
export const Route = createFileRoute(
  '/maplestory/{-$buildId}/items/_browse/all',
)({
  validateSearch: itemBrowseSearch.schema,
  search: { middlewares: [stripSearchParams(itemBrowseSearch.defaultSearch)] },
  loader: async ({
    params,
    parentMatchPromise,
  }: {
    readonly params: { readonly buildId?: string | undefined };
    readonly parentMatchPromise: Promise<{
      readonly loaderData?: LoadedItemBrowse | undefined;
    }>;
  }) => {
    const { loaderData } = await parentMatchPromise;
    if (loaderData === undefined) return { relations: {} };
    return {
      relations: await loadProjectedRelations({
        buildId: requireBuildId(params.buildId),
        rows: loaderData.rows,
        coverage: loaderData.coverage,
        relationKinds: ['needed-for-quest', 'monster-drop'],
      }),
    };
  },
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
  const { relations } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ItemFrame
      buildId={buildId}
      rows={result.rows}
      coverage={result.coverage}
      relations={relations}
      all
      search={search}
      onSearchChange={({ search: nextSearch, replace }) =>
        navigate({ search: nextSearch, replace })
      }
    />
  );
}
