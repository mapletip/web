/** A `fetch` that serves a fixture release's files, for SDK reads in tests. */
export function fileFetch(
  files: ReadonlyMap<string, Uint8Array>,
): typeof fetch {
  return (input) => {
    const url = input instanceof Request ? input.url : String(input);
    const path = new URL(url).pathname.slice(1);
    const bytes = files.get(path);
    return Promise.resolve(
      bytes === undefined
        ? new Response(null, { status: 404 })
        : new Response(new Uint8Array(bytes).buffer, {
            headers: { 'content-type': 'application/json' },
          }),
    );
  };
}
