import { createFileRoute } from '@tanstack/react-router';

import { itemGroupRouteOptions } from '@/features/items/browse/group-route';

export const Route = createFileRoute(
  '/maplestory/{-$buildId}/items/_browse/cash/{-$kind}',
)(
  itemGroupRouteOptions({
    group: 'cash',
    path: '/maplestory/{-$buildId}/items/_browse/cash/{-$kind}',
  }),
);
