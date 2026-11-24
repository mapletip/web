/**
 * A game-pixel sprite size in stage pixels: MapleKit publishes each stage's
 * scale as stage pixels per game pixel, so a 64 px sprite on a stage of scale
 * 0.0625 is 4 stage pixels wide.
 */
export function minimapSpriteSize({
  width,
  height,
  scale,
}: {
  readonly width: number;
  readonly height: number;
  readonly scale: number;
}): { readonly width: number; readonly height: number } {
  return { width: width * scale, height: height * scale };
}
