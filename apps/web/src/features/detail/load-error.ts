/** Identify request cancellation so aborts propagate instead of masking as errors. */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * Replace an SDK or origin failure with a generic Error so raw URLs, HTTP
 * statuses, digests, and wire paths never cross the route serialization boundary.
 */
export function sanitizeLoadError(
  error: unknown,
  fallbackMessage: string,
): unknown {
  return isAbortError(error) ? error : new Error(fallbackMessage);
}
