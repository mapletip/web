import { createFileRoute, Outlet } from '@tanstack/react-router';

import { BrowseUnavailable } from '@/components/BrowseUnavailable';
import { loadItemBrowse } from '@/features/items/browse/load';
import { parseItemRouteParams } from '@/features/items/browse/routing';

export const Route = createFileRoute('/maplestory/{-$buildId}/items')({
  beforeLoad: ({ params }) => {
    parseItemRouteParams(params);
  },
  loader: ({ params, abortController }) => {
    const { buildId } = parseItemRouteParams(params);
    return loadItemBrowse(buildId, abortController.signal);
  },
  staleTime: Infinity,
  errorComponent: BrowseUnavailable,
  pendingComponent: () => (
    <div role="status" style={{ padding: '2rem', textAlign: 'center' }}>
      Loading items…
    </div>
  ),
  component: ItemsLayout,
});

function ItemsLayout() {
  return <Outlet />;
}
