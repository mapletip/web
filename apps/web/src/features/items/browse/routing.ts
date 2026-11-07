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
  isItemScopeChild,
  type ItemScopeSlug,
} from './categories';

export interface ItemRouteParams {
  readonly buildId?: string | undefined;
  readonly scope?: string | undefined;
  readonly child?: string | undefined;
}

export interface ItemCategorySelection {
  readonly scope: ItemScopeSlug;
  readonly childSlug?: string;
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
    return { buildId, category: { scope: 'all' } };
  }

  if (scope === 'all') {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }

  if (!isItemScope(scope)) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }

  if (child !== undefined) {
    if (!isItemScopeChild(scope, child)) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound();
    }
    return { buildId, category: { scope, childSlug: child } };
  }

  return { buildId, category: { scope } };
}
