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
import { loadProjectedItemData } from './relation-projection';
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
    const { descriptions, relations } = routeApi.useLoaderData();
    const buildId = requireBuildId(params.buildId);
    const kind = resolveItemKind({ group, slug: params.kind });
    return (
      <ItemFrame
        buildId={buildId}
        rows={result.rows}
        coverage={result.coverage}
        scrollTargetIcons={result.scrollTargetIcons}
        relations={relations}
        {...(descriptions === undefined ? {} : { descriptions })}
        group={group}
        {...(kind === undefined ? {} : { kind })}
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
      readonly params: {
        readonly buildId?: string | undefined;
        readonly kind?: string | undefined;
      };
      readonly parentMatchPromise: Promise<{ loaderData?: LoadedItemBrowse }>;
    }) => {
      const kind = resolveItemKind({ group, slug: params.kind });
      const { loaderData } = await parentMatchPromise;
      const groupRows =
        loaderData?.rows.filter((row) => row.kindPath[1] === group) ?? [];
      const projected =
        loaderData !== undefined
          ? await loadProjectedItemData({
              buildId: requireBuildId(params.buildId),
              ...(kind === undefined ? {} : { kind }),
              rows: groupRows,
              coverage: loaderData.coverage,
              ...(kind === undefined
                ? {
                    relationKinds: [
                      ...(groupRows.some(
                        (row) => (row.neededForQuestCount ?? 0) > 0,
                      )
                        ? ['needed-for-quest' as const]
                        : []),
                      ...(groupRows.some(
                        (row) => (row.monsterDropCount ?? 0) > 0,
                      )
                        ? ['monster-drop' as const]
                        : []),
                    ],
                  }
                : {}),
            })
          : { relations: {} };
      return {
        ...projected,
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
