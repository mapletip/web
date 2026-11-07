import {
  createFileRoute,
  getRouteApi,
  notFound,
} from '@tanstack/react-router';

import { DEFAULT_BUILD_ID } from '@/config/maplekit';
import {
  getItemScopeChild,
  isItemScope,
  isItemScopeChild,
  ItemBrowse,
  type ItemScopeSlug,
} from '@/features/items/browse';

const itemsRouteApi = getRouteApi('/maplestory/items');

function validateScopeAndChild(
  scope: string,
  child: string,
): { scope: ItemScopeSlug; child: string } {
  if (!isItemScope(scope) || scope === 'all') {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  if (!isItemScopeChild(scope, child)) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  return { scope, child };
}

export const Route = createFileRoute('/maplestory/items/$scope/$child')({
  beforeLoad: ({ params }) => {
    validateScopeAndChild(params.scope, params.child);
  },
  head: ({ params }) => {
    const { scope, child } = validateScopeAndChild(params.scope, params.child);
    const childInfo = getItemScopeChild(scope, child);
    const label = childInfo?.label ?? child;
    return {
      meta: [
        {
          title: `MapleStory Classic World ${label} – MapleTip`,
        },
        {
          name: 'description',
          content: `Browse Classic World ${label.toLowerCase()} in MapleStory.`,
        },
      ],
    };
  },
  component: ChildItemsPage,
});

function ChildItemsPage() {
  const { scope, child } = Route.useParams();
  const valid = validateScopeAndChild(scope, child);
  const { rows } = itemsRouteApi.useLoaderData();

  return (
    <ItemBrowse
      buildId={DEFAULT_BUILD_ID}
      rows={rows}
      scope={valid.scope}
      childSlug={valid.child}
    />
  );
}
