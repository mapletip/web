/** Converts a rem or unitless radius token to pixels for the docs tables. */
export function toPixels(value: string | number): string {
  const text = String(value);
  const number = Number.parseFloat(text);

  return `${text.endsWith('rem') ? number * 16 : number}px`;
}
