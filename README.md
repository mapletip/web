# web

pnpm + [Turborepo](https://turborepo.dev/) monorepo.

## Packages

- `@mapletip/component-library`: [Mantine](https://mantine.dev/)-based component library with [Storybook](https://storybook.js.org/)
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
| `pnpm test:visual`     | Storybook visual regression (see below)       |
| `pnpm lint`            | ESLint (type-checked)                         |
| `pnpm typecheck`       | TypeScript                                    |
| `pnpm format`          | Prettier via turbo (`format:check` to verify) |

## Tests

`pnpm test` runs the component library's browser tests (Vitest browser mode,
headless Chromium via Playwright):

- `unit`: `src/**/*.test.tsx` component tests using `vitest-browser-react`
- `storybook`: every story rendered as a test, including `play` interactions
  (`@storybook/addon-vitest`; also runnable from Storybook's test panel)

Install the browser once with
`pnpm --filter @mapletip/component-library exec playwright install --with-deps chromium`.

To use a remote browser instead (e.g. on hosts that can't run Chromium
natively), set `PLAYWRIGHT_WS_ENDPOINT` to a Playwright server's WebSocket URL.

CI runs the tests inside the `mcr.microsoft.com/playwright` image matching the
`playwright` pin in `pnpm-workspace.yaml`.

## Visual regression

Selected Storybook stories are also compared pixel-by-pixel against PNG baselines
committed in ordinary Git. The suite is deliberately separate from `pnpm test` and
never replaces the interaction, accessibility or SSR checks:

```sh
pnpm build-storybook
pnpm --filter @mapletip/component-library test:visual:container  # matches CI
pnpm --filter @mapletip/component-library test:visual:update     # regenerate baselines
```

Baselines are rendered only in the pinned Playwright Linux container; CI compares
against those committed images, never updates them, and uploads the Playwright
report plus expected/actual/diff images when the job fails. See
[`packages/component-library/README.md`](packages/component-library/README.md#visual-regression)
for the coverage matrix, comparison thresholds and the review procedure.
