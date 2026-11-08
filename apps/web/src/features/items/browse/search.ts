export interface MatchSourceIdOptions {
  readonly sourceId: string;
  readonly query: string;
}

/** Matches digit-only IDs by numeric value, including leading zeroes. */
export function matchSourceId({
  sourceId,
  query,
}: MatchSourceIdOptions): boolean {
  const trimmedQuery = query.trim();
  if (!/^\d+$/.test(trimmedQuery) || !/^\d+$/.test(sourceId)) return false;
  return BigInt(sourceId) === BigInt(trimmedQuery);
}
