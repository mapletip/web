import { ITEM_KINDS } from '../features/items/kinds';

import { fixtureRelease } from './release';
import { spriteDimensions, type SpriteCase } from './world';

export interface SpriteResponse {
  readonly status: number;
  readonly body: string;
  readonly contentType: string;
}

const spriteFills: Readonly<Record<SpriteCase, string>> = {
  exact: '#627b73',
  small: '#bd845c',
  large: '#6574a5',
  wide: '#a96975',
  tall: '#7d6957',
  missing: '#758b55',
};

const fixedItemIconIds = new Set(
  ITEM_KINDS.flatMap((kind) =>
    'iconContentId' in kind ? kind.iconContentId : [],
  ),
);

/** Return an invented flat SVG for a fixture content id, or a 404 case. */
export function spriteResponse(contentId: string): SpriteResponse {
  if (fixtureRelease.minimapIds.has(contentId)) {
    return {
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="96" viewBox="0 0 160 96"><rect width="160" height="96" rx="6" fill="#253b3b"/><path d="M14 75 42 55l22 8 25-34 22 10 35-22" fill="none" stroke="#8cae9a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="42" cy="55" r="5" fill="#dfb86a"/></svg>',
    };
  }
  if (fixtureRelease.markIds.has(contentId)) {
    return {
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38"><circle cx="19" cy="19" r="17" fill="#c77724"/><path d="M11 24 19 10l8 14z" fill="#f2eee4"/></svg>',
    };
  }
  const spriteCase =
    (fixtureRelease.spriteIds.get(contentId) as SpriteCase | undefined) ??
    (fixedItemIconIds.has(contentId) ? 'exact' : undefined);
  if (spriteCase === undefined || spriteCase === 'missing') {
    return { status: 404, body: '', contentType: 'image/svg+xml' };
  }

  const [width, height] = spriteDimensions[spriteCase];
  const fill = spriteFills[spriteCase];
  return {
    status: 200,
    contentType: 'image/svg+xml',
    body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" rx="${Math.min(width, height) / 8}" fill="${fill}"/><circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 4}" fill="#f2eee4"/></svg>`,
  };
}
