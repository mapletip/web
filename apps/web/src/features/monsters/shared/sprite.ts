import { monsterSpriteUrl } from '@mapletip/data/monsters';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

/** Return a sprite dimension only when it is a finite positive pixel value. */
export function positiveSpriteDimension(
  value: number | null | undefined,
): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

/** Resolve one Monster sprite through the same pinned release used by both pages. */
export function resolveMonsterSpriteUrl(
  contentId?: string,
  baseUrl: URL | string = MAPLEKIT_RELEASE.baseUrl,
): string | undefined {
  return contentId === undefined
    ? undefined
    : monsterSpriteUrl(baseUrl, contentId);
}
