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

/** Return an invented flat SVG for a fixture content id, or a 404 case. */
export function spriteResponse(contentId: string): SpriteResponse {
  const spriteCase = fixtureRelease.spriteIds.get(contentId) as
    SpriteCase | undefined;
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
