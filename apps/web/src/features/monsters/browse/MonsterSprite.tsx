import { Thumbnail } from '@mapletip/component-library';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import { resolveMonsterSpriteUrl } from '../shared';

export const MONSTER_SPRITE_SIZE = 40;

export function MonsterSprite({
  sprite,
}: {
  readonly sprite?: string | undefined;
}): ReactElement {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [failedSprite, setFailedSprite] = useState(false);
  const src = resolveMonsterSpriteUrl(sprite);

  useEffect(() => {
    const image = containerRef.current?.querySelector('img');
    if (image?.complete && image.naturalWidth === 0) setFailedSprite(true);
  }, [src]);

  return (
    <span ref={containerRef} style={{ display: 'contents' }}>
      <Thumbnail
        src={failedSprite ? undefined : src}
        size={MONSTER_SPRITE_SIZE}
      />
    </span>
  );
}
