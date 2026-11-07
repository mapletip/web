/**
 * Route parameter parsing for Items Browse routes.
 */
import { notFound } from '@tanstack/react-router';

import {
  DEFAULT_BUILD_ID,
  supportedBuildSlug,
  type BuildId,
} from '@/config/maplekit';

import {
  isItemScope,
  ITEM_SCOPES,
  type ItemCategoryChild,
  type ItemCategoryScope,
} from './categories';

export interface ItemRouteParams {
  readonly buildId?: string | undefined;
  readonly scope?: string | undefined;
  readonly child?: string | undefined;
}

export interface ItemCategorySelection {
  readonly scope: ItemCategoryScope;
  readonly child?: ItemCategoryChild | undefined;
}

export interface ParsedItemRoute {
  readonly buildId: BuildId;
  readonly category: ItemCategorySelection;
}

/**
 * Parses raw route parameters into a validated build ID and category selection.
 * Throws notFound() if:
 * - buildId is invalid or explicit cw-launch
 * - scope is 'all' or unknown
 * - child is invalid for the scope, or supplied without a scope
 */
export function parseItemRouteParams(params: ItemRouteParams): ParsedItemRoute {
  let buildId: BuildId;
  if (params.buildId === undefined) {
    buildId = DEFAULT_BUILD_ID;
  } else {
    buildId = supportedBuildSlug(params.buildId);
  }

  const { scope, child } = params;

  if (scope === undefined) {
    if (child !== undefined) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound();
    }
    return { buildId, category: { scope: ITEM_SCOPES.all } };
  }

  if (scope === 'all') {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }

  if (!isItemScope(scope)) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }

  const scopeObj = ITEM_SCOPES[scope];

  if (child !== undefined) {
    const childObj = scopeObj.children.find((c) => c.slug === child);
    if (!childObj) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound();
    }
    return { buildId, category: { scope: scopeObj, child: childObj } };
  }

  return { buildId, category: { scope: scopeObj } };
}
