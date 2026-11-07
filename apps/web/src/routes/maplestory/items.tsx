import { createFileRoute, Outlet } from '@tanstack/react-router';

import { BrowseUnavailable } from '@/components/BrowseUnavailable';
import { DEFAULT_BUILD_ID } from '@/config/maplekit';
import { loadItemBrowse } from '@/features/items/browse/load';

export const Route = createFileRoute('/maplestory/items')({
  loader: ({ abortController }) =>
    loadItemBrowse(DEFAULT_BUILD_ID, abortController.signal),
  staleTime: Infinity,
  component: ItemsLayout,
  errorComponent: BrowseUnavailable,
});

function ItemsLayout() {
  return <Outlet />;
}
