/**
 * Declarative category navigation tree and router adapter for Items Browse.
 */
import type {
  DrillDownLinkRenderProps,
  DrillDownNode,
} from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';
import { Link } from '@tanstack/react-router';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

import allItemsIcon from '@/assets/maplestory/navigation/items-all-maple-leaf.png?no-inline';
import cashIcon from '@/assets/maplestory/navigation/items-cash-pet-brown-puppy.png?no-inline';
import etcIcon from '@/assets/maplestory/navigation/items-etc-snail-shell.png?no-inline';
import setupIcon from '@/assets/maplestory/navigation/items-setup-blue-chair.png?no-inline';
import useIcon from '@/assets/maplestory/navigation/items-use-red-potion.png?no-inline';
import {
  DEFAULT_BUILD_ID,
  MAPLEKIT_RELEASE,
  type BuildId,
} from '@/config/maplekit';

import {
  assignChild,
  getCategoryCounts,
  ITEM_SCOPES,
  ITEM_SCOPE_SLUGS,
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

const SCOPE_ICONS: Readonly<Record<ItemScopeSlug, string>> = {
  all: allItemsIcon,
  use: useIcon,
  etc: etcIcon,
  setup: setupIcon,
  cash: cashIcon,
};

/**
 * Recursively locates a node by id in a DrillDownNode tree.
 */
export function findItemNavNode<TMeta = ItemNavRouteParams>(
  root: DrillDownNode<TMeta>,
  targetId: string,
): DrillDownNode<TMeta> | undefined {
  if (root.id === targetId) {
    return root;
  }
  if (root.children) {
    for (const child of root.children) {
      const match = findItemNavNode(child, targetId);
      if (match) {
        return match;
      }
    }
  }
  return undefined;
}

/**
 * Renders the decorative 20px img icon for navigation nodes.
 */
function renderItemNavIcon(src: string): ReactElement<ComponentProps<'img'>> {
  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      decoding="async"
      style={{ objectFit: 'contain' }}
    />
  );
}

/**
 * Builds fully resolved href string from typed route parameters in one place.
 */
export function buildItemNavHref(params: ItemNavRouteParams): string {
  const segments = ['/maplestory'];
  if (params.buildId) {
    segments.push(params.buildId);
  }
  segments.push('items');
  if (params.scope) {
    segments.push(params.scope);
    if (params.child) {
      segments.push(params.child);
    }
  }
  return segments.join('/');
}

/**
 * Derives unique node id in the navigation tree from the selected category.
 * Shape: 'all' | '<scope>' | '<scope>/<child>'
 */
export function itemNavId(category: ItemCategorySelection): string {
  if (category.child) {
    return `${category.scope.slug}/${category.child.slug}`;
  }
  return category.scope.slug;
}

const NON_ALL_SCOPES = ITEM_SCOPE_SLUGS.filter(
  (slug): slug is Exclude<ItemScopeSlug, 'all'> => slug !== 'all',
);

/**
 * Builds the declarative DrillDownNode root tree for Items navigation.
 */
export function getItemNavTree(
  rows: readonly ItemRow[],
  buildId: BuildId,
): DrillDownNode<ItemNavRouteParams> {
  const counts = getCategoryCounts(rows);
  const buildParam = buildId === DEFAULT_BUILD_ID ? undefined : buildId;

  const childMemberIcons = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.icon) {
      continue;
    }
    for (const scopeSlug of NON_ALL_SCOPES) {
      const scope = ITEM_SCOPES[scopeSlug];
      if (scope.itemClasses.includes(row.itemClass)) {
        const child = assignChild(row, scope);
        if (child) {
          const key = `${scopeSlug}/${child.slug}`;
          let set = childMemberIcons.get(key);
          if (!set) {
            set = new Set<string>();
            childMemberIcons.set(key, set);
          }
          set.add(row.icon);
        }
        break;
      }
    }
  }

  const scopeNodes: readonly DrillDownNode<ItemNavRouteParams>[] =
    NON_ALL_SCOPES.map((scopeSlug) => {
      const scopeObj = ITEM_SCOPES[scopeSlug];
      const scopeCounts = counts[scopeSlug];
      const scopeParams: ItemNavRouteParams = {
        buildId: buildParam,
        scope: scopeSlug,
        child: undefined,
      };

      const childNodes: readonly DrillDownNode<ItemNavRouteParams>[] =
        scopeObj.children.map((child) => {
          const childParams: ItemNavRouteParams = {
            buildId: buildParam,
            scope: scopeSlug,
            child: child.slug,
          };
          let childIcon: ReactElement<ComponentProps<'img'>> | undefined;
          if (child.iconContentIds) {
            const memberIcons = childMemberIcons.get(
              `${scopeSlug}/${child.slug}`,
            );
            if (memberIcons) {
              for (const contentId of child.iconContentIds) {
                if (memberIcons.has(contentId)) {
                  childIcon = renderItemNavIcon(
                    itemIconUrl(MAPLEKIT_RELEASE.baseUrl, contentId),
                  );
                  break;
                }
              }
            }
          }

          return {
            id: `${scopeSlug}/${child.slug}`,
            label: child.label,
            href: buildItemNavHref(childParams),
            ...(childIcon ? { icon: childIcon } : {}),
            count: scopeCounts.children[child.slug] ?? 0,
            meta: childParams,
          };
        });

      return {
        id: scopeSlug,
        label: scopeObj.label,
        href: buildItemNavHref(scopeParams),
        icon: renderItemNavIcon(SCOPE_ICONS[scopeSlug]),
        count: scopeCounts.total,
        meta: scopeParams,
        children: childNodes,
      };
    });

  const rootParams: ItemNavRouteParams = {
    buildId: buildParam,
    scope: undefined,
    child: undefined,
  };
  return {
    id: 'all',
    label: ITEM_SCOPES.all.label,
    href: buildItemNavHref(rootParams),
    icon: renderItemNavIcon(SCOPE_ICONS.all),
    count: counts.all.total,
    meta: rootParams,
    children: scopeNodes,
  };
}

export const DEFAULT_NAV_PARAMS: ItemNavRouteParams = {
  buildId: undefined,
  scope: undefined,
  child: undefined,
};

/**
 * App adapter forwarding DrillDownNav link props to TanStack Link.
 */
export function renderItemNavLink(
  node: DrillDownNode<ItemNavRouteParams>,
  props: DrillDownLinkRenderProps,
): ReactNode {
  return (
    <Link
      to={ITEM_NAV_TARGET}
      params={node.meta ?? DEFAULT_NAV_PARAMS}
      activeOptions={{ exact: true, includeSearch: false }}
      className={props.className}
      aria-current={props['aria-current']}
      onClick={props.onClick}
    >
      {props.children}
    </Link>
  );
}
