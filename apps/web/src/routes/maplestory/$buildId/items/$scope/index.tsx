import {
  createFileRoute,
  getRouteApi,
  notFound,
} from '@tanstack/react-router';

import { BUILDS, supportedBuildSlug } from '@/config/maplekit';
import {
  getItemScope,
  isItemScope,
  ItemBrowse,
  type ItemScopeSlug,
} from '@/features/items/browse';

const versionedItemsRouteApi = getRouteApi('/maplestory/$buildId/items');

function validateScope(scope: string): ItemScopeSlug {
  if (!isItemScope(scope) || scope === 'all') {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  return scope;
}

export const Route = createFileRoute('/maplestory/$buildId/items/$scope/')({
  beforeLoad: ({ params }) => {
    supportedBuildSlug(params.buildId);
    validateScope(params.scope);
  },
  head: ({ params }) => {
    const buildId = supportedBuildSlug(params.buildId);
    const label = BUILDS[buildId].label;
    const scope = validateScope(params.scope);
    const scopeInfo = getItemScope(scope);
    return {
      meta: [
        {
          title: `MapleStory ${label} ${scopeInfo.label} Items – MapleTip`,
        },
        {
          name: 'description',
          content: `Browse ${label} ${scopeInfo.label.toLowerCase()} items in MapleStory.`,
        },
      ],
    };
  },
  component: VersionedScopedItemsPage,
});

function VersionedScopedItemsPage() {
  const { buildId, scope } = Route.useParams();
  const validBuildId = supportedBuildSlug(buildId);
  const validScope = validateScope(scope);
  const { rows } = versionedItemsRouteApi.useLoaderData();

  return (
    <ItemBrowse
      buildId={validBuildId}
      rows={rows}
      scope={validScope}
    />
  );
}
