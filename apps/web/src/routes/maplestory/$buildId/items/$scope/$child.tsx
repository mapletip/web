import {
  createFileRoute,
  getRouteApi,
  notFound,
} from '@tanstack/react-router';

import { BUILDS, supportedBuildSlug } from '@/config/maplekit';
import {
  getItemScopeChild,
  isItemScope,
  isItemScopeChild,
  ItemBrowse,
  type ItemScopeSlug,
} from '@/features/items/browse';

const versionedItemsRouteApi = getRouteApi('/maplestory/$buildId/items');

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

export const Route = createFileRoute(
  '/maplestory/$buildId/items/$scope/$child',
)({
  beforeLoad: ({ params }) => {
    supportedBuildSlug(params.buildId);
    validateScopeAndChild(params.scope, params.child);
  },
  head: ({ params }) => {
    const buildId = supportedBuildSlug(params.buildId);
    const label = BUILDS[buildId].label;
    const { scope, child } = validateScopeAndChild(params.scope, params.child);
    const childInfo = getItemScopeChild(scope, child);
    const childLabel = childInfo?.label ?? child;
    return {
      meta: [
        {
          title: `MapleStory ${label} ${childLabel} – MapleTip`,
        },
        {
          name: 'description',
          content: `Browse ${label} ${childLabel.toLowerCase()} in MapleStory.`,
        },
      ],
    };
  },
  component: VersionedChildItemsPage,
});

function VersionedChildItemsPage() {
  const { buildId, scope, child } = Route.useParams();
  const validBuildId = supportedBuildSlug(buildId);
  const valid = validateScopeAndChild(scope, child);
  const { rows } = versionedItemsRouteApi.useLoaderData();

  return (
    <ItemBrowse
      buildId={validBuildId}
      rows={rows}
      scope={valid.scope}
      childSlug={valid.child}
    />
  );
}
