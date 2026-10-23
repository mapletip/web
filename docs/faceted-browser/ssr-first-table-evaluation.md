# SSR-first table evaluation — evidence and decision record

**Question:** which table gives MapleTip the simplest maintainable,
SEO-friendly browsing experience without significant bespoke implementation?

**Decision (proposed): first-party Mantine `Table` alone, without TanStack
Table.** AG Grid Community stays the interaction-quality reference but is no
longer the recommended production table. See [§7](#7-decision) and the revised
[architecture plan](./README.md).

Labels: **[verified]** (source, types, package metadata), **[measured]**
(browser or Node tests, production-build probes), **[judgment]**,
**[unverified]**.

Companion documents: [AG Grid spike report](./ag-grid-spike.md),
[legacy research](./legacy-research.md).

---

## 1. What was built

All code is isolated under `packages/component-library/src/spikes/` and is not
exported. TanStack Table, Mantine DataTable and AG Grid are `devDependencies`.

| Path                                       | Purpose                                                                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `semantic-table/MonsterTanStackTable.tsx`  | Mantine `Table` elements + TanStack Table v9 (`useTable`, sorting _state_ and column visibility only)                                                                                                        |
| `semantic-table/MonsterMantineTable.tsx`   | Same markup and behaviour with a plain column array and no table engine                                                                                                                                      |
| `semantic-table/MonsterDataTable.tsx`      | Minimal Mantine DataTable, only to settle SSR/accessibility questions                                                                                                                                        |
| `semantic-table/MonsterTable.module.css`   | Shared styles: density, pinned identity, sorted tint, row focus ring, CSS-only column highlight, forced-colors rules                                                                                         |
| `semantic-table/{cells,columns,types}`     | Engine-neutral domain cells and column metadata (same 100 records, 11 columns, long name, unknown vs zero, missing sprites as the AG Grid spike)                                                             |
| `semantic-table/MonsterTables.stories.tsx` | Stories: `TanStackMantine` (+ dark, short), `MantineTableOnly`, `DataTableMinimal`, using the same page harness (sticky app header, 240 px rail, column menu, URL state, Mantine `Pagination` as `<a href>`) |
| `semantic-table/serverRender.ssr.test.tsx` | **Plain-Node** server render of all four candidates                                                                                                                                                          |
| `semantic-table/semanticTable.test.tsx`    | 21 browser tests × 2 candidates (TanStack+Mantine, Mantine alone)                                                                                                                                            |
| `semantic-table/dataTable.test.tsx`        | 7 characterisation tests of DataTable                                                                                                                                                                        |
| `semantic-table/hydration.test.tsx`        | `renderToString` → `hydrateRoot` for all candidates, errors and layout delta                                                                                                                                 |
| `semantic-table/performance.test.tsx`      | Identical-conditions timing and DOM size for all four candidates                                                                                                                                             |
| `semantic-table/forcedColors.test.tsx`     | Chromium forced-colors emulation                                                                                                                                                                             |

Supporting changes:

- `vitest.config.ts`:
  - a third `ssr` project (`environment: 'node'`, `extends: false`) that runs
    `*.ssr.test.tsx` with no DOM;
  - a one-function `emulateMedia` browser command (forced colors);
  - `optimizeDeps.include` for the spike dependencies, because without it a
    cold cache intermittently failed with a duplicate-React error after Vite
    re-optimised mid-run.
- `package.json` / `pnpm-workspace.yaml`: `@tanstack/react-table`,
  `mantine-datatable`, `clsx` (DataTable peer) as catalog dev dependencies.
- **AG Grid spike fix:** `api.refreshCells` needs `RenderApiModule`, which was
  never registered, so every header sort logged AG error #200. The call was
  redundant (regenerated column definitions already re-evaluate the class
  rule) and was removed.

## 2. Verified library facts

| Fact                                                                                                                                                                                                                                   | Status               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `@tanstack/react-table` **9.3.1** is `latest` on npm; `alpha` and `beta` are separate dist-tags, so v9 is the stable line. MIT; peer `react >=18`; depends on `@tanstack/react-store` and `@tanstack/table-core`. Modified 2026-10-12. | [verified]           |
| v9 API: `tableFeatures({...})` registers features and row-model factories; `useTable({ features, columns, data, state, manualSorting, ... })`; `table.FlexRender`; `createColumnHelper<features, Row>()`. `sideEffects: false`.        | [verified]           |
| `useTable` subscribes through `@tanstack/react-store`'s `useSelector` and uses an isomorphic layout effect; it renders on the server (confirmed by the Node test).                                                                     | [verified, measured] |
| `mantine-datatable` **9.4.0**, MIT, peers `react >=19`, `@mantine/core >=9`, `clsx >=2`; modified 2026-07-15.                                                                                                                          | [verified]           |
| Mantine core **9.7.3**: `Table` has `stickyHeader`, `highlightOnHover`, `tabularNums`, `layout`, `Table.ScrollContainer` (`maxHeight`, `type`), `Table.Caption`; `Pagination` supports `getItemProps`/`getControlProps`.               | [verified]           |
| DataTable source: header cell sets `role="button"` with `tabIndex=0`; there is no `aria-sort` and no `scope` anywhere in the 9.4.0 bundle.                                                                                             | [verified, measured] |

## 3. Server-rendered HTML (the primary criterion)

Method: `renderToString` in plain Node (vitest `ssr` project; `window` and
`document` are asserted `undefined`), 100 records sorted by EXP descending,
caption "Monsters, sorted by EXP descending".

| Check                                                |   TanStack + Mantine | Mantine alone |         Mantine DataTable | AG Grid Community |
| ---------------------------------------------------- | -------------------: | ------------: | ------------------------: | ----------------: |
| Record names in HTML (of 100)                        |                  100 |           100 |                       100 |             **0** |
| Entity links with real `href` (of 100)               |                  100 |           100 |                       100 |             **0** |
| Records in expected sort order                       |                  yes |           yes |                       yes |                no |
| `<th scope="col">` column headers                    |                   11 |            11 |                     **0** |                 0 |
| `<th scope="row">` row headers                       |                  100 |           100 |                     **0** |                 0 |
| `<caption>`                                          |                  yes |           yes |                    **no** |                no |
| `aria-sort` attributes (1 `descending`, rest `none`) |             11 (1 d) |      11 (1 d) |                     **0** |                 0 |
| Header sort control                                  | `<button>` in `<th>` |          same | `<th role="button">` (11) |              none |
| HTML size raw / gzip                                 |           146 / 7 KB |    146 / 7 KB |                226 / 8 KB |          1 / 0 KB |
| Browser-only API needed                              |                   no |            no |                        no |                no |

- **[measured]** The TanStack and plain-Mantine versions produce
  **identical markup** (compared with whitespace removed).
- **[measured]** Mantine `Pagination` with `getItemProps`/`getControlProps`
  server-renders 8 real `<a href>` anchors with `aria-current="page"`; it is
  independent of the table choice.
- AG Grid does not render records on the server in the tested configuration.

### Hydration

Method: server HTML is inserted as static markup, measured, then
`hydrateRoot` is called with `onRecoverableError` and `console.error`
captured (Chromium, Firefox, WebKit).

| Candidate          | Recoverable / console errors | Layout change after hydration                                       | Hydration time (Chromium, median of runs) |
| ------------------ | ---------------------------: | ------------------------------------------------------------------- | ----------------------------------------: |
| TanStack + Mantine |                            0 | none (table 4 223 px before and after)                              |                              137–272 ms\* |
| Mantine alone      |                            0 | none                                                                |                              148–273 ms\* |
| Mantine DataTable  |                            0 | none                                                                |                              114–346 ms\* |
| AG Grid Community  |                            0 | **host 24 px → 803 px** (empty shell, grid appears after hydration) |                                       n/a |

\*Range across browsers/runs; the harness uses a remote browser connection.
Hydration time is indicative only.

**Requirement found:** before `MantineProvider` mounts, `<html>` has no
`data-mantine-color-scheme`, so Mantine's border variables are undefined and
the 1 px row borders are missing, which shifted the table by 99 px on first
hydration **[measured]**. This is Mantine's documented SSR step: the document
shell must render `<ColorSchemeScript />` / `mantineHtmlProps`. A test encodes
both cases.

### What this does and does not prove

| Question                                                                                                         | Status                                                     |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| React generates meaningful table HTML without browser APIs                                                       | **Proven** (Node test)                                     |
| The HTML hydrates cleanly with no layout change                                                                  | **Proven** in 3 browsers (with the color-scheme attribute) |
| Google/Bing index the content                                                                                    | **Not provable** from an isolated prototype                |
| Static generation of real routes, CSS extraction/ordering, class-name stability between server and client builds | **Future application architecture**; not tested here       |
| Search-engine treatment of `display:none` duplicates (see §6)                                                    | **Unverified**                                             |

## 4. Interaction, accessibility and layout (TanStack + Mantine = Mantine alone)

Both implementations pass the **same 21 tests** in Chromium, Firefox and
WebKit **[measured]**. TanStack added no behaviour the plain version lacks.

| Requirement                                | Result                                                                                                                                                                                                         | Status                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Semantics                                  | `<caption>`, 11 `<th scope="col">`, 100 `<th scope="row">` identity cells, `aria-sort` on every header (one `descending`)                                                                                      | [measured]                |
| Sort controls                              | `<button>` inside `<th>`: activates with click, **Enter and Space** natively; first-click direction per column (stats descending, name/level ascending)                                                        | [measured]                |
| Controlled sort / unknown last             | Owner state/URL → query-sorted rows; unknown HP stays last                                                                                                                                                     | [measured]                |
| Unknown vs zero, missing sprite, long name | "—" named "Unknown", `0`, "?" placeholder, wrapped name with a taller row; stats right-aligned, tabular                                                                                                        | [measured]                |
| Row hover                                  | Mantine `highlightOnHover`                                                                                                                                                                                     | [measured]                |
| **Column hover (CSS only)**                | A hovered body stat cell paints a translucent overlay far above and below itself, clipped by `contain: paint` on the table: no JS and no per-column selectors. Hovering does not change the scrollable height. | [measured]                |
| Intersection                               | Overlay stacks on the row tint: the hovered cell is darker                                                                                                                                                     | [measured]                |
| Sorted-column emphasis                     | Class from `column.getIsSorted()` / the sort prop                                                                                                                                                              | [measured]                |
| Keyboard focus                             | Focused link outlines itself and its row (`:focus-within`)                                                                                                                                                     | [measured]                |
| Pinned identity + overflow                 | Sticky first column stable under horizontal scroll at 1024 px                                                                                                                                                  | [measured]                |
| Header visibility                          | `stickyHeader` inside a bounded `Table.ScrollContainer`: visible while scrolling the body; **not page-sticky**: it leaves the viewport with the table (same as AG Grid bounded)                                | [measured]                |
| Short vs long results                      | 8 rows → 455 px; 100 rows cap at 782 px (1440×900)                                                                                                                                                             | [measured]                |
| Width matrix (240 px rail)                 | 992 px: 5/10 numeric columns visible; 1024: 6; 1280: 9; 1440: 10; no page overflow                                                                                                                             | [measured]                |
| Forced colors (Chromium)                   | Hover → outline (row and column), pinned cells `Canvas`, focus outline kept, sort state via `aria-sort` + arrow glyph                                                                                          | [measured, Chromium only] |
| Light and dark                             | Both follow Mantine variables; screenshots below                                                                                                                                                               | [measured]                |
| Tab order                                  | **11 header buttons, then one link per row** (111 stops). Firefox additionally focuses the scroll region first.                                                                                                | [measured]                |

Screenshots: [light](./semantic-table-spike/tanstack-hover-light-1440.png)
(W.ATT hovered: column overlay, darker intersection),
[dark](./semantic-table-spike/tanstack-hover-dark-1440.png),
[1024 px with scrolled pinned column](./semantic-table-spike/tanstack-overflow-hover-1024.png),
[short results](./semantic-table-spike/tanstack-short-1440.png),
[DataTable](./semantic-table-spike/datatable-1440.png).

### Limits of the CSS-only highlight (recorded, not "fixed")

- The **header cell is not tinted** by column hover, and hovering a header does
  nothing: the sticky header is its own stacking context.
- The **pinned identity column is excluded** from column highlight (it keeps
  the row tint), since its sticky cells would paint inconsistently.
- Column highlight is **hover only**; keyboard focus gets the row/link outline
  but no column tint. Touch has no hover, so sorted-column emphasis carries the
  comparison.
- It relies on `contain: paint` clipping; AG Grid's built-in version has none of
  these gaps.

### Mantine DataTable observations

| Requirement                               | Observed (9.4.0)                                                                                                                                              | Status                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Server rows, links, order, hydration      | All pass                                                                                                                                                      | [measured]                       |
| Header semantics                          | `<th role="button" tabindex="0">`: no `scope`, no `aria-sort`, no `<caption>`, no row headers                                                                 | [measured]                       |
| Keyboard                                  | Click and **Enter** sort; **Space does not** (Chromium, Firefox, WebKit)                                                                                      | [measured]                       |
| First-click direction                     | First click on HP gave descending and Level also descended on Enter; no per-column first-direction prop was found among its props (not exhaustively verified) | [measured]                       |
| Row hover / column hover                  | Row yes; column highlight none                                                                                                                                | [measured]                       |
| Pinned first column + sticky header       | Work, inside its internal Mantine `ScrollArea`                                                                                                                | [measured]                       |
| Tab order                                 | 11 `<th>` stops, then links                                                                                                                                   | [measured]                       |
| Column visibility, row expansion, storage | Built in (`toggleable`, `storeColumnsKey`, `rowExpansion`) per its types; **not exercised**                                                                   | [verified, unverified behaviour] |
| Cost                                      | +58 KB gzip JS and +3.2 KB gzip CSS in the production probe; about 2× the mount time of plain Mantine Table                                                   | [measured]                       |

Matching the semantics we want (caption, `scope`, `aria-sort`, Space) would
mean replacing its header rendering, which is not available through public
props **[judgment]**.

## 5. Measurements

Chromium via the remote Playwright server, 1440×900, same fixtures and harness
for all four; 7 mounts per candidate per run, 3 solo runs
(`performance.test.tsx`). Remote-browser overhead is included, so use the
numbers for **relative** comparison.

| Candidate           | Mount → painted, median across 3 runs | Sort event → painted, median | DOM nodes (container) |
| ------------------- | ------------------------------------: | ---------------------------: | --------------------: |
| Mantine Table alone |                              77–93 ms |                        83 ms |                 1 738 |
| TanStack + Mantine  |                             89–104 ms |                   100–116 ms |                 1 738 |
| Mantine DataTable   |                            175–191 ms |                   116–117 ms |                 1 819 |
| AG Grid Community   |                          115–125 ms\* |                     75–82 ms |           1 460–1 501 |

\*AG Grid is "first row cell rendered"; it virtualises (about 28 of 100 rows in
the DOM) and creates remaining rows lazily. First-ever (cold) mount per file:
Mantine alone 74–202 ms, TanStack 237–255 ms, DataTable 200–400 ms, AG Grid
191–339 ms (cold numbers include one-time module/JIT costs and vary between
runs). Heap memory was **not** measured.

**Production bundle** (Vite 8, `vite build`, entry renders `MantineProvider`
\+ `Pagination` + the candidate; sizes of all emitted JS/CSS; baseline =
without the candidate):

| Candidate           |   JS raw |  JS gzip | Δ JS gzip vs baseline | CSS gzip Δ |
| ------------------- | -------: | -------: | --------------------: | ---------: |
| Baseline            |   271 KB |  83.9 KB |                     – |          – |
| Mantine Table alone |   296 KB |  91.5 KB |           **+7.6 KB** |    +0.6 KB |
| TanStack + Mantine  |   332 KB | 102.0 KB |          **+18.1 KB** |    +0.6 KB |
| Mantine DataTable   |   472 KB | 142.0 KB |          **+58.0 KB** |    +3.2 KB |
| AG Grid Community   | 1 017 KB | 291.1 KB |         **+207.1 KB** |    +0.4 KB |

Differences within the Δ column include our own cells and the Mantine `Table`
pieces, so TanStack itself costs ≈ **+10.5 KB gzip** over plain Mantine Table.
No performance target is proposed; all four render 100 × 11 in well under a
frame budget of a few hundred milliseconds in this harness.

## 6. Complexity accounting

Classes: **1** out of the box · **2** public-API configuration · **3**
ordinary application composition · **4** custom CSS · **5** custom event/state
code · **6** fundamentally unsupported.

| Requirement                                            | AG Grid Community           | TanStack + Mantine                    | Mantine Table alone | Mantine DataTable                 |
| ------------------------------------------------------ | --------------------------- | ------------------------------------- | ------------------- | --------------------------------- |
| Server-rendered rows, links, headers                   | **6**                       | 1                                     | 1                   | 1                                 |
| Native table semantics (caption, `scope`, row headers) | **6** (ARIA grid)           | 3                                     | 3                   | **6** (no public control)         |
| `aria-sort` + Enter/Space sort control                 | 1 (Enter; Space unverified) | 3                                     | 3                   | **6** (no `aria-sort`, no Space)  |
| Row hover                                              | 1                           | 2                                     | 2                   | 2                                 |
| Column hover + intersection                            | 1                           | 4 (≈12 lines, limits §4)              | 4                   | **6**                             |
| Sorted-column emphasis                                 | 2                           | 3                                     | 3                   | not tested                        |
| Pinned identity column                                 | 2                           | 4 (≈8 lines sticky)                   | 4                   | 2                                 |
| Sticky header (bounded) + overflow                     | 2                           | 2 (`stickyHeader`, `ScrollContainer`) | 2                   | 1                                 |
| Controlled sort / URL                                  | 2                           | 3 (state ⇄ query mapping)             | 3                   | 2                                 |
| Pagination links                                       | 3 (Mantine `Pagination`)    | 3                                     | 3                   | 3 (or built-in)                   |
| Column visibility                                      | 2 (`hide`; UI composed)     | 2 (visibility state)                  | 3 (array filter)    | 1 (`toggleable`; not exercised)   |
| Row expansion                                          | unverified                  | 3 (extra `<tr>`)                      | 3                   | 1 (`rowExpansion`; not exercised) |
| Virtualisation                                         | 1                           | not needed at 100 rows                | not needed          | not needed                        |
| Keyboard cell navigation                               | 1                           | not provided (Tab only)               | not provided        | not provided                      |

**MapleTip-owned code** (non-comment lines, spike versions):

| Candidate           | Table component | Table CSS                        | Notes                                                                                   |
| ------------------- | --------------: | -------------------------------- | --------------------------------------------------------------------------------------- |
| Mantine Table alone |             121 | ≈60 behaviour lines of 150 total | Cells (57) and columns (52) are shared by every candidate and excluded                  |
| TanStack + Mantine  |             169 | same ≈60                         | +48 lines of table component for the same behaviour                                     |
| Mantine DataTable   |           50 \* | none                             | \*Minimal and **not equivalent**: it lacks caption/scope/`aria-sort`/Space/column hover |
| AG Grid Community   |             227 | 72 + theme 29                    | Includes the keyboard and sort-event adapters                                           |

### Occam's razor applied to TanStack Table **[judgment]**

- **Row model:** not used. There are no sorted, filtered or paginated row
  models; `getRowModel()` returns the core rows we passed in.
- **Sorting:** the query layer (Orama in the app; a stand-in function here)
  sorts. TanStack only holds sorting _state_ with `manualSorting: true`, and we
  convert its updater to our `SpikeSort` and back (≈12 lines) to save ≈6 lines
  of toggle logic. Net: negative.
- **Pagination:** URL- and data-driven; the feature is not registered.
- **Column visibility:** state + `getVisibleLeafColumns()` vs a one-line array
  filter.
- **Pinning:** TanStack's pinning feature was not needed for one pinned column;
  sticky CSS does it, and it would not change that CSS.
- **Expansion:** an extra `<tr>` is ordinary composition.
- **Cost:** +10.5 KB gzip, +15 ms median mount, +48 lines, a second state
  model (`@tanstack/react-store`).

Conclusion: TanStack Table adds a dependency without removing MapleTip code or
adding behaviour. **Revisit** only if a requirement arrives that its state
machinery actually solves (column reordering/resizing, grouped headers,
multi-column sort state, large client-side row models).

## 7. Decision

### Four-way decision matrix (weighted by the stated priorities)

| Criterion (priority order)                   | AG Grid Community                                                                          | TanStack + Mantine                     | **Mantine Table alone**   | Mantine DataTable                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------- | ------------------------- | ----------------------------------------------- |
| 1. SSG/SSR-ready, semantic, indexable HTML   | **Fails** (empty shell, +779 px shift on hydrate)                                          | Pass                                   | **Pass**                  | Rows pass; header semantics poor                |
| 2. Accessibility and ordinary web navigation | ARIA grid, one Tab stop; **screen-reader behaviour unverified**; links need arrows + Enter | Native table, 111 Tab stops (see risk) | **Same, fewer parts**     | `th role=button`, no `aria-sort`/scope/Space    |
| 3. Low total system complexity               | Lowest MapleTip code for highlight/pin; heaviest dependency                                | More code than needed                  | **Fewest moving parts**   | Least code, but cannot reach required semantics |
| 4. Consistent desktop comparison UX          | **Best** (built-in column hover incl. header and pinned)                                   | Good, CSS-only limits                  | **Good, CSS-only limits** | Row hover only                                  |
| 5. Performance and bundle                    | +207 KB gzip; fast virtualised                                                             | +18 KB gzip                            | **+7.6 KB gzip**          | +58 KB gzip, slowest mount                      |
| 6. Advanced features                         | Many, mostly unneeded                                                                      | Unneeded                               | None needed               | Column toggle, expansion                        |

### Does SEO/SSG change the previous conditional AG Grid recommendation?

**Yes.** The earlier recommendation ("provisionally adopted with constraints")
assumed indexable HTML could come from separately rendered cards while the grid
stayed client-only. With SEO as the first priority, that means two renderings of
the same records, an empty-shell grid and a 779 px layout shift on hydration.
The new evidence shows a single semantic React table can be rendered in Node,
hydrate cleanly and reproduce most of AG Grid's comparison UX with about 60
lines of CSS. **AG Grid adoption is withdrawn as the production table plan**;
the spike is retained as the interaction-quality baseline.

### Recommendation

**Use first-party Mantine `Table` directly, with domain-owned columns and
cells, and no TanStack Table, no DataTable and no table wrapper.**

Smallest real compromises relative to AG Grid, to be accepted by product:

1. Column hover does not tint the header cell or the pinned identity column.
2. No keyboard cell navigation: Tab walks 11 header buttons and every row link.
3. The header is visible only while scrolling inside a bounded container, not
   page-sticky (identical to the AG Grid bounded layout).
4. No virtualisation (not needed at ≤ 100 rows; 1 738 DOM nodes).

### Risks and untested items

| Item                                                                                                                           | Status                                    |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Screen readers (NVDA + Firefox, VoiceOver + Safari) on the native table, including 111 Tab stops and sortable header buttons   | **Required before adoption**, not done    |
| Forced colors on Windows, Firefox/WebKit forced colors (only Chromium emulation ran)                                           | **Required before adoption**, partly done |
| `display:none` duplicate rendering (table + cards) and its search-engine treatment; hidden-card DOM cost with real card markup | **Unverified**; measure in P1             |
| Tab-stop count (≈100 links per page): mitigations are page size, a skip link or top pagination                                 | Product decision                          |
| Real touch devices; classic visible scrollbars at 992–1 280 px                                                                 | Unverified                                |
| Class-name stability, CSS ordering and `ColorSchemeScript` in the real SSG build                                               | Application architecture                  |
| Mantine and DataTable minor-version drift; CSS-only highlight depends on `contain: paint` and `inset` behaviour                | Low, covered by tests                     |
| Orama sort behaviour (the spike uses a stand-in)                                                                               | Out of library scope                      |

## 8. Reproducing

```sh
pnpm storybook                                  # Spikes / Semantic table, Spikes / AG Grid
pnpm --filter @mapletip/component-library exec vitest run --project ssr
PLAYWRIGHT_WS_ENDPOINT=... pnpm test            # unit (browser), ssr (Node), storybook
```

Cross-browser runs used a temporary config (not committed) that added Firefox
and WebKit instances; performance and bundle probes were scripts that were not
committed either. Methodology is described in §3 and §5.
