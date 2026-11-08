export interface ThumbnailProps {
  /** Resolved image URL. Omit it when the record has no image. */
  readonly src?: string | undefined;
  /** Edge length of the square box in CSS pixels. */
  readonly size: number;
  /** Alternative text; defaults to empty because the record name is adjacent. */
  readonly alt?: string;
}
