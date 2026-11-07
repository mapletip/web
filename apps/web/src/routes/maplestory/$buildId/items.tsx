import { createFileRoute, Outlet } from '@tanstack/react-router';

import { BrowseUnavailable } from '@/components/BrowseUnavailable';
import { supportedBuildSlug } from '@/config/maplekit';
import { loadItemBrowse } from '@/features/items/browse/load';

export const Route = createFileRoute('/maplestory/$buildId/items')({
  beforeLoad: ({ params }) => {
    supportedBuildSlug(params.buildId);
  },
  loader: ({ params, abortController }) =>
    loadItemBrowse(supportedBuildSlug(params.buildId), abortController.signal),
  staleTime: Infinity,
  component: VersionedItemsLayout,
  errorComponent: BrowseUnavailable,
});

function VersionedItemsLayout() {
  return <Outlet />;
}
