# Faceted Browser — Revised Architecture Plan

Status: **proposal for review.** P0 (the AG Grid spike) and the SSR-first table
evaluation are complete. P1–P4 have not started, and this document does not
approve them.

This supersedes the earlier AG Grid recommendation. Documents:

- [ssr-first-table-evaluation.md](./ssr-first-table-evaluation.md): **current
  evidence and decision record** for the table.
- [ag-grid-spike.md](./ag-grid-spike.md): the AG Grid spike (interaction-quality
  baseline).
- [legacy-research.md](./legacy-research.md): original audit and capability
  matrix (still the reference research); its plan is superseded.

Labels: **[verified]** (source, types, metadata), **[measured]** (browser/Node
tests, build probes), **[judgment]**, **[unverified]**.

---

## 1. Recommendation

### One semantic table, first-party Mantine `Table`

SEO-friendly initial HTML is a requirement, and it changes the earlier
conditional AG Grid recommendation:

- AG Grid Community server-renders an **empty shell** (0 of 100 records, 0
  links) and the grid appears after hydration (a 779 px layout shift)
  **[measured]**. Making its content indexable would require rendering the same
  records a second time as separate markup.
- First-party Mantine `Table` server-renders all 100 records, 100 real entity
  links, `<caption>`, `<th scope>` headers and `aria-sort` in plain Node,
  hydrates without errors or layout change in Chromium, Firefox and WebKit, and
  reproduces most of the AG Grid comparison UX with about 60 lines of CSS
  **[measured]**.

**Recommended production table: Mantine `Table`, used directly** with
domain-owned columns and cells. **No TanStack Table, no Mantine DataTable, no
table wrapper component.**

| Candidate                | Verdict                                                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mantine Table alone**  | **Recommended.** Same HTML and behaviour as the TanStack version with fewer parts: +7.6 KB gzip, 121 lines.                                                       |
| TanStack Table + Mantine | Rejected for now: identical output; used only for sorting _state_ and visibility; +10.5 KB gzip, +48 lines, no removed code. Revisit for reorder/resize/grouping. |
| Mantine DataTable        | Rejected: `th role=button` headers, no `aria-sort`/`scope`/caption, Space does not sort, no column hover, +58 KB gzip, slowest mount.                             |
| AG Grid Community        | Withdrawn as the production plan (SSR + hydration). Kept as the **UX reference** and an unchanged spike.                                                          |

### Compromises product must accept (relative to AG Grid)

1. Column hover does not tint the header cell or the pinned identity column.
2. No keyboard cell navigation: Tab walks the 11 header buttons and then one
   link per row (111 stops).
3. The header is visible only while scrolling inside a bounded container, not
   page-sticky (identical to the AG Grid bounded layout).
4. No virtualisation (not needed at ≤ 100 rows; 1 738 DOM nodes).

### Gates before final adoption

- **Accessibility (required, not polish):**
  - real screen-reader testing of the native table: NVDA + Firefox and
    VoiceOver + Safari, covering sortable header buttons and the Tab-stop
    count;
  - real Windows forced-colors testing.

  The automated runs verify DOM semantics, focus and keyboard contracts
  **[measured]**. They are not screen-reader verification, and forced-colors
  emulation ran in Chromium only.

- Decisions D1–D3 and D6–D7 (§7).
- The P1 measurement of hidden-duplicate DOM cost with real card markup (§3.4).

---

## 2. Table evaluation summary

Full evidence is in [ssr-first-table-evaluation.md](./ssr-first-table-evaluation.md).

| Dimension (priority order)                  | AG Grid Community                                                 | TanStack + Mantine | **Mantine Table**     | Mantine DataTable                |
| ------------------------------------------- | ----------------------------------------------------------------- | ------------------ | --------------------- | -------------------------------- |
| 1. Server-rendered, indexable HTML          | **Fails**                                                         | Pass               | **Pass**              | Rows pass; headers poor          |
| 2. Semantics, accessibility, web navigation | ARIA grid, one Tab stop; links need arrows + Enter; SR unverified | Native table       | **Native table**      | `th role=button`, no `aria-sort` |
| 3. MapleTip-owned complexity                | Low for UX; heavy dependency                                      | +48 lines, no gain | **Fewest parts**      | Cannot reach required semantics  |
| 4. Comparison UX                            | **Best** (built-in column hover)                                  | CSS-only, limited  | **CSS-only, limited** | Row hover only                   |
| 5. JS gzip added                            | +207 KB                                                           | +18.1 KB           | **+7.6 KB**           | +58.0 KB                         |
| Mount → painted (median)                    | 115–125 ms                                                        | 89–104 ms          | **77–93 ms**          | 175–191 ms                       |
| Sort event → painted (median)               | 75–82 ms                                                          | 100–116 ms         | **83 ms**             | 116–117 ms                       |

