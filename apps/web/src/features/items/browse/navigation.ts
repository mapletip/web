/**
 * Navigation data model and helpers for Items Browse.
 *
 * Shared between desktop rail and mobile header navigation presentations.
 * Both presentations are server-rendered.
 */
import allItemsIcon from '@/assets/maplestory/navigation/items-all-meso-pouch.png?no-inline';
import cashIcon from '@/assets/maplestory/navigation/items-cash-pet-brown-puppy.png?no-inline';
import etcIcon from '@/assets/maplestory/navigation/items-etc-snail-shell.png?no-inline';
import setupIcon from '@/assets/maplestory/navigation/items-setup-blue-chair.png?no-inline';
import useIcon from '@/assets/maplestory/navigation/items-use-red-potion.png?no-inline';
import type { BuildId } from '@/config/maplekit';

import {
  getCategoryCounts,
  ITEM_SCOPE_SLUGS,
  ITEM_SCOPES,
  type ItemScopeSlug,
} from './categories';
import type { ItemRow } from './project';
import type { ItemCategorySelection } from './routing';

export const ITEM_NAV_TARGET =
  '/maplestory/{-$buildId}/items/{-$scope}/{-$child}' as const;

export interface ItemNavRouteParams {
  readonly buildId?: string | undefined;
  readonly scope?: string | undefined;
  readonly child?: string | undefined;
}

export interface ItemNavChild {
  readonly slug: string;
  readonly label: string;
  readonly count: number;
  readonly active: boolean;
  readonly zeroCount: boolean;
  readonly to: typeof ITEM_NAV_TARGET;
  readonly params: ItemNavRouteParams;
  readonly search: Record<string, unknown>;
}

export interface ItemNavScope {
  readonly slug: ItemScopeSlug;
  readonly label: string;
  readonly icon: string;
  readonly count: number;
  readonly active: boolean;
  readonly expanded: boolean;
  readonly children: readonly ItemNavChild[];
  readonly to: typeof ITEM_NAV_TARGET;
  readonly params: ItemNavRouteParams;
  readonly search: Record<string, unknown>;
}

interface ItemNavDataOptions {
  readonly rows: readonly ItemRow[];
  readonly category: ItemCategorySelection;
  readonly buildId: BuildId;
  readonly search?: Record<string, unknown> | undefined;
}

const SCOPE_ICONS: Readonly<Record<ItemScopeSlug, string>> = {
  all: allItemsIcon,
  use: useIcon,
  etc: etcIcon,
  setup: setupIcon,
  cash: cashIcon,
};

export function getItemNavData({
  rows,
  category,
  buildId,
  search,
}: ItemNavDataOptions): readonly ItemNavScope[] {
  const counts = getCategoryCounts(rows);
  const currentScopeSlug = category.scope.slug;
  const currentChildSlug = category.child?.slug;
  const navSearch = { ...search };
  delete navSearch['page'];
  const buildParam = buildId === 'cw-launch' ? undefined : buildId;

  return ITEM_SCOPE_SLUGS.map((scopeSlug) => {
    const scopeObj = ITEM_SCOPES[scopeSlug];
    const scopeCounts = counts[scopeSlug];
    const isScopeActive =
      scopeSlug === currentScopeSlug && currentChildSlug === undefined;
    const isExpanded = scopeSlug === currentScopeSlug;

    const children: ItemNavChild[] = scopeObj.children.map((child) => {
      const childCount = scopeCounts.children[child.slug] ?? 0;
      const isChildActive =
        scopeSlug === currentScopeSlug && currentChildSlug === child.slug;
      return {
        slug: child.slug,
        label: child.label,
        count: childCount,
        active: isChildActive,
        zeroCount: childCount === 0,
        to: ITEM_NAV_TARGET,
        params: {
          buildId: buildParam,
          scope: scopeSlug,
          child: child.slug,
        },
        search: navSearch,
      };
    });

    return {
      slug: scopeSlug,
      label: scopeObj.label,
      icon: SCOPE_ICONS[scopeSlug],
      count: scopeCounts.total,
      active: isScopeActive,
      expanded: isExpanded,
      children,
      to: ITEM_NAV_TARGET,
      params: {
        buildId: buildParam,
        scope: scopeSlug === 'all' ? undefined : scopeSlug,
        child: undefined,
      },
      search: navSearch,
    };
  });
}
