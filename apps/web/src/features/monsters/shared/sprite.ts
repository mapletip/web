import { monsterSpriteUrl } from '@mapletip/data/monsters';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

/** Resolve one Monster sprite through the same pinned release used by both pages. */
export function resolveMonsterSpriteUrl(
  contentId?: string | undefined,
  baseUrl: URL | string = MAPLEKIT_RELEASE.baseUrl,
): string | undefined {
  return contentId === undefined
    ? undefined
    : monsterSpriteUrl(baseUrl, contentId);
}
