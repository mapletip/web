# `@mapletip/component-library`

Shared React components for MapleTip browse and comparison pages.

## What's included

- `Header` — a generic, host-configured global header with desktop navigation,
  one-level groups and a mobile drawer.
- `FacetedBrowser` — a complete browse surface: search, facets, filter rail, quick
  facets, mobile filter drawer, results, status and pagination.
- `useFacetedBrowser` — headless browse state and query handling for custom layouts.
- `Table` / `ComparisonTable` — table renderers for records your application prepares.

Anything else under `src/components/` is an internal detail of the features above. The
shared Mantine theme is owned by `@mapletip/theme`, not by this package.

## Getting started

The visual identity is owned by `@mapletip/theme`. Add the stylesheet and pass the
shared theme and resolver to `MantineProvider`:

```ts
import '@mapletip/component-library/styles.css';
import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';

<MantineProvider
  theme={theme}
  cssVariablesResolver={cssVariablesResolver}
  defaultColorScheme="dark"
  forceColorScheme="dark"
>
  <App />
</MantineProvider>;
```

`styles.css` is the only required entry: it composes Mantine's layered stylesheet, the
theme and MapleTip's own treatments, and declares the cascade-layer order. Table styles are
not part of it — they load with `Table`, so a route that renders no table ships none of
them.

MapleTip is dark-only; hosts should set `forceColorScheme="dark"` so first paint,
server rendering and hydrated UI stay on the Maple Twilight scheme. See
[`@mapletip/theme`](../theme/README.md) for the host setup.

The component library never owns application navigation content. For controlled browsing
pass `state` and `onStateChange`; for self-managed browsing pass `defaultState`. Supply `getPageHref` so
pagination renders real links, and keep entity names as ordinary `<a href>` links.

## Header integration

`Header` is also content-free: the host supplies the brand element, destinations, active and
current state, and optional utility content. Ordinary anchors are the default. A TanStack
Router host can pass `renderLink` and forward the supplied presentation props to its `Link`.
Split the built `href` so search, hash and preloading stay with the router:

```tsx
<Header
  brand={<Link to="/">Reference Atlas</Link>}
  navigation={navigation}
  utility={<BuildSelector />}
  renderLink={(link, props) => {
    const { href, ...anchorProps } = props;
    const url = new URL(href, 'https://example.invalid');
    return (
      <Link
        to={url.pathname}
        search={Object.fromEntries(url.searchParams)}
        hash={url.hash.slice(1)}
        {...anchorProps}
      >
        {link.label}
      </Link>
    );
  }}
/>
```

Route-specific search parsing stays with the host; `href` contains the already-built
destination, including path parameters.

Grouped items keep the parent destination as a link and use a separate disclosure button.
The optional utility node is mounted only once: in the desktop header, or in the mobile drawer
while it is open. It may remount when moving between those locations, so persistent state
belongs to the host.

Server-rendered desktop navigation is ordinary anchor markup. The compact/mobile drawer is a
client-side Mantine disclosure, so opening it requires hydration; Header itself fetches no
data and does not depend on the router at runtime.

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
- DataTable has no whole-column hover. `ComparisonTable` adds a translucent full-height
  column emphasis for comparison, layered over DataTable's native row hover; both remain
  active. A `:has()` implementation was evaluated but needs one positional rule per
  column index, so the index-agnostic overlay is retained.
- A stale `-columns-toggle` entry in an existing width bucket can hide a column; delete the
  bucket to reset.
- Manual screen-reader, forced-colors and touch-device review is still required.

## Visual regression

Selected stories are compared against committed screenshots in the dark scheme, using the
same browser test runner as the rest of the library, so a change in layout, theme or
responsive behaviour fails the build.

```bash
pnpm --filter @mapletip/component-library test:visual
```

Tests live next to each component as `<name>.visual.test.tsx`, with their screenshots
beside them. Ordinary `pnpm test` skips them.

Screenshots only match when they are produced in the same environment CI uses, so regenerate
them there rather than on a development machine, review every changed image, and commit it
with the change that explains it. CI only compares the committed images and never writes them.

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
