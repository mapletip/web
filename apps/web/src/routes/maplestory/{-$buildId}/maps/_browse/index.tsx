import {
  createFileRoute,
  getRouteApi,
  stripSearchParams,
} from '@tanstack/react-router';

import { buildCollectionPath, requireBuildId } from '@/features/detail';
import {
  MapBrowse,
  mapBrowseSearch,
  mapPageMetadata,
} from '@/features/maps/browse';

const browseRouteApi = getRouteApi('/maplestory/{-$buildId}/maps/_browse');

export const Route = createFileRoute('/maplestory/{-$buildId}/maps/_browse/')({
  validateSearch: mapBrowseSearch.schema,
  search: {
    middlewares: [stripSearchParams(mapBrowseSearch.defaultSearch)],
  },
  head: ({ params, match }) => {
    const buildId = requireBuildId(params.buildId);
    const { title, description, canonicalUrl, robots } = mapPageMetadata({
      buildId,
      path: buildCollectionPath('maps', buildId),
      search: match.search,
    });
    return {
      links: [{ rel: 'canonical', href: canonicalUrl }],
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'robots', content: robots },
      ],
    };
  },
  component: MapsPage,
});

function MapsPage() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const buildId = requireBuildId(params.buildId);
  const result = browseRouteApi.useLoaderData();
  const { heading } = mapPageMetadata({
    buildId,
    path: buildCollectionPath('maps', buildId),
  });

  return (
    <MapBrowse
      buildId={buildId}
      data={result.status === 'available' ? result.data : undefined}
      heading={heading}
      search={search}
      onSearchChange={({ search: nextSearch, replace }) =>
        navigate({ search: nextSearch, replace })
      }
    />
  );
}
