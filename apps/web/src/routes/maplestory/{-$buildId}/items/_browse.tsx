import { createFileRoute, Outlet } from '@tanstack/react-router';

import { BrowseUnavailable } from '@/components/BrowseUnavailable';
import { requireBuildId } from '@/features/detail';
import { loadItemBrowse } from '@/features/items/browse/load';

export const Route = createFileRoute('/maplestory/{-$buildId}/items/_browse')({
  beforeLoad: ({ params }) => {
    requireBuildId(params.buildId);
  },
  loader: ({ params, abortController }) =>
    loadItemBrowse(requireBuildId(params.buildId), abortController.signal),
  staleTime: Infinity,
  errorComponent: BrowseUnavailable,
  component: Outlet,
});
