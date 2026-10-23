# web

pnpm + [Turborepo](https://turborepo.dev/) monorepo.

## Packages

- `@mapletip/component-library`: [Mantine](https://mantine.dev/)-based component library with [Storybook](https://storybook.js.org/)
- `@mapletip/ui`: stub React components from the Turborepo template
- `@mapletip/config`: shared eslint, prettier, tsconfig, lint-staged, vite and vitest configs

## Setup

Requires Node (see `.nvmrc`) and pnpm via corepack:

```sh
corepack enable pnpm
pnpm install
```

## Commands

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `pnpm storybook`       | Storybook dev server on http://localhost:6006 |
| `pnpm build-storybook` | Static Storybook build                        |
| `pnpm test`            | Config smoke tests + browser tests            |
| `pnpm lint`            | ESLint (type-checked)                         |
| `pnpm check-types`     | TypeScript                                    |
| `pnpm format`          | Prettier (`format:check` to verify)           |

## Tests

`pnpm test` runs the component library's browser tests (Vitest browser mode,
headless Chromium via Playwright):

- `unit`: `src/**/*.test.tsx` component tests using `vitest-browser-react`
- `storybook`: every story rendered as a test, including `play` interactions
  (`@storybook/addon-vitest`; also runnable from Storybook's test panel)

Install the browser once with
`pnpm --filter @mapletip/component-library exec playwright install --with-deps chromium`.

On hosts that can't run Chromium natively (e.g. Fedora CoreOS), run the
browser in the official Playwright container and point Vitest at it:

```sh
pnpm browser:up   # podman; prints the export line below
export PLAYWRIGHT_WS_ENDPOINT=ws://127.0.0.1:3333/
pnpm test
pnpm browser:down
```

CI runs the tests inside the `mcr.microsoft.com/playwright` image matching the
`playwright` pin in `pnpm-workspace.yaml`.
