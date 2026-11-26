import { RecordCard, Thumbnail } from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';
import type { ReactElement } from 'react';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { ITEM_KINDS } from '../kinds';
import type { ItemKind } from '../kinds/types';

import type { CategorizedItemRow } from './project';

const PICTURE_CARD_COLUMNS = { base: 2, md: 4, lg: 5 } as const;
// Short cards put text beside the picture, so they need wider columns.
const SHORT_CARD_COLUMNS = { base: 1, sm: 2, lg: 3 } as const;

/** Grid columns for a category's cards; cross-category results use picture cards. */
export function itemCardColumns({
  kind,
}: {
  readonly kind: ItemKind | undefined;
}): {
  readonly base: number;
  readonly sm?: number;
  readonly md?: number;
  readonly lg: number;
} {
  return kind?.card?.layout === 'short'
    ? SHORT_CARD_COLUMNS
    : PICTURE_CARD_COLUMNS;
}
export const ITEM_KIND_LABELS: ReadonlyMap<string, string> = new Map(
  ITEM_KINDS.map((entry) => [entry.id, entry.label]),
);

export interface RenderItemCardOptions {
  readonly record: CategorizedItemRow;
  readonly openDetails?: (() => void) | undefined;
  readonly isDetailsOpen?: boolean | undefined;
  readonly secondaryLine?: string | undefined;
  readonly showCategoryLabel?: boolean | undefined;
}

// 32px item icons, magnified to fill each layout's media slot (52px column on short cards).
const PICTURE_THUMBNAIL = { size: 80, magnify: 2 } as const;
const SHORT_THUMBNAIL = { size: 48, magnify: 1.5 } as const;

/** Shared item card renderer used by category pages, cross-category results, and group shelves. */
export function renderItemCard({
  record,
  openDetails,
  isDetailsOpen,
  secondaryLine,
  showCategoryLabel = true,
}: RenderItemCardOptions): ReactElement {
  const kind: ItemKind | undefined = ITEM_KINDS.find(
    (entry) => entry.id === record.kind,
  );
  const card = kind?.card;
  const fact = secondaryLine ?? card?.lead(record);
  const media = (
    <Thumbnail
      src={
        record.icon === undefined
          ? undefined
          : itemIconUrl(MAPLEKIT_RELEASE.baseUrl, record.icon)
      }
      {...(card?.layout === 'short' ? SHORT_THUMBNAIL : PICTURE_THUMBNAIL)}
    />
  );
  const shared = {
    title: record.name,
    media,
    ...(fact === undefined ? {} : { secondaryLine: fact }),
    ...(openDetails === undefined
      ? {}
      : {
          action: openDetails,
          ...(isDetailsOpen === undefined ? {} : { isDetailsOpen }),
        }),
  };
  return card?.layout === 'short' ? (
    <RecordCard layout="compactMediaAside" {...shared} />
  ) : (
    <RecordCard
      layout="picture"
      leadLine={
        showCategoryLabel ? ITEM_KIND_LABELS.get(record.kind) : undefined
      }
      {...shared}
    />
  );
}
