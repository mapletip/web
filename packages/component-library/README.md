# `@mapletip/component-library`

Shared React components for MapleTip browse and comparison pages.

## Public API

- `FacetedBrowser` — integrated browse surface: search, facets, contextual counts,
  rail, quick facets, drawer, results, status and pagination.
- `useFacetedBrowser` — headless TanStack v9 query state for custom presentations.
- `Table` / `ComparisonTable` — typed Mantine DataTable renderers over host-processed
  records.
- `theme` — the shared Mantine theme.

Other components under `src/components/` are feature internals.

## Host setup

Import the stylesheet and render inside `MantineProvider`:

```ts
import '@mapletip/component-library/styles.css';
```

Set Mantine’s color-scheme attribute before first paint (`ColorSchemeScript` or
`mantineHtmlProps`).

Keep URLs host-owned: pass `state` + `onStateChange` for controlled browsing, or
`defaultState` for self-managed browsing. Provide `getPageHref(page, nextState)` to render
real pagination links. Entity cells must contain ordinary `<a href>` links.

## Persistence

DataTable widths use one stable, nonempty bucket per table shape:

- Omit `tableStorageKey` / `storeColumnsKey` to derive it from the column accessors,
  `idAccessor` and identity column.
- Pass a namespaced string to scope widths to a domain or build.
- Visibility stays in canonical `hiddenColumns`; it is never persisted by DataTable.

There is no persistence opt-out. DataTable 9.4.0 without `storeColumnsKey` reads the
shared empty-string localStorage bucket and can hide the table
([upstream #845](https://github.com/icflorescu/mantine-datatable/issues/845)); the library
therefore always supplies a key. Identical table shapes share a derived bucket; pass an
explicit key when unrelated surfaces must not share widths.

## Known limitations

- mantine-datatable 9.4.0 sortable headers expose `role="button"`, omit `aria-sort`, and
  do not sort with Space; identity cells are `td`. These are accepted upstream
  limitations, not WCAG compliance.
- Sticky headers are local to DataTable’s bounded scroll area, not the browser window.
- A stale `-columns-toggle` entry in an existing bucket can hide a column; delete the
  bucket to reset. Normal use never writes one.
- Manual screen-reader, forced-colors and touch-device review remains required.

## Visual regression

Playwright Test compares a curated set of Storybook stories against approved PNG
baselines committed in ordinary Git (`visual/__screenshots__/`). It complements — and
never replaces — the Vitest unit/SSR/Storybook interaction and accessibility checks.

| Case group                               | Coverage                                        |
| ---------------------------------------- | ----------------------------------------------- |
| `faceted-browser-desktop-*`              | Table + rail at 1366px, light and dark          |
| `faceted-browser-mobile-cards-*`         | Card list at 375px, light and dark              |
| `faceted-browser-filter-drawer-*`        | Open filter drawer at 500px, light and dark     |
| `faceted-browser-empty-light`            | Empty state                                     |
| `faceted-browser-loading-light`          | Loading state                                   |
| `faceted-browser-breakpoint-991/992`     | Both sides of the 992px `md` switch             |
| `table-populated-light/dark`             | Populated table incl. null/negative/long values |
| `comparison-table-desktop-light`         | Comparison table                                |
| `comparison-table-mobile-overflow-light` | Horizontal overflow at phone width              |

`visual/storybook.visual.spec.ts` is the single source of truth for the matrix; each
case also asserts the expected layout (for example that the table is hidden below
992px), so a breakpoint regression fails semantically as well as visually.

### Commands

```bash
# from the repository root
pnpm build-storybook                    # the suite serves storybook-static
pnpm --filter @mapletip/component-library test:visual            # raw run
pnpm --filter @mapletip/component-library test:visual:container  # authoritative run
pnpm --filter @mapletip/component-library test:visual:update     # regenerate baselines
```

`test:visual` runs the Playwright CLI directly and is what CI executes inside the
pinned container. On any other host it may report rendering differences (font
hinting and system libraries change pixel output — a Linux development host
differs from the container by a few percent of pixels), so use
`test:visual:container` to reproduce CI locally.

### Reference environment

Approved baselines are rendered only in the official Playwright image
`mcr.microsoft.com/playwright:v<playwright pin>-resolute`, which CI also uses. The
pin lives in the `playwright` catalog entry of `pnpm-workspace.yaml`.

- `test:visual:container` and `test:visual:update` start that image with docker or
  podman (set `CONTAINER_ENGINE` to override detection), mount the repository at
  its own path and run the suite there. On macOS or Windows the same image is the
  only way to produce comparable output; there is no native-host shortcut.
- Baselines carry a `-linux.png` suffix. Playwright's default snapshot template is
  extended with `{platform}` for exactly this reason: a run on macOS or Windows
  looks for `*-darwin.png` / `*-win32.png` and fails with a missing baseline rather
  than silently inventing a reference. Those host files are git-ignored so they
  cannot be committed by accident.
- Regenerate only through `test:visual:update`. It passes an explicit
  `--update-snapshots=all`; every other run uses `updateSnapshots: 'none'`, so no
  ordinary run (including CI) can create or accept a baseline.

### Comparison behaviour

The suite uses upstream Playwright defaults and adds no masks or relaxed
tolerances: a per-pixel colour threshold of `0.2` (YIQ) with no diff-pixel
allowance, so any visibly different pixel fails. Capture is otherwise pinned to a
fixed viewport, device scale factor `1`, light/dark via Storybook globals,
`locale: en-US`, `timezoneId: UTC`, `reducedMotion: reduce`, disabled animations,
hidden carets and hidden scrollbar chrome (`visual/screenshot.css`). Storybook
theme globals are honoured; a renamed or removed story fails with the case name
and a message naming the missing story id.

The HTML report and expected/actual/diff images are written to `visual-report/`
and `visual-results/` (both git-ignored). CI uploads them only when the job fails
and keeps them for 5 days.

### Changing visuals intentionally

1. Change the component or story.
2. Run `pnpm build-storybook` and `test:visual:update` (pinned container).
3. Review every changed PNG in the diff, not just the pass/fail result.
4. Commit the source change and the updated baselines together and explain the
   intended visual change in the pull request.

A green CI run only proves the pixels match the committed baselines; it does not
prove the new pixels are correct. Baseline review is a human responsibility, and
CI never updates or approves a baseline.

## Development

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build-storybook
pnpm --filter @mapletip/component-library test:visual:container
```

Tests live in `src/components/<Component>/__tests__`; stories in
`src/components/<Component>/__stories__`; package-level export, fixture and
neutrality contracts in `src/__tests__/`; shared neutral fixtures in `src/fixtures/`.
`FacetedBrowser` internals are grouped under its feature directory, including
`hooks/`, `FacetControls/`, and the layout/status/toolbar/pagination modules.

Visual regression tests and approved baselines live in `visual/`; see
[Visual regression](#visual-regression).
