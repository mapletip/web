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

## Development

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build-storybook
```

Tests live in `src/components/<Component>/__tests__`; stories in
`src/components/<Component>/__stories__`; package-level export, fixture and
neutrality contracts in `src/__tests__/`; shared neutral fixtures in `src/fixtures/`.
`FacetedBrowser` internals are grouped under its feature directory, including
`hooks/`, `FacetControls/`, and the layout/status/toolbar/pagination modules.
