# `@mapletip/web`

TanStack Start website foundation.

## Run

From the repository root or from this directory:

```sh
pnpm dev
```

The app starts at <http://localhost:3000>. Storybook remains separate:
`pnpm storybook` at <http://localhost:6006>.

## Web integration tests

Playwright tests use synthetic MSW data. Run the suites with:

```sh
pnpm turbo run test:e2e
pnpm turbo run test:e2e:visual
```
