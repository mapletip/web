import { notFound } from '@tanstack/react-router';

import type { BuildId } from '@/config/maplekit';
import {
  browsePageMetadata,
  type BrowsePageMetadata,
} from '@/features/browse/metadata';
import type { BrowseSearch } from '@/features/browse/search-params';
import { buildCollectionPath } from '@/features/detail';

import { ITEM_KINDS } from '../kinds';
import type { ItemKind } from '../kinds/types';

import { itemBrowseSearch } from './search-params';

export type ItemGroup = ItemKind['group'];

export const ITEM_GROUPS = [
  { id: 'use', label: 'Use' },
  { id: 'etc', label: 'ETC' },
  { id: 'setup', label: 'Set-up' },
  { id: 'cash', label: 'Pets & Cash' },
] as const;

export function itemPath({
  buildId,
  group,
  kind,
}: {
  readonly buildId: BuildId;
  readonly group?: ItemGroup | undefined;
  readonly kind?: string | undefined;
}): string {
  const base = buildCollectionPath('items', buildId);
  return `${base}${group === undefined ? '' : `/${group}`}${kind === undefined ? '' : `/${kind}`}`;
}

function itemKind({
  group,
  slug,
}: {
  readonly group: ItemGroup;
  readonly slug?: string | undefined;
}) {
  return ITEM_KINDS.find((kind) => kind.group === group && kind.slug === slug);
}

export function resolveItemKind({
  group,
  slug,
}: {
  readonly group: ItemGroup;
  readonly slug?: string | undefined;
}) {
  if (slug === undefined) return undefined;
  const kind = itemKind({ group, slug });
  if (kind === undefined) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  return kind;
}

export function itemPageMetadata({
  buildId,
  group,
  slug,
  search,
  empty = false,
  all = false,
}: {
  readonly buildId: BuildId;
  readonly group?: ItemGroup | undefined;
  readonly slug?: string | undefined;
  readonly search?: BrowseSearch | undefined;
  readonly empty?: boolean | undefined;
  readonly all?: boolean;
}): BrowsePageMetadata {
  const kind =
    group === undefined ? undefined : resolveItemKind({ group, slug });
  const groupLabel = ITEM_GROUPS.find((entry) => entry.id === group)?.label;
  return browsePageMetadata({
    buildId,
    topic:
      kind?.label ??
      (all || group === undefined ? 'Items' : `${groupLabel} Items`),
    path: itemPath({ buildId, group, kind: slug }) + (all ? '/all' : ''),
    isDefaultView:
      !all &&
      !empty &&
      (search === undefined || itemBrowseSearch.isDefaultSearch(search)),
  });
}

export function itemPageHead(
  options: Parameters<typeof itemPageMetadata>[0] & {
    readonly search: BrowseSearch;
  },
) {
  const { title, description, canonicalUrl, robots } =
    itemPageMetadata(options);
  return {
    links: [{ rel: 'canonical', href: canonicalUrl }],
    meta: [
      { title },
      { name: 'description', content: description },
      { name: 'robots', content: robots },
    ],
  };
}