The four implementations were measured on the same 100 × 11 fixtures at
1440×900. Timings include remote-browser overhead and are for relative
comparison only **[measured]**.

---

## 3. Revised architecture

### 3.1 One pattern, two library pieces

```
Faceted Browser (pattern)
├── Mantine primitives, used directly by domains
│     Table · Pagination · Accordion · Checkbox · Radio · NumberInput · NavLink · Tree
│     Pill · Scroller · Drawer · Select · EmptyState · Alert · Skeleton · Popover · Text
├── @mapletip/component-library
│     FacetedBrowser               layout slots + responsive CSS contract
│     FacetedBrowserFilterDrawer   staged mobile drawer chrome (Cancel · Reset · Show N)
│     comparison table CSS         pinned identity, sorted tint, focus ring, column highlight
└── Domain (app)
      columns + cells · card component · facet controls (one component, used by rail and drawer)
      query/URL codec · sort mapping · links · data loading
```

The table is **not** a library component. Domains write Mantine `Table` markup
with their own columns; the library supplies the shared CSS module (the ≈60
behaviour lines in the spike). A shared `SortableTh` (th + `aria-sort` + button)
is a candidate to extract in P3 only if the Monster/Map/Item compositions
repeat it.

### 3.2 Composition

```
<FacetedBrowser                                      library: layout only; slots are ReactNode
  title   = <Title>Monsters</Title>
  search  = <TextInput …/>                           the domain owns debouncing and the URL
  rail    = <MonsterFacets value={query} onChange={commit}/>        ≥ md, immediate commits
  quickFacets = <Scroller><Button onClick={openDrawerAt('level')}>Level</Button>…</Scroller>   < md
  activeFilters = <Pill.Group>…</Pill.Group>
  summary = <Text aria-live="polite">1–100 of 1,284</Text>
  toolbar = <ColumnsMenu/> | <NativeSelect label="Sort"/>
  status  = loading ? <Skeleton/> : error ? <Alert/> : empty ? <EmptyState/> : undefined
  table   = <MonsterTable rows sort/>   Mantine Table + Table.ScrollContainer; shown ≥ md (CSS)
  cards   = <MonsterCards rows/>        shown < md (CSS)
  pagination = <Pagination getItemProps={(p) => ({ component: 'a', href: hrefFor(p) })}/>
/>
<FacetedBrowserFilterDrawer opened onCancel onReset onApply applyLabel="Show 214 monsters">
  <MonsterFacets value={draft} onChange={setDraft} expanded={section}/>   same component, staged
</FacetedBrowserFilterDrawer>
```

### 3.3 Ownership

| Concern                                                                                                                                 | Owner         |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Layout regions, the CSS responsive contract, mobile drawer chrome and footer contract, shared table CSS                                 | library       |
| Table, pagination, drawer, inputs, disclosure, focus trap                                                                               | Mantine       |
| Columns, cells, cards, facet controls and labels, query semantics, URL codec, push/replace, history/Back, links, build identity, counts | domain or app |

No router, Orama, MapleKit, compiler artifacts or build identity in the library.

### 3.4 Rendering contract (SSG/SSR requirement)

**Strategy: render both the table and the cards on the server and the client,
and switch with CSS only (`hiddenFrom` / `visibleFrom` at `md`).**

- There is no media-query JS, no lazy import, no hydration branching and no
  layout flash: the server HTML equals the client first render. Both
  renderings contain the same records and real links.
- Hidden branches are `display: none`, so they are out of layout and the
  accessibility tree.
