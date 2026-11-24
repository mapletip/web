import {
  createFileRoute,
  getRouteApi,
  stripSearchParams,
} from '@tanstack/react-router';

import { requireBuildId } from '@/features/detail';
import {
  ALL_MAPS_LOCATION,
  MapBrowse,
  mapBrowseSearch,
  mapLocationPath,
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
      location: ALL_MAPS_LOCATION,
      path: mapLocationPath({ buildId, params: {} }),
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

  return (
    <MapBrowse
      buildId={buildId}
      data={result.status === 'available' ? result.data : undefined}
      location={ALL_MAPS_LOCATION}
      search={search}
      onSearchChange={({ search: nextSearch, replace }) =>
        navigate({ search: nextSearch, replace })
      }
    />
  );
}
