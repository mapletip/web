# `@mapletip/web-app`

TanStack Start website foundation.

## Run

From the repository root or from this directory:

```sh
pnpm dev
```

The app starts at <http://localhost:3000>. Storybook remains separate:
`pnpm storybook` at <http://localhost:6006>.

## Routes

- `/` — Coming soon.
- `/demo/faceted-browser` — server-rendered FacetedBrowser demo with local mock
  records.

SSR check:

```sh
curl -s http://localhost:3000/demo/faceted-browser | grep -o 'Demo [A-Za-z]* [0-9]\{3\}'
```
