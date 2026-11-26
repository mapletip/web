import {
  getRouteApi,
  stripSearchParams,
  useRouter,
} from '@tanstack/react-router';

import type { BrowseSearch } from '@/features/browse/search-params';
import { requireBuildId } from '@/features/detail';

import { ItemFrame } from './frame';
import type { LoadedItemBrowse } from './load';
import { itemPageHead, resolveItemKind, type ItemGroup } from './page';
import { itemBrowseSearch } from './search-params';

const browseRouteApi = getRouteApi('/maplestory/{-$buildId}/items/_browse');

type GroupRoutePath =
  | '/maplestory/{-$buildId}/items/_browse/use/{-$kind}'
  | '/maplestory/{-$buildId}/items/_browse/etc/{-$kind}'
  | '/maplestory/{-$buildId}/items/_browse/setup/{-$kind}'
  | '/maplestory/{-$buildId}/items/_browse/cash/{-$kind}';

/** Shared search validation, loader, head and page for the four fixed Items groups. */
export function itemGroupRouteOptions<TPath extends GroupRoutePath>({
  group,
  path,
}: {
  readonly group: ItemGroup;
  readonly path: TPath;
}) {
  const routeApi = getRouteApi(path);

  function GroupPage() {
    const router = useRouter();
    const params = routeApi.useParams();
    const search = routeApi.useSearch();
    const result = browseRouteApi.useLoaderData();
    return (
      <ItemFrame
        buildId={requireBuildId(params.buildId)}
        rows={result.rows}
        group={group}
        kind={resolveItemKind({ group, slug: params.kind })}
        search={search}
        onSearchChange={({ search: nextSearch, replace }) =>
          router.navigate({ to: '.', search: nextSearch, replace })
        }
      />
    );
  }

  return {
    validateSearch: itemBrowseSearch.schema,
    search: {
      middlewares: [
        stripSearchParams<BrowseSearch>(itemBrowseSearch.defaultSearch),
      ],
    },
    loader: async ({
      params,
      parentMatchPromise,
    }: {
      readonly params: { readonly kind?: string | undefined };
      readonly parentMatchPromise: Promise<{ loaderData?: LoadedItemBrowse }>;
    }) => {
      const kind = resolveItemKind({ group, slug: params.kind });
      const { loaderData } = await parentMatchPromise;
      return {
        empty:
          kind !== undefined &&
          loaderData?.rows.every((row) => row.kind !== kind.id),
      };
    },
    head: ({
      params,
      match,
      loaderData,
    }: {
      readonly params: {
        readonly buildId?: string | undefined;
        readonly kind?: string | undefined;
      };
      readonly match: { readonly search: BrowseSearch };
      readonly loaderData?:
        { readonly empty?: boolean | undefined } | undefined;
    }) =>
      itemPageHead({
        buildId: requireBuildId(params.buildId),
        group,
        slug: params.kind,
        search: match.search,
        empty: loaderData?.empty,
      }),
    component: GroupPage,
  };
}
