import {
  createFileRoute,
  getRouteApi,
  stripSearchParams,
} from '@tanstack/react-router';

import { requireBuildId } from '@/features/detail';
import type { LoadedItemBrowse } from '@/features/items/browse/load';
import { itemPageHead } from '@/features/items/browse/page';
import { loadProjectedRelations } from '@/features/items/browse/relation-projection';
import { itemBrowseSearch } from '@/features/items/browse/search-params';
import {
  countNotRequiredDrops,
  monsterDrops,
} from '@/features/items/kinds/monster-drops';
import { ItemsLandingPage } from '@/features/items/landing/ItemsLandingPage';

const browseRouteApi = getRouteApi('/maplestory/{-$buildId}/items/_browse');

export const Route = createFileRoute('/maplestory/{-$buildId}/items/_browse/')({
  validateSearch: itemBrowseSearch.schema,
  search: { middlewares: [stripSearchParams(itemBrowseSearch.defaultSearch)] },
  loader: async ({
    params,
    parentMatchPromise,
  }: {
    params: { buildId?: string };
    parentMatchPromise: Promise<{ loaderData?: LoadedItemBrowse }>;
  }) => {
    const { loaderData } = await parentMatchPromise;
    const { coverage, rows } = loaderData ?? {};
    if (
      coverage?.relationships['needed-for-quest'] !== 'complete' ||
      coverage.relationships['used-in-recipe'] !== 'complete' ||
      rows === undefined
    ) {
      return {};
    }
    // Only quest links are needed: they say which drops have unestablished requirements.
    const relations = await loadProjectedRelations({
      buildId: requireBuildId(params.buildId),
      kind: monsterDrops,
      rows,
      coverage,
      relationKinds: ['needed-for-quest'],
    });
    return relations['needed-for-quest'] === undefined
      ? {}
      : {
          notRequiredDropCount: countNotRequiredDrops({
            rows,
            coverage,
            relations,
          }),
        };
  },
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
  const { notRequiredDropCount } = Route.useLoaderData();
  return (
    <ItemsLandingPage
      buildId={buildId}
      rows={result.rows}
      coverage={result.coverage}
      notRequiredDropCount={notRequiredDropCount}
    />
  );
}
