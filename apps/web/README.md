# `@mapletip/web`

The MapleTip website foundation: a minimal TanStack Start application with
server rendering, the shared Maple Twilight theme, and a real public
`FacetedBrowser` demonstration.

## Run

From the repository root:

```sh
pnpm install
pnpm dev
```

From this directory:

```sh
pnpm dev
```

Both start the TanStack Start/Vite development server at
<http://localhost:3000>. Storybook is separate; start it from the repository
root with `pnpm storybook` (http://localhost:6006).

## Routes

- `/` — minimal server-rendered homepage linking to the demo.
- `/demo/faceted-browser` — the public FacetedBrowser with deterministic,
  synthetic app-local records (search, facets, sorting, pagination, desktop
  table, mobile cards and the filter drawer). It does not fetch data.

## Manual SSR check

The important invariant is that the first HTML document already contains the
demo records and controls. With the dev server running:

```sh
curl -s http://localhost:3000/ | grep -o 'server-rendered reference foundation'
curl -s http://localhost:3000/demo/faceted-browser | grep -o 'Demo [A-Za-z]* [0-9]\{3\}' | head
curl -s http://localhost:3000/demo/faceted-browser | grep -o 'Search demo records'
```

`curl` never executes JavaScript, so matches come from the server response.
Loading the same routes in a browser with JavaScript enabled should hydrate
without console errors or a layout replacement; search, facets, sort, page
changes and the mobile filter drawer should then work.

Check desktop, 375px and 320px widths. Maple Twilight is dark-only, so there is
no theme toggle and no light-mode flash.
