import { itemIconUrl } from '@mapletip/data/items';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

export const UNNAMED_ITEM_LABEL = 'Item name unavailable';

export interface ItemRecordChipView {
  readonly name: string;
  readonly iconUrl?: string;
}

/** Keep item identity fallbacks and MapleKit icon URL construction together. */
export function projectItemRecordChip({
  name,
  iconContentId,
}: {
  readonly name?: string;
  readonly iconContentId?: string;
}): ItemRecordChipView {
  return {
    name: name ?? UNNAMED_ITEM_LABEL,
    ...(iconContentId === undefined
      ? {}
      : { iconUrl: itemIconUrl(MAPLEKIT_RELEASE.baseUrl, iconContentId) }),
  };
}
