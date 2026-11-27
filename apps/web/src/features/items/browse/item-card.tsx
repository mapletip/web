import { RecordCard, Thumbnail } from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';
import type { ReactElement } from 'react';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { ITEM_KINDS } from '../kinds';
import type { ItemCardContext, ItemKind } from '../kinds/types';

import type { CategorizedItemRow } from './project';

const PICTURE_CARD_COLUMNS = { base: 2, md: 4, lg: 5 } as const;
// Short and identity cards put text beside the picture, so they need wider columns.
const ASIDE_CARD_COLUMNS = { base: 1, sm: 2, lg: 3 } as const;

/** Picture cards show the icon across the top; every other layout puts it beside the name. */
export function isPictureLayout(kind: ItemKind | undefined): boolean {
  return (kind?.card?.layout ?? 'picture') === 'picture';
}

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
  if (kind?.card?.columns !== undefined) return kind.card.columns;
  return isPictureLayout(kind) ? PICTURE_CARD_COLUMNS : ASIDE_CARD_COLUMNS;
}
export const ITEM_KIND_LABELS: ReadonlyMap<string, string> = new Map(
  ITEM_KINDS.map((entry) => [entry.id, entry.label]),
);

export interface RenderItemCardOptions {
  readonly record: CategorizedItemRow;
  readonly openDetails?: (() => void) | undefined;
  readonly isDetailsOpen?: boolean | undefined;
  readonly secondaryLine?: string | undefined;
  /** Cross-category results: a plain picture card labelled with the item's category. */
  readonly crossCategory?: boolean | undefined;
  readonly context?: ItemCardContext | undefined;
  readonly openItemDetails?: ((sourceId: string) => void) | undefined;
}

// 32px item icons, magnified to fill each layout's media slot (52-56px beside the name).
const PICTURE_THUMBNAIL = { size: 80, magnify: 2 } as const;
const ASIDE_THUMBNAIL = { size: 48, magnify: 1.5 } as const;

/** Shared item card renderer used by category pages, cross-category results, and group shelves. */
export function renderItemCard({
  record,
  openDetails,
  isDetailsOpen,
  secondaryLine,
  crossCategory = false,
  context = { coverage: undefined, relations: {} },
  openItemDetails,
}: RenderItemCardOptions): ReactElement {
  const kind: ItemKind | undefined = ITEM_KINDS.find(
    (entry) => entry.id === record.kind,
  );
  // Category cards only on their own category page and shelf.
  const card = crossCategory ? undefined : kind?.card;
  const layout = card?.layout ?? 'picture';
  const fact = secondaryLine ?? card?.lead(record, context);
  const footer = card?.footer?.(record, context);
  const media = card?.media?.(record, context) ?? (
    <Thumbnail
      src={
        record.icon === undefined
          ? undefined
          : itemIconUrl(MAPLEKIT_RELEASE.baseUrl, record.icon)
      }
      {...(layout === 'picture' ? PICTURE_THUMBNAIL : ASIDE_THUMBNAIL)}
    />
  );
  const shared = {
    title: record.name,
    media,
    ...(openDetails === undefined
      ? {}
      : {
          action: openDetails,
          ...(isDetailsOpen === undefined ? {} : { isDetailsOpen }),
        }),
  };
  if (layout === 'identity') {
    const facts = card?.facts?.(record, {
      ...context,
      ...(openItemDetails ? { openItemDetails } : {}),
    });
    return (
      <RecordCard
        layout="identity"
        {...(fact === undefined ? {} : { leadLine: fact })}
        {...(facts === undefined ? {} : { facts })}
        {...shared}
      />
    );
  }
  return layout === 'short' ? (
    <RecordCard
      layout="compactMediaAside"
      {...(fact === undefined ? {} : { secondaryLine: fact })}
      {...(card?.secondaryLineClamp === undefined
        ? {}
        : { secondaryLineClamp: card.secondaryLineClamp })}
      {...(footer === undefined ? {} : { footer })}
      {...shared}
    />
  ) : (
    <RecordCard
      layout="picture"
      leadLine={crossCategory ? ITEM_KIND_LABELS.get(record.kind) : undefined}
      {...(fact === undefined ? {} : { secondaryLine: fact })}
      {...shared}
    />
  );
}
