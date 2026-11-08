import { Thumbnail } from '@mapletip/component-library';
import { monsterSpriteUrl } from '@mapletip/data/monsters';
import type { ReactElement } from 'react';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

export const MONSTER_SPRITE_SIZE = 40;

export function MonsterSprite({
  sprite,
}: {
  readonly sprite?: string | undefined;
}): ReactElement {
  const src =
    sprite === undefined
      ? undefined
      : monsterSpriteUrl(MAPLEKIT_RELEASE.baseUrl, sprite);

  return <Thumbnail src={src} size={MONSTER_SPRITE_SIZE} />;
}
