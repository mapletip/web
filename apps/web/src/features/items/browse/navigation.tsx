/**
 * Declarative category navigation tree and router adapter for Items Browse.
 */
import type {
  DrillDownLinkRenderProps,
  DrillDownNode,
} from '@mapletip/component-library';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { DEFAULT_BUILD_ID, type BuildId } from '@/config/maplekit';

import type { ItemCategorySelection } from './routing';
import type { ItemBrowseSearch } from './search-params';

export const ITEM_NAV_TARGET =
  '/maplestory/{-$buildId}/items/{-$scope}/{-$child}' as const;

export interface ItemNavRouteParams {
  readonly buildId?: string | undefined;
  readonly scope?: string | undefined;
  readonly child?: string | undefined;
}

export interface ItemBuildRouteParamOptions {
  readonly buildId: BuildId;
}

/** Maps the default build to its canonical unversioned route parameter. */
export function itemBuildRouteParam({ buildId }: ItemBuildRouteParamOptions) {
  return buildId === DEFAULT_BUILD_ID ? undefined : buildId;
}

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

export interface GetItemNavPathOptions {
  readonly root: DrillDownNode<ItemNavRouteParams>;
  readonly targetId: string;
}

/** Returns the root-to-node path for a selected navigation item. */
export function getItemNavPath({ root, targetId }: GetItemNavPathOptions) {
  function findPath(
    node: DrillDownNode<ItemNavRouteParams>,
    parentPath: readonly DrillDownNode<ItemNavRouteParams>[],
  ): readonly DrillDownNode<ItemNavRouteParams>[] | undefined {
    const path = [...parentPath, node];
    if (node.id === targetId) return path;
    for (const child of node.children ?? []) {
      const childPath = findPath(child, path);
      if (childPath) return childPath;
    }
    return undefined;
  }

  return findPath(root, []) ?? [root];
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

export const DEFAULT_NAV_PARAMS: ItemNavRouteParams = {
  buildId: undefined,
  scope: undefined,
  child: undefined,
};

export interface RenderItemNavLinkOptions {
  readonly node: DrillDownNode<ItemNavRouteParams>;
  readonly props: DrillDownLinkRenderProps;
  readonly search: ItemBrowseSearch;
}

/**
 * App adapter forwarding DrillDownNav link props to TanStack Link.
 */
export function renderItemNavLink({
  node,
  props,
  search,
}: RenderItemNavLinkOptions): ReactNode {
  return (
    <Link
      to={ITEM_NAV_TARGET}
      params={node.meta ?? DEFAULT_NAV_PARAMS}
      search={search}
      activeOptions={{ exact: true, includeSearch: false }}
      className={props.className}
      aria-current={props['aria-current']}
      onClick={props.onClick}
    >
      {props.children}
    </Link>
  );
}
