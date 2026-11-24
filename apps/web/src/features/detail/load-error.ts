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

export interface LoadBoundaryOptions<T> {
  /** The SDK read and its projection. */
  readonly load: () => Promise<T>;
  /** Player-safe message of the error that replaces any failure. */
  readonly failureMessage: string;
  /** Server log line written with the original failure. */
  readonly logMessage: string;
}

/**
 * Run a route loader's read behind the load boundary: aborts propagate as
 * aborts, other failures are logged on the server and replaced by a generic
 * error, so SDK diagnostics never reach the client.
 */
export async function withLoadBoundary<T>({
  load,
  failureMessage,
  logMessage,
}: LoadBoundaryOptions<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (isAbortError(error)) throw error;
    if (import.meta.env.SSR) {
      console.error(logMessage, error);
    }
    throw sanitizeLoadError(error, failureMessage);
  }
}
