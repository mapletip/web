import {
  createFileRoute,
  getRouteApi,
  notFound,
  stripSearchParams,
} from '@tanstack/react-router';

import { requireBuildId } from '@/features/detail';
import {
  MapBrowse,
  mapBrowseSearch,
  mapLocationPath,
  mapPageMetadata,
  resolveMapLocation,
} from '@/features/maps/browse';

const browseRouteApi = getRouteApi('/maplestory/{-$buildId}/maps/_browse');

/** A region, area or collection page, resolved against the build's geography. */
export const Route = createFileRoute(
  '/maplestory/{-$buildId}/maps/_browse/in/$location/{-$area}',
)({
  validateSearch: mapBrowseSearch.schema,
  search: {
    middlewares: [stripSearchParams(mapBrowseSearch.defaultSearch)],
  },
  loader: async ({ params, parentMatchPromise }) => {
    const { loaderData } = await parentMatchPromise;
    const location =
      loaderData?.status === 'available'
        ? resolveMapLocation({
            geography: loaderData.data.geography,
            location: params.location,
            area: params.area,
          })
        : undefined;
    if (location === undefined) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound();
    }
    return location;
  },
  head: ({ params, loaderData, match }) => {
    if (loaderData === undefined) return {};
    const buildId = requireBuildId(params.buildId);
    const { title, description, canonicalUrl, robots } = mapPageMetadata({
      buildId,
      location: loaderData,
      path: mapLocationPath({ buildId, params: loaderData.params }),
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
  component: MapLocationPage,
});

function MapLocationPage() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const location = Route.useLoaderData();
  const result = browseRouteApi.useLoaderData();

  return (
    <MapBrowse
      buildId={requireBuildId(params.buildId)}
      data={result.status === 'available' ? result.data : undefined}
      location={location}
      search={search}
      onSearchChange={({ search: nextSearch, replace }) =>
        navigate({ search: nextSearch, replace })
      }
    />
  );
}
