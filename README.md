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
| `pnpm test:visual`     | Storybook visual regression (opt-in)          |
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

Selected stories are compared against committed PNG baselines with Vitest's native
`toMatchScreenshot()`. The suite is opt-in (`pnpm test` excludes it) and runs in the
same pinned Playwright Linux image as CI. See
[`packages/component-library/README.md`](packages/component-library/README.md#visual-regression)
for the commands, the baseline-regeneration container invocation and the review
procedure.
