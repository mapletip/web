/**
 * Declarative category navigation tree for Items Browse.
 */
import type { DrillDownNode } from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';
import type { ComponentProps, ReactElement } from 'react';

import cashIcon from '@/assets/maplestory/navigation/items-cash-pet-brown-puppy.png?no-inline';
import etcIcon from '@/assets/maplestory/navigation/items-etc-snail-shell.png?no-inline';
import setupIcon from '@/assets/maplestory/navigation/items-setup-blue-chair.png?no-inline';
import useIcon from '@/assets/maplestory/navigation/items-use-red-potion.png?no-inline';
import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';

import { assignChild, getCategoryCounts } from './assignment';
import {
  ITEM_SCOPES,
  ITEM_SCOPE_SLUGS,
  type ItemScopeSlug,
} from './categories';
import {
  buildItemNavHref,
  itemBuildRouteParam,
  type ItemNavRouteParams,
} from './navigation';
import type { ItemRow } from './project';

type ScopedItemScopeSlug = Exclude<ItemScopeSlug, 'all'>;

const NON_ALL_SCOPES = ITEM_SCOPE_SLUGS.filter(
  (slug): slug is ScopedItemScopeSlug => slug !== 'all',
);

const SCOPE_ICONS: Readonly<Record<ScopedItemScopeSlug, string>> = {
  use: useIcon,
  etc: etcIcon,
  setup: setupIcon,
  cash: cashIcon,
};

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

export interface GetItemNavTreeOptions {
  readonly rows: readonly ItemRow[];
  readonly buildId: BuildId;
}

/**
 * Builds the declarative DrillDownNode root tree for Items navigation.
 */
export function getItemNavTree({
  rows,
  buildId,
}: GetItemNavTreeOptions): DrillDownNode<ItemNavRouteParams> {
  const counts = getCategoryCounts(rows);
  const buildParam = itemBuildRouteParam({ buildId });

  const childMemberIcons = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.icon) {
      continue;
    }
    for (const scopeSlug of NON_ALL_SCOPES) {
      const scope = ITEM_SCOPES[scopeSlug];
      if (scope.itemClasses.some((itemClass) => itemClass === row.itemClass)) {
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
    count: counts.all.total,
    meta: rootParams,
    children: scopeNodes,
  };
}
