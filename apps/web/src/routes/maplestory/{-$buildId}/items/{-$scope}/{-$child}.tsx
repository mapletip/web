import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { ItemBrowse } from '@/features/items/browse';
import { getCategoryRows } from '@/features/items/browse/categories';
import { itemPageMetadata } from '@/features/items/browse/metadata';
import type { ItemRow } from '@/features/items/browse/project';
import { parseItemRouteParams } from '@/features/items/browse/routing';
import { validateSearch } from '@/features/items/browse/search-params';

const itemsRouteApi = getRouteApi('/maplestory/{-$buildId}/items');

export const Route = createFileRoute(
  '/maplestory/{-$buildId}/items/{-$scope}/{-$child}',
)({
  validateSearch,
  beforeLoad: ({ params }) => {
    parseItemRouteParams(params);
  },
  head: ({ params, match, matches }) => {
    const { buildId, category } = parseItemRouteParams(params);
    const parentMatch = matches.find((m) => m.routeId.endsWith('/items'));
    const loaderData = parentMatch?.loaderData as
      { rows: readonly ItemRow[]; coverage: ItemBrowseCoverage } | undefined;
    const count = loaderData
      ? getCategoryRows(loaderData.rows, category.scope, category.child).length
      : undefined;
    const { title, description, robots, canonicalUrl } = itemPageMetadata(
      buildId,
      category,
      match.search,
      count,
    );
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'robots', content: robots },
      ],
      links: [{ rel: 'canonical', href: canonicalUrl }],
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
      onSearchChange={(nextSearch, replace) => {
        void navigate({
          search: nextSearch,
          replace,
        });
      }}
    />
  );
}
