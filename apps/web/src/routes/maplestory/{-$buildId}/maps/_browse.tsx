import { createFileRoute, Outlet } from '@tanstack/react-router';

import { BrowseUnavailable } from '@/components/BrowseUnavailable';
import { requireBuildId } from '@/features/detail';
import { loadMapBrowse } from '@/features/maps/browse/load';

/** Loads one build's Map Browse once for All maps and every location page. */
export const Route = createFileRoute('/maplestory/{-$buildId}/maps/_browse')({
  beforeLoad: ({ params }) => {
    requireBuildId(params.buildId);
  },
  loader: ({ params, abortController }) =>
    loadMapBrowse(requireBuildId(params.buildId), abortController.signal),
  staleTime: Infinity,
  errorComponent: BrowseUnavailable,
  component: Outlet,
});
