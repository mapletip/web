export const MINIMAP_SCALE_ESTIMATE = 1 / 16;

/**
 * Estimate a game-pixel sprite size in minimap pixels.
 *
 * This estimate stands in for a per-map minimap scale that MapleKit does not
 * expose yet; replace it with the real value when it does.
 */
export function minimapSpriteSize({
  width,
  height,
}: {
  readonly width: number;
  readonly height: number;
}): { readonly width: number; readonly height: number } {
  return {
    width: width * MINIMAP_SCALE_ESTIMATE,
    height: height * MINIMAP_SCALE_ESTIMATE,
  };
}
