const numberFormat = new Intl.NumberFormat('en-US');

export function formatFullness({
  fullness,
}: {
  readonly fullness: number | undefined;
}): string | undefined {
  return fullness === undefined
    ? undefined
    : `Restores ${numberFormat.format(fullness)} fullness`;
}
