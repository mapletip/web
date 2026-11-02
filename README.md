# web

pnpm + [Turborepo](https://turborepo.dev/) monorepo.

## Packages

- `@mapletip/web`: TanStack Start website foundation in `apps/web`
- `@mapletip/theme`: the shared Maple Twilight Mantine theme
- `@mapletip/component-library`: [Mantine](https://mantine.dev/)-based component library with [Storybook](https://storybook.js.org/)
- `@mapletip/config`: shared eslint, prettier, tsconfig, lint-staged, vite and vitest configs

## Setup

Requires Node (see `.nvmrc`) and pnpm via corepack:

```sh
corepack enable pnpm
pnpm install
```

## Commands

| Command                | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `pnpm dev`             | TanStack Start website on http://localhost:3000 |
| `pnpm storybook`       | Storybook dev server on http://localhost:6006   |
| `pnpm build-storybook` | Static Storybook build                          |
| `pnpm test`            | Runs each package's tests                       |
| `pnpm test:visual`     | Storybook visual regression (opt-in)            |
| `pnpm lint`            | ESLint (type-checked)                           |
| `pnpm typecheck`       | TypeScript                                      |
| `pnpm format`          | Prettier via turbo (`format:check` to verify)   |

## Website foundation

`pnpm dev` starts only `apps/web` (TanStack Start, SSR) at
<http://localhost:3000>. Running `pnpm dev` from `apps/web` starts the same
server. The current routes are `/` and `/demo/faceted-browser`.

The demo document is server-rendered, so the FacetedBrowser rows, labels and
controls are present before JavaScript runs. Inspect the initial document with:

```sh
curl -s http://localhost:3000/demo/faceted-browser | grep -o 'Demo [A-Za-z]* [0-9]\{3\}' | head
```

Storybook remains independent: `pnpm storybook` is the only command that starts
Storybook. See [`apps/web/README.md`](apps/web/README.md) for local acceptance
details.

## Tests

`pnpm test` runs each package's tests (Vitest, browser mode where a DOM is needed):

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