- **Costs to measure in P1:** hidden DOM and HTML size with real card markup
  (the spike's table alone is 146 KB raw / 7 KB gzip HTML for 100 rows).
- **Fallback only if that cost is unacceptable:** render the table on the server
  and swap to cards on narrow viewports after hydration with Mantine
  `useMediaQuery`. Do not build this unless the measurement demands it.
- **Unverified:** how search engines treat the `display: none` duplicate.

Application requirements discovered in the spike:

- The document shell must render Mantine's `<ColorSchemeScript />` /
  `mantineHtmlProps`. Without `data-mantine-color-scheme` on `<html>` the 1 px
  row borders are missing until hydration and the table shifts **[measured]**.
- CSS-module class names and CSS ordering must be stable between the server and
  client builds. This is a framework concern, tested only at the application
  level.

### 3.5 Responsive contract and layout

**Breakpoint (D3, provisional): Mantine `md` (62 em / 992 px).** Below it:
cards, quick facets and the drawer. At or above it: a persistent 240 px rail and
the table.

Measured with 11 columns (1 100 px of content) and a 240 px rail
**[measured]**:

| Viewport | Table viewport | Numeric columns fully visible | Page overflow | Usability **[judgment]**                      |
| -------- | -------------- | ----------------------------- | ------------- | --------------------------------------------- |
| 992 px   | 734 px         | 5 / 10                        | none          | usable; half the stats need horizontal scroll |
| 1 024 px | 766 px         | 6 / 10                        | none          | usable                                        |
| 1 280 px | 1 022 px       | 9 / 10                        | none          | good                                          |
| 1 440 px | 1 182 px       | 10 / 10                       | none          | full comparison without scroll                |

The pinned 240 px identity column stays fixed at every width. Headless
browsers use overlay scrollbars, so the visible horizontal-scroll affordance at
992–1 280 px is **[unverified]**.

**Desktop layout (D1):** normal page flow with the table inside
`Table.ScrollContainer` capped by `maxHeight`. Short results fit their rows
(8 rows → 455 px); long results cap (782 px at 1440×900) and scroll inside the
container, keeping the header visible. The header is **not** page-sticky.

### 3.6 Interaction contract (same for every domain)

| Behaviour            | Desktop                                                                                           | Mobile                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Facets               | Rail; each change commits immediately                                                             | Quick facet buttons open the drawer with that `Accordion` section expanded. Edits are staged; footer has Cancel (discard), Reset (clear draft), **Show N** (apply once). |
| Navigation hierarchy | `NavLink` links (real hrefs; change collection scope)                                             | Same links in the drawer; following one navigates and closes it (not staged)                                                                                             |
| Hierarchical facets  | Mantine `Tree` with checkbox nodes (refines within the scope)                                     | Same component, staged                                                                                                                                                   |
| Search               | `TextInput` + Mantine `useDebouncedCallback` (`flush` on Enter); push/replace is the app's choice | Same                                                                                                                                                                     |
| Sort                 | Header `<button>` in `<th aria-sort>` (Enter and Space), controlled by the app                    | `NativeSelect` in the toolbar                                                                                                                                            |
| Results              | Mantine `Table`                                                                                   | Domain cards                                                                                                                                                             |
| Pagination           | Mantine `Pagination` as `<a href>` (also in server HTML)                                          | Same                                                                                                                                                                     |
| States               | `Skeleton`, `Alert` + Retry, `EmptyState` + domain recovery actions                               | Same                                                                                                                                                                     |
| Back button          | App concern                                                                                       | App closes the drawer on Back (documented contract, implemented in the app)                                                                                              |

### 3.7 Library API sketch (illustrative; P1 builds it)

```tsx
// @mapletip/component-library
export interface FacetedBrowserProps {
  title: ReactNode;
  search?: ReactNode;
  rail?: ReactNode; // ≥ md
  quickFacets?: ReactNode; // < md
  activeFilters?: ReactNode;
  summary?: ReactNode;
  toolbar?: ReactNode;
  status?: ReactNode; // replaces results when defined
  table: ReactNode; // visible ≥ md (CSS)
  cards: ReactNode; // visible < md (CSS)
  pagination?: ReactNode;
}

export interface FacetedBrowserFilterDrawerProps {
  opened: boolean;
  title: string;
  applyLabel: string; // the domain computes "Show 214 monsters"
  applyDisabled?: boolean;
  onApply(): void;
  onCancel(): void; // close + discard; also Escape and overlay click
  onReset(): void;
  children: ReactNode;
}
// + a CSS module for Mantine Table: pinned identity, sorted tint, row focus ring,
//   CSS-only column highlight, forced-colors rules.
```

---

## 4. Audit of the original components and hooks

| #   | Original               | Required behaviour                       | Existing solution                                                    | Custom warranted?                                                                   | Location                 | Decision                                               |
| --- | ---------------------- | ---------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------ |
| 1   | `BrowseLayout`         | One cohesive rail/results/mobile layout  | Mantine `Grid`, `hiddenFrom`/`visibleFrom`                           | **Yes, thin.** It enforces the shared responsive and rendering contract (§3.4–3.5). | library                  | **Keep, simplified → `FacetedBrowser`**                |
| 2   | `FacetSection`         | Collapsible rail group, active indicator | `Accordion` (+ `Indicator`)                                          | No                                                                                  | —                        | **Delete**                                             |
| 3   | `FacetOptionList`      | Checkbox/radio options with counts       | `Checkbox.Group`, `Radio.Group`                                      | No                                                                                  | domain                   | **Delete**                                             |
| 4   | `RangeFilter`          | Min/max with validation                  | Two `NumberInput`s, `useDebouncedCallback`                           | No; validation is domain semantics                                                  | domain                   | **Delete**                                             |
| 5   | `DisclosureTree`       | Hierarchical navigation and facets       | `NavLink` (navigation), `Tree` + checkboxes (facets)                 | No                                                                                  | domain                   | **Delete** (keeps the navigation vs facet distinction) |
| 6   | `NavList`              | Drill-down navigation                    | `NavLink`                                                            | No                                                                                  | domain                   | **Delete**                                             |
| 7   | `ActiveFilters`        | Removable constraints, Clear all         | `Pill.Group` + `Button`                                              | No                                                                                  | domain via slot          | **Delete**                                             |
| 8   | `FilterChip`           | Pill with a named remove button          | `Pill withRemoveButton removeButtonProps`                            | No                                                                                  | domain                   | **Delete**                                             |
| 9   | `QuickFilters`         | Scrollable facet shortcuts               | `Scroller` + `Button`                                                | No                                                                                  | domain via slot          | **Delete**                                             |
| 10  | `FilterSheet`          | Staged mobile filters, fixed footer      | `Drawer`                                                             | **Yes, thin.** The Cancel/Reset/Show N contract is shared by all domains.           | library                  | **Keep, simplified → `FacetedBrowserFilterDrawer`**    |
| 11  | `useFilterSheet`       | Draft copy, screen stack                 | `useState` + `useDisclosure`                                         | No                                                                                  | domain                   | **Delete**                                             |
| 12  | `ComparisonTable`      | Desktop comparison table                 | **Mantine `Table`** (+ shared CSS module)                            | **No component.** Only shared CSS; `SortableTh` extraction is decided in P3.        | library CSS / domain     | **Delete the component; keep ≈60 lines of shared CSS** |
| 13  | `ColumnChooser`        | Toggle column visibility                 | `Popover` + `Checkbox.Group` + a column filter                       | Not yet                                                                             | domain                   | **Defer**; promote if two domains repeat it            |
| 14  | `ResultList`           | Semantic card list                       | `Stack component="ul"`                                               | No                                                                                  | domain                   | **Delete**                                             |
| 15  | `ResultCard`           | Card frame                               | `Card`/`Paper`                                                       | No                                                                                  | domain                   | **Delete**                                             |
| 16  | `StatGrid`             | Compact stat facts                       | `SimpleGrid` + `dl`, or `DataList`                                   | No                                                                                  | domain                   | **Delete**                                             |
| 17  | `StatValue`            | Unknown ≠ zero, numeric format           | `NumberFormatter`; unknown is a domain cell                          | Not yet; it is a convention (the spike's cell is 10 lines)                          | domain                   | **Defer** until duplicated in ≥ 2 domains              |
| 18  | `ResultSummary`        | Count announced politely                 | `Text aria-live="polite"`                                            | No                                                                                  | domain via slot          | **Delete**                                             |
| 19  | `Pagination`           | Real-href pagination                     | Mantine `Pagination` `getItemProps`/`getControlProps` **[measured]** | No                                                                                  | domain via slot          | **Delete**                                             |
| 20  | `SortSelect`           | Mobile sort                              | `NativeSelect`/`Select`                                              | No                                                                                  | domain                   | **Delete**                                             |
| 21  | `BrowseStatus`         | Loading/error/empty                      | `Skeleton`, `Alert`, `EmptyState`                                    | No                                                                                  | domain via `status` slot | **Delete**                                             |
| 22  | `ResponsiveResults`    | Table vs cards                           | `hiddenFrom`/`visibleFrom` (CSS) inside `FacetedBrowser`             | No separate controller; no JS                                                       | library (inside #1)      | **Delete (folded into #1)**                            |
| 23  | `useSearchDraft`       | Debounce + flush                         | `useDebouncedCallback` (`flush`, `cancel`) **[verified]**            | No                                                                                  | app                      | **Delete**                                             |
| 24  | `useStagedCount`       | Count for the pending draft              | `useDebouncedValue` + domain query                                   | No library need                                                                     | app/domain               | **Delete**                                             |
| 25  | `useVisualViewportFit` | Drawer footer above the soft keyboard    | `100dvh`, full-height Drawer, `interactive-widget=resizes-content`   | Not until CSS is shown to fail on a device                                          | —                        | **Defer**                                              |
| 26  | `LinkProvider`         | Router-aware links                       | Domains render links; Mantine `component` props                      | No                                                                                  | app                      | **Delete**                                             |

**Result:** 26 proposals become **2 library components + a small shared table
CSS module**. Two items are deferred and one is conditional on device testing.
There are no predefined domain exceptions: every domain starts from desktop
table + mobile cards.

---

## 5. Milestones

### P0 — Table evidence (done)

- AG Grid Community spike, Storybook stories and 35 browser tests passing on
  Chromium, Firefox and WebKit ([report](./ag-grid-spike.md)).
- SSR-first evaluation: TanStack + Mantine, Mantine alone and DataTable
  spikes, a Node SSR project, hydration, interaction, performance and bundle
  measurements ([record](./ssr-first-table-evaluation.md)).
- The package suite passes 116 of 116 tests on Chromium from a cold cache.
  Firefox and WebKit pass every spike browser test (forced-colors emulation is
  Chromium-only).

### P1 — `FacetedBrowser` and the table pattern

- Build `FacetedBrowser` with both `table` and `cards` rendered and switched by
  CSS; promote the shared table CSS; add `@storybook/addon-a11y` at error
  severity; remove `src/spikes/` (or keep only the Node SSR project's pattern).
- **Acceptance:**
  - The Node `ssr` test renders a Monster-like page and finds every record
    name, entity link, `<th scope>`, `aria-sort`, caption and pagination anchor
    in the HTML, with no browser global.
  - The hydration test shows zero recoverable errors and zero layout change
    with `data-mantine-color-scheme` on `<html>`.
  - At 992/1 024/1 280/1 440 px the rail and table show and the cards are
    `display: none`; at 375/320 px the reverse; no horizontal page overflow at
    320 px.
  - Short results fit and long results cap and scroll.
  - axe reports no violations.
  - HTML size and DOM nodes of the hidden duplicate with **real card markup**
    are recorded. If unacceptable, decide the `useMediaQuery` fallback then.

### P2 — Facet interactions with Mantine

- Build `FacetedBrowserFilterDrawer` and compose Mantine recipes in stories:
  `Accordion` rail, `Checkbox.Group` with counts, `NumberInput` ranges,
  `NavLink` navigation, `Tree` facet, `Pill` active filters, `Scroller` quick
  facets.
- **Acceptance:**
  - Cancel, Escape and the overlay restore the committed value.
  - Apply calls `onApply` once and closes.
  - Reset clears the draft without closing.
  - A quick facet opens the drawer with its section expanded and focused.
  - Focus returns to the trigger.
  - Pill remove buttons are named "Remove <label>".
  - An invalid range disables Apply.
  - Drawer navigation links are real `<a href>`.
- No new library component unless P3 repeats the same markup in ≥ 2 domains.

### P3 — Cross-domain reference compositions

- Monster-like, Map-like and Item-like stories, all desktop table + mobile cards
  - rail + drawer.
- **Acceptance:**
  - No domain identifiers in library source.
  - Every library prop is used by ≥ 2 compositions.
  - Each facet component is shared between rail and drawer unchanged.
  - Decide whether `SortableTh` is extracted.

### P4 — Accessibility gate and hardening (required before production adoption)

- **Gate:** NVDA + Firefox and VoiceOver + Safari on the native table (sortable
  header buttons, row/column context, 111 Tab stops and mitigation such as a
  skip link, page size or top pagination); Windows forced colors. Findings are
  recorded; a serious failure reopens the table decision.
- Real touch devices, visible desktop scrollbars at 992–1 280 px,
  search-engine treatment of the hidden duplicate where testable.
- Curated Vitest `toMatchScreenshot` baselines.
- Performance budgets derived from P1–P3 measurements, not set in advance.
- At application level: Back/drawer contract tests, URL round-trips, and a real
  SSG route with `ColorSchemeScript`, CSS extraction and class-name stability.

---

## 6. Risks, by implementation impact

| Rank | Risk                                                                                                         | Impact                 | Mitigation                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------ | ---------------------- | --------------------------------------------------------------------- |
| 1    | **Screen-reader experience** of the native table with ~111 Tab stops and sortable header buttons is untested | High: adoption gate    | P4 gate; skip link, page size or top pagination; fallback: reconsider |
| 2    | **Hidden duplicate (table + cards)** cost and search-engine treatment                                        | Medium                 | Measure in P1 with real cards; `useMediaQuery` fallback               |
| 3    | **CSS-only column highlight limits** (no header, no pinned column, hover only) are accepted by product       | Medium: UX expectation | D6; screenshots in the evaluation record                              |
| 4    | **SSG integration:** `ColorSchemeScript`, CSS ordering, class-name stability                                 | Medium                 | Application-level tests in P4                                         |
| 5    | **Header not page-sticky**                                                                                   | Low–Medium             | D1                                                                    |
| 6    | **5–6 visible stat columns at 992–1 024 px**                                                                 | Low–Medium             | D3 provisional; pinned identity + native scroll verified              |
| 7    | **Reordering/resizing/grouping** might be wanted later, which would justify TanStack Table                   | Low                    | D7: revisit only for a real requirement                               |
| 8    | Vite re-optimisation could fail a cold test run                                                              | Low                    | `optimizeDeps.include` added; cold-cache run passes                   |

## 7. Decisions

| ID  | Decision                                                                                                             | Status                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| D1  | Bounded container in normal page flow: header visible while scrolling the table body, not page-sticky                | **Proposed**; needs product confirmation                       |
| D2  | Indexable HTML is a requirement. Strategy: **one Mantine `Table` plus cards, both server-rendered, switched by CSS** | Requirement **accepted**; strategy **proposed**, measure in P1 |
| D3  | Mantine `md` (992 px) for rail + table                                                                               | **Provisional**; matrix in §3.5                                |
| D4  | Bundle: +7.6 KB gzip for Mantine Table alone (AG Grid's +207 KB no longer applies)                                   | **Resolved** by D5 below; recorded                             |
| D5  | Production table: Mantine `Table` alone                                                                              | **Proposed** (this PR)                                         |
| D6  | Accept the CSS-only column-highlight limits and no keyboard cell navigation (§1)                                     | **Open**; product                                              |
| D7  | TanStack Table: revisit only for column reorder/resize/grouping or similar                                           | **Proposed**                                                   |
| D8  | Tab-stop policy for ~100 links per page (page size, skip link, top pagination)                                       | **Open**; decide with P4 findings                              |
| D9  | Colour schemes: dark-only (legacy) or light + dark (the spike supports both)                                         | Open; not blocking                                             |

Non-blocking: page sizes, where column-visibility choices persist, per-domain
card designs.

---

## 8. Changes from the original plan

| Area              | Original                                                               | Revised                                                             | Why                                                                             |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Table             | Custom native `ComparisonTable`, `<col>` hover engine, two-mode sticky | Mantine `Table` directly + ≈60 lines of shared CSS                  | One SSR-capable semantic table; AG Grid and TanStack both measured and rejected |
| Components        | 20 components + 5 hooks + `LinkProvider`                               | `FacetedBrowser`, `FacetedBrowserFilterDrawer`, a shared CSS module | Mantine supplies the rest (§4)                                                  |
| Domain exceptions | Maps cards, NPC no rail, Quest grouped list, Item conditional list     | None                                                                | Product decision                                                                |
| Mobile drawer     | Screen stack, `useFilterSheet`, viewport-fit JS, staged-count hook     | One `Drawer` with `Accordion` sections; draft in domain `useState`  | KISS/YAGNI                                                                      |
| Responsive / SSR  | 768/1280 breakpoints, collapsible mid rail, SSR dual render + unmount  | One `md` breakpoint; both renderings server-rendered, CSS switch    | Measured; satisfies indexable HTML with no controller                           |
| Desktop height    | Viewport-sticky header via a bespoke overflow mode                     | `Table.ScrollContainer` `maxHeight`                                 | Supported Mantine API; short results no longer leave empty space                |
| Links / routing   | `LinkProvider`, library history adapter                                | Domains render links; Back/history stays in the app                 | No demonstrated failure of direct links                                         |
| Milestones        | M0–M7                                                                  | P0–P4 (P0 done)                                                     | Smaller surface                                                                 |
| AG Grid           | Provisionally adopted with constraints                                 | Withdrawn for production; kept as the UX baseline                   | SEO is the first priority (§1)                                                  |
