/** Match numeric item IDs exactly while allowing leading-zero differences. */

export function matchSourceId(sourceId: string, query: string): boolean {
  const trimmedQuery = query.trim();
  if (!/^\d+$/.test(trimmedQuery) || !/^\d+$/.test(sourceId)) {
    return false;
  }
  return Number.parseInt(trimmedQuery, 10) === Number.parseInt(sourceId, 10);
}
