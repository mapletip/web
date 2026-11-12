# `@mapletip/web`

TanStack Start website foundation.

## Run

From the repository root or from this directory:

```sh
pnpm dev
```

The app starts at <http://localhost:3000>. Storybook remains separate:
`pnpm storybook` at <http://localhost:6006>.

## Invented fixture mode

Run the app with a synthetic Monster release by setting `API_MODE=msw`:

```sh
API_MODE=msw pnpm dev
```

The fixture names, records, items and flat SVG sprites are invented for web
integration testing. They are test-support data and are not MapleStory content.
In a regular browser, thumbnails from server-rendered rows use the fallback
because those image requests start before the browser service worker is active.
The built mock server uses `apps/web/.output-msw` so it stays separate from the
production `.output`:

```sh
pnpm --filter @mapletip/web build:msw
HOST=127.0.0.1 PORT=4173 node apps/web/.output-msw/server/index.mjs
```

## Web integration tests

The functional Playwright suite starts the mock-mode build and runs in Chromium
at desktop and mobile sizes:

```sh
pnpm turbo run test:e2e
```

Page-level visual comparisons run separately:

```sh
pnpm turbo run test:e2e:visual
```

Visual baselines must be generated and reviewed in the same official Playwright
container used by CI, matching the `playwright` catalog version. Use a throwaway
working tree for updates so the resulting images can be inspected before copying
them back:

```sh
podman run --rm -it --network host \
  -v "$PWD:/workspace:Z" -w /workspace \
  mcr.microsoft.com/playwright:v1.64.1-resolute bash
pnpm install --frozen-lockfile
pnpm --filter @mapletip/web build:msw
pnpm --filter @mapletip/web exec playwright test --project=visual --update-snapshots
```

CI only compares committed images; it never creates or updates baselines.
