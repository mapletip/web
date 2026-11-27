import { numberFormat } from './number-format';

export function formatSellPrice({
  sellPrice,
}: {
  readonly sellPrice: number | undefined;
}): string | undefined {
  return sellPrice === undefined
    ? undefined
    : `Sells for ${numberFormat.format(sellPrice)} ${sellPrice === 1 ? 'meso' : 'mesos'}`;
}
