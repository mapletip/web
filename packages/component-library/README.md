# `@mapletip/component-library`

Shared React components for MapleTip browse and comparison pages.

## What's included

- `FacetedBrowser` — a complete browse surface: search, facets, filter rail, quick
  facets, mobile filter drawer, results, status and pagination.
- `useFacetedBrowser` — headless browse state and query handling for custom layouts.
- `Table` / `ComparisonTable` — table renderers for records your application prepares.
- `theme` — the shared Mantine theme.

Anything else under `src/components/` is an internal detail of the features above.

## Getting started

Add the stylesheet and render inside `MantineProvider`. Choose the color scheme before
first paint so the page does not flash the wrong theme:

```ts
import '@mapletip/component-library/styles.css';
```

The component library never owns navigation. For controlled browsing pass `state` and
`onStateChange`; for self-managed browsing pass `defaultState`. Supply `getPageHref` so
pagination renders real links, and keep entity names as ordinary `<a href>` links.

## Persistence

Table column widths are remembered per table shape in one stable bucket, derived from the
column accessors, `idAccessor` and identity column. Pass a namespaced `tableStorageKey`
(or `storeColumnsKey`) to scope widths to a domain, or when unrelated tables must not share
them. Column visibility is different: it lives in the canonical `hiddenColumns` state and is
never written to that bucket.

There is no persistence opt-out. DataTable 9.4.0 without a storage key falls back to a
shared empty-string bucket and can hide the table
([upstream #845](https://github.com/icflorescu/mantine-datatable/issues/845)), so this
library always supplies one.

## Known limitations

- DataTable 9.4.0 sortable headers expose `role="button"`, omit `aria-sort` and do not sort
  with Space; identity cells are `td`. These are accepted upstream limitations, not WCAG
  compliance.
- Sticky headers apply within the table's scroll area, not the browser window.
- A stale `-columns-toggle` entry in an existing width bucket can hide a column; delete the
  bucket to reset.
- Manual screen-reader, forced-colors and touch-device review is still required.

## Visual regression

Selected stories are compared against committed screenshots using the same browser test
runner as the rest of the library, so a change in layout, theme or responsive behaviour
fails the build.

```bash
pnpm --filter @mapletip/component-library test:visual
```

Tests live next to each component as `<name>.visual.test.tsx`, with their screenshots
beside them. Ordinary `pnpm test` skips them.

Screenshots only match when they are produced in the same environment CI uses. Baselines
are rendered in the pinned Playwright Linux image (`1.64.1`), which CI also uses.
References are written only by running the suite with `--update=all` inside that
authoritative container:

```bash
# from the repository root
podman run --rm --init --ipc=host \
  -e HOME=/tmp --userns=keep-id --security-opt label=disable \
  -v "$PWD:$PWD" -w "$PWD/packages/component-library" \
  mcr.microsoft.com/playwright:v1.64.1-resolute \
  ./node_modules/.bin/vitest run --project visual --update=all
```

Review every generated PNG before committing it with the change that explains it.
CI remains comparison-only and refuses baseline update flags.

## Development

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build-storybook
```

Tests and stories for each component live in its own `__tests__` and `__stories__`
folders; shared fixtures live in `src/fixtures` and shared visual-test support in
`src/test-support`.
