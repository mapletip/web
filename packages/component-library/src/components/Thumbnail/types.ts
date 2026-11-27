export interface ThumbnailProps {
  /** Resolved image URL. Omit it when the record has no image. */
  readonly src?: string | undefined;
  /** Edge length of the square box in CSS pixels. */
  readonly size: number;
  /** Fixed scale factor for pixel art, preserving its natural size within the box. */
  readonly magnify?: number;
  /** Alternative text; defaults to empty because the record name is adjacent. */
  readonly alt?: string;
}
