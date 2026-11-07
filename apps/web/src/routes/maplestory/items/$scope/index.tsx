import {
  createFileRoute,
  getRouteApi,
  notFound,
} from '@tanstack/react-router';

import { DEFAULT_BUILD_ID } from '@/config/maplekit';
import {
  getItemScope,
  isItemScope,
  ItemBrowse,
  type ItemScopeSlug,
} from '@/features/items/browse';

const itemsRouteApi = getRouteApi('/maplestory/items');

function validateScope(scope: string): ItemScopeSlug {
  if (!isItemScope(scope) || scope === 'all') {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  return scope;
}

export const Route = createFileRoute('/maplestory/items/$scope/')({
  beforeLoad: ({ params }) => {
    validateScope(params.scope);
  },
  head: ({ params }) => {
    const scope = validateScope(params.scope);
    const scopeInfo = getItemScope(scope);
    return {
      meta: [
        {
          title: `MapleStory Classic World ${scopeInfo.label} Items – MapleTip`,
        },
        {
          name: 'description',
          content: `Browse Classic World ${scopeInfo.label.toLowerCase()} items in MapleStory.`,
        },
      ],
    };
  },
  component: ScopedItemsPage,
});

function ScopedItemsPage() {
  const { scope } = Route.useParams();
  const validScope = validateScope(scope);
  const { rows } = itemsRouteApi.useLoaderData();

  return (
    <ItemBrowse
      buildId={DEFAULT_BUILD_ID}
      rows={rows}
      scope={validScope}
    />
  );
}
