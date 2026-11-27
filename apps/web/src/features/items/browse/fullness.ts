import { numberFormat } from './number-format';

export function formatFullness({
  fullness,
}: {
  readonly fullness: number | undefined;
}): string | undefined {
  return fullness === undefined
    ? undefined
    : `Restores ${numberFormat.format(fullness)} fullness`;
}
