import { createFileRoute } from '@tanstack/react-router';

import { itemGroupRouteOptions } from '@/features/items/browse/group-route';

export const Route = createFileRoute(
  '/maplestory/{-$buildId}/items/_browse/etc/{-$kind}',
)(
  itemGroupRouteOptions({
    group: 'etc',
    path: '/maplestory/{-$buildId}/items/_browse/etc/{-$kind}',
  }),
);
