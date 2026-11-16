export interface SpriteStageProps {
  /** Resolved image URL. Omit it when the record has no sprite. */
  readonly src?: string | undefined;
  /** Accessible name for the sprite. */
  readonly name: string;
  /** Host wording shown in place of a missing or failed sprite. */
  readonly unavailableMessage: string;
  /**
   * Natural sprite width in pixels, when known. Together with `height` it
   * reserves the sprite's space before the image loads.
   */
  readonly width?: number | undefined;
  /** Natural sprite height in pixels, when known. */
  readonly height?: number | undefined;
}
