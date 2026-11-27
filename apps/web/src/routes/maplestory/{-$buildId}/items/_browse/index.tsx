import { Stack, Title } from '@mantine/core';
import {
  createFileRoute,
  Link,
  stripSearchParams,
} from '@tanstack/react-router';

import { BUILDS } from '@/config/maplekit';
import { requireBuildId } from '@/features/detail';
import {
  ITEM_GROUPS,
  itemPageHead,
  itemPath,
} from '@/features/items/browse/page';
import { itemBrowseSearch } from '@/features/items/browse/search-params';

export const Route = createFileRoute('/maplestory/{-$buildId}/items/_browse/')({
  validateSearch: itemBrowseSearch.schema,
  search: { middlewares: [stripSearchParams(itemBrowseSearch.defaultSearch)] },
  head: ({ params, match }) =>
    itemPageHead({
      buildId: requireBuildId(params.buildId),
      search: match.search,
      all: false,
    }),
  component: ItemsPage,
});
function ItemsPage() {
  const params = Route.useParams();
  const buildId = requireBuildId(params.buildId);
  return (
    <Stack p="lg">
      <Title order={1}>MapleStory {BUILDS[buildId].label} Items</Title>
      {ITEM_GROUPS.map((group) => (
        <Link key={group.id} to={itemPath({ buildId, group: group.id })}>
          {group.label}
        </Link>
      ))}
    </Stack>
  );
}
