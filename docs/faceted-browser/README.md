# Faceted Browser — Revised Architecture Plan

Status: **proposal for review**. P0 (AG Grid Community spike) is complete.
P1–P4 have not started, and this document does not approve them.

This replaces the original plan in [legacy-research.md](./legacy-research.md).
That file's repository audit (§2) and cross-domain capability matrix (§3) remain
the reference research.

Evidence for every table claim is in [ag-grid-spike.md](./ag-grid-spike.md).
Labels:

- **[verified]**: confirmed from docs, type definitions or package metadata.
- **[measured]**: observed in spike browser tests or build probes.
- **[judgment]**: an architectural opinion.
- **[unverified]**: not tested.

---

## 1. Recommendation

### AG Grid Community: provisionally adopted with constraints

Final adoption is pending the decisions in §7 and the accessibility gate in §5
(P4).

AG Grid Community meets every desktop comparison requirement tested in the
spike through supported configuration. The decisive requirement is row +
column + intersection highlighting, which works out of the box from two theme
params **[measured]**. That one requirement would otherwise need a bespoke
hover engine with Mantine Table or Mantine DataTable.

The constraints:

1. **Bounded auto-height grid.** Use `domLayout: 'autoHeight'` with the
   supported theme param `autoHeightMaxBodyHeight`, capped by the page layout
   through a CSS variable.
   - Short result sets fit their rows: 8 rows render 408 px tall, against
     780 px of mostly empty space with a fixed height **[measured]**.
   - Long result sets stop growing at the cap and scroll internally with row
     virtualisation, keeping the header visible while the body scrolls
     **[measured]**.
   - The header is **not** page-sticky. It leaves the viewport once the page
     scrolls past the grid top **[measured]**. We will not CSS-hack
     `.ag-header`.
2. **The grid is client-only; cards are the server HTML.**
   - AG Grid server-renders an empty shell **[measured]**.
   - The domain card list renders on the server and the client with real entity
     links (100 of 100 links in SSR output), hidden by CSS from `md`
     **[measured]**.
   - The grid mounts lazily only when the `md` media query matches after
     hydration **[measured]**.
3. **The grid module stays behind a dynamic `import()` boundary.**
   - In a production build, the entry chunk (React + Mantine + cards) has no
     AG Grid code, and the grid chunk is separate: 745 KB raw / 207 KB gzip
     **[measured]**.
   - At 375 px the grid module is never requested; at 1 440 px it is requested
     once **[measured]**.
4. **Shared default configuration is mandatory.** Domains use one shared set of
   grid options:
   - Tab leaves the grid;
   - Enter activates the cell's link;
   - controlled sort through `onSortChanged` and `postSortRows`;
   - column hover on, multi-sort off.

   This keeps keyboard and sorting behaviour identical in every domain.

5. **Community only.** Column choice uses Mantine `Popover` + `Checkbox.Group`.
   AG Grid is currently a `devDependency` of the component library, because
   only the spike uses it and nothing exported depends on it.

### Gates before final adoption

- **Accessibility (required, not polish).** Real screen-reader testing and
  forced-colors testing of the grid must pass before production adoption:
  - NVDA + Firefox;
  - VoiceOver + Safari;
  - Windows forced colors.

  The 105 passing Chromium/Firefox/WebKit runs (35 tests × 3 browsers) verify
  DOM semantics, focus movement and keyboard contracts. **They are not
  screen-reader verification.**

- **Decisions D1–D4** (§7) confirmed by product and engineering.

### Fall back to Mantine DataTable if

- the accessibility gate shows the ARIA-grid model is materially worse for
  players than a native table;
- product drops the column/intersection highlight requirement;
- the desktop bundle budget cannot absorb the grid chunk.

Mantine DataTable's API covers everything except column hover **[verified]**:
native table, `pinFirstColumn`, sticky header in a bounded scroll area,
`sortStatus`/`onSortStatusChange`, row `highlightOnHover`, and stored column
toggling.

---

## 2. Desktop table evaluation

| Dimension                             | AG Grid Community 36.2                                                                              | Mantine DataTable 9.4                                            | Mantine `Table` (first-party)                             |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| Dense comparison UX                   | ✓ density via theme params; fixed column widths; spare width at the far edge **[measured]**         | ✓ **[verified, not built]**                                      | ✓ manual                                                  |
| Row hover                             | ✓ built in **[measured]**                                                                           | ✓ `highlightOnHover` **[verified]**                              | ✓ `highlightOnHover`                                      |
| Column hover + intersection           | ✓ built in, two theme params **[measured]**                                                         | ✗ bespoke                                                        | ✗ bespoke                                                 |
| Semantics                             | ARIA grid (`role=grid`, `aria-sort`, `aria-rowcount`); one Tab stop; arrow-key cells **[measured]** | native `<table>`                                                 | native `<table>`                                          |
| Header visibility                     | ✓ while scrolling the bounded body; ✗ page-sticky **[measured]**                                    | ✓ inside its own scroll area **[verified]**                      | `stickyHeader` only when no ancestor scrolls horizontally |
| Short vs long results                 | ✓ bounded auto height fits short sets and caps long ones **[measured]**                             | fixed `height` or none **[verified]**                            | manual                                                    |
| Pinned identity + horizontal overflow | ✓ native single-viewport scroll **[measured]**                                                      | ✓ `pinFirstColumn` **[verified]**                                | ✗ manual sticky CSS                                       |
| Domain cells                          | ✓ React cell renderers **[measured]**                                                               | ✓ `render` per column                                            | ✓ any JSX                                                 |
| Controlled sort / URL                 | ✓ via `onSortChanged` + `postSortRows` **[measured]**; header is a button, not a link               | ✓ `sortStatus`/`onSortStatusChange`                              | manual                                                    |
| Pagination                            | Mantine `Pagination` with `getItemProps` → `<a href>` **[measured]**                                | built in, or Mantine `Pagination`                                | Mantine `Pagination`                                      |
| Column visibility                     | `hide` ✓; tool panel is Enterprise → Mantine menu **[measured]**                                    | ✓ built-in toggling + `storeColumnsKey` **[verified]**           | manual                                                    |
| SSR / SEO                             | ✗ empty shell **[measured]**, so the server HTML comes from cards (§3.4)                            | ✓ renders HTML **[judgment]**                                    | ✓                                                         |
| Bundle                                | separate 207 KB gzip chunk, desktop only **[measured]**                                             | about 17 KB + 3 KB CSS gzip **[measured, package files]**        | 0                                                         |
| Startup                               | 131–521 ms to first data (100 × 11, remote harness) **[measured]**                                  | **[unverified]**                                                 | **[unverified]**                                          |
| Maintenance                           | MIT; frequent majors with breaking DOM/theming changes (v33 theming, v36 DOM) **[verified]**        | MIT; tracks Mantine majors; small maintainer base **[judgment]** | first-party                                               |
| MapleTip code to own                  | theme + default options + small helpers (about 120 lines in the spike)                              | theme overrides + **a column-hover engine**                      | sticky, pin, overflow **and** a hover engine              |

**Not evaluated further:**

- TanStack Table: headless, so we would build rendering, sticky behaviour and
  highlighting ourselves.
- Mantine React Table: its compatibility with Mantine 9 is **[unverified]**, and
  it has no column hover.
- AG Grid Enterprise: excluded.

---

## 3. Revised architecture

### 3.1 One pattern, three ingredients

```
Faceted Browser (pattern)
├── Mantine primitives: used directly by domains
│     Accordion · Checkbox(.Group) · Radio · NumberInput · NavLink · Tree · Pill · Scroller
│     Drawer · Select · Pagination · EmptyState · Alert · Skeleton · Text · Card · Popover
├── @mapletip/component-library
│     FacetedBrowser               layout slots + responsive contract
│     FacetedBrowserFilterDrawer   staged mobile drawer chrome (Cancel · Reset · Show N)
│     comparison-grid subpath      comparisonGridTheme · comparisonGridOptions (only entry that imports AG Grid)
└── Domain (app)
      columnDefs + cell renderers · card component · facet controls (one component,
      used by the rail and the drawer) · query/URL codec · sort mapping · links · data loading
```

### 3.2 Composition

```
<FacetedBrowser                                      library: layout only; slots are ReactNode
  title   = <Title>Monsters</Title>
  search  = <TextInput …/>                           the domain owns debouncing and the URL
  rail    = <MonsterFacets value={query} onChange={commit}/>        ≥ md, immediate commits
  quickFacets = <Scroller><Button onClick={openDrawerAt('level')}>Level</Button>…</Scroller>   < md
  activeFilters = <Pill.Group>…<Pill withRemoveButton onRemove/>…</Pill.Group>
  summary = <Text aria-live="polite">1–100 of 1,284</Text>
  toolbar = <ColumnsMenu/> | <NativeSelect label="Sort"/>
  status  = loading ? <Skeleton/> : error ? <Alert/> : empty ? <EmptyState/> : undefined
  cards   = <MonsterCards rows/>        always rendered (server HTML, real links); CSS-hidden ≥ md
  table   = <LazyMonsterGrid rows sort onSortChange/>   mounted client-side only when ≥ md matches
  pagination = <Pagination getItemProps={(p) => ({ component: Link, href: hrefFor(p) })}/>
/>
<FacetedBrowserFilterDrawer opened onCancel onReset onApply applyLabel="Show 214 monsters">
  <MonsterFacets value={draft} onChange={setDraft} expanded={section}/>   same component, staged
</FacetedBrowserFilterDrawer>
```

The rail and the drawer render **the same domain facet component**. The rail
passes committed state with immediate navigation; the drawer passes a draft
with staged apply. This removes the duplication without a library facet
abstraction.

### 3.3 Ownership

| Concern                                                                                                                                               | Owner         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Layout regions, the responsive contract, the grid body cap (CSS variable), mobile drawer chrome and footer contract, grid theme and default behaviour | library       |
| Interaction mechanics (focus trap, disclosure, inputs, pagination, pills, scrolling chips)                                                            | Mantine       |
| Table mechanics (sort UI, pinning, hover, keyboard, virtualisation, bounded height)                                                                   | AG Grid       |
| Columns, cells, cards, facet controls and labels, query semantics, URL codec, push/replace, history/Back, links, build identity, counts               | domain or app |

The library never depends on a router, Orama, MapleKit, compiler artifacts or
build identity.

### 3.4 Rendering and responsive contract

**Product requirement (D2):** browse results and entity links must appear in
SSG/SSR HTML and be indexable.

**Simplest compatible strategy [measured in the spike probe]:**

- The **cards slot is always rendered**, on the server and the client and at
  every width. That makes it the indexable HTML, with real `<a href>` links and
  identical server/client markup, so there is no hydration mismatch. From `md`
  it is hidden with Mantine `hiddenFrom="md"` (CSS `display: none`, so it is
  out of the accessibility tree).
- The **table slot is client-only.** It mounts only when Mantine
  `useMediaQuery('(min-width: 62em)')` turns true after hydration. That hook
  returns `false` on the server and the first client render by default. The
  slot's grid component is `React.lazy(() => import(…))`, so mobile never
  requests the grid module.
- There is no dual-render/unmount controller, no bespoke SEO renderer and no
  user-agent sniffing. The cost on desktop is hidden card DOM: about 31 KB of
  HTML for 100 minimal spike cards **[measured]**. Real cards are heavier,
  which needs re-measuring in P1.
- Desktop users see a `Skeleton` in the table slot until the grid chunk loads.
  The spike measured 131–521 ms to first data after mount, excluding network
  time for the chunk.

**Breakpoint (D3, provisional): Mantine `md` (62 em / 992 px).** Below it:
cards, quick facets and the drawer. At or above it: a persistent 240 px rail
and the table.

Measured with 11 columns (1 100 px of content) **[measured]**:

| Viewport | Grid viewport | Numeric columns fully visible | Page overflow | Usability **[judgment]**                      |
| -------- | ------------- | ----------------------------- | ------------- | --------------------------------------------- |
| 992 px   | 734 px        | 5 / 10                        | none          | usable; half the stats need horizontal scroll |
| 1 024 px | 766 px        | 6 / 10                        | none          | usable                                        |
| 1 280 px | 1 022 px      | 9 / 10                        | none          | good                                          |
| 1 440 px | 1 182 px      | 10 / 10                       | none          | full comparison without scroll                |

The pinned 240 px identity column stays fixed at every width. Headless
browsers render overlay scrollbars, so the visible horizontal-scroll affordance
at 992–1 280 px is **[unverified]** on real desktops. Whether 5–6 visible stat
columns is acceptable at 992–1 024 px, or whether the threshold should move
up, is a product call in D3.

**Desktop layout (D1, provisional):** normal page flow. The results region
sets `--comparison-grid-max-body-height` (spike value:
`100dvh − header − 160px`), and the grid's bounded auto height reads it. The
header stays visible while the player scrolls inside the grid body. Once the
page scrolls past the grid top, the header leaves the viewport with the grid.
The rail follows document flow. There is no permanently fixed-height
workspace.

**Mobile:** normal page scroll; cards in `Stack component="ul"`; quick facets
in a Mantine `Scroller`; a full-height bottom `Drawer`.

### 3.5 Interaction contract (same for every domain)

| Behaviour            | Desktop                                                                                           | Mobile                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Facets               | Rail; each change commits immediately                                                             | Quick facet buttons open the drawer with that `Accordion` section expanded. Edits are staged. The footer has Cancel (discard), Reset (clear draft) and **Show N** (apply once). |
| Navigation hierarchy | `NavLink` links (real hrefs; change collection scope)                                             | Same links in the drawer. Following one navigates and closes the drawer, and is **not** staged.                                                                                 |
| Hierarchical facets  | Mantine `Tree` with checkbox nodes (refines within the scope)                                     | Same component, staged                                                                                                                                                          |
| Search               | `TextInput` + Mantine `useDebouncedCallback` (`flush` on Enter); push/replace is the app's choice | Same                                                                                                                                                                            |
| Sort                 | Grid headers (controlled)                                                                         | `NativeSelect` in the toolbar                                                                                                                                                   |
| Results              | AG Grid with the shared options                                                                   | Domain cards                                                                                                                                                                    |
| Pagination           | Mantine `Pagination`, anchors (also in server HTML)                                               | Same                                                                                                                                                                            |
| States               | `Skeleton`, `Alert` + Retry, `EmptyState` + domain recovery actions                               | Same                                                                                                                                                                            |
| Back button          | App concern                                                                                       | App closes the drawer on Back (documented contract, implemented in the app)                                                                                                     |

### 3.6 Library API sketch (illustrative; P1 builds it)

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
  cards: ReactNode; // always rendered; hidden ≥ md
  table: ReactNode; // mounted client-side when ≥ md matches
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

// @mapletip/component-library/comparison-grid (only this subpath imports AG Grid)
export const comparisonGridTheme: Theme; // Mantine CSS variables + autoHeightMaxBodyHeight
export const comparisonGridOptions: Pick<
  GridOptions,
  | 'columnHoverHighlight'
  | 'suppressMultiSort'
  | 'tabToNextCell'
  | 'onCellKeyDown'
  | 'postSortRows'
  | 'enableCellTextSelection'
  | 'ensureDomOrder'
  | 'defaultColDef'
  | 'domLayout'
> & { modules: Module[] };
```

Domains use plain `AgGridReact` with these spread in. There is no
vendor-neutral table wrapper.

---

## 4. Audit of the original components and hooks

| #   | Original               | Required behaviour                            | Existing solution                                                           | Custom warranted?                                                                     | Location                 | Decision                                                              |
| --- | ---------------------- | --------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------- |
| 1   | `BrowseLayout`         | One cohesive rail/results/mobile layout       | Mantine `Grid`, `hiddenFrom`/`visibleFrom`, `useMediaQuery`                 | **Yes, thin.** It enforces the cross-domain responsive and rendering contract (§3.4). | library                  | **Keep, simplified → `FacetedBrowser`** (slots only, no flags)        |
| 2   | `FacetSection`         | Collapsible rail group, active indicator      | `Accordion` (+ `Badge`/`Indicator`)                                         | No                                                                                    | —                        | **Delete**                                                            |
| 3   | `FacetOptionList`      | Checkbox/radio options with counts            | `Checkbox.Group`, `Radio.Group`                                             | No                                                                                    | domain                   | **Delete**                                                            |
| 4   | `RangeFilter`          | Min/max with validation, commit on Enter/blur | Two `NumberInput`s, `useDebouncedCallback`                                  | No; validation is domain semantics                                                    | domain                   | **Delete**                                                            |
| 5   | `DisclosureTree`       | Hierarchical navigation and facets            | `NavLink` (navigation), `Tree` + checkboxes (facets)                        | No                                                                                    | domain                   | **Delete** (keeps the nav vs facet distinction)                       |
| 6   | `NavList`              | Drill-down navigation                         | `NavLink`                                                                   | No                                                                                    | domain                   | **Delete**                                                            |
| 7   | `ActiveFilters`        | Removable constraints, Clear all              | `Pill.Group` + `Button`                                                     | No                                                                                    | domain via slot          | **Delete**                                                            |
| 8   | `FilterChip`           | Pill with a named remove button               | `Pill withRemoveButton removeButtonProps`                                   | No                                                                                    | domain                   | **Delete**                                                            |
| 9   | `QuickFilters`         | Scrollable facet shortcuts                    | `Scroller` + `Button`                                                       | No                                                                                    | domain via slot          | **Delete**                                                            |
| 10  | `FilterSheet`          | Staged mobile filters, fixed footer           | `Drawer`                                                                    | **Yes, thin.** The Cancel/Reset/Show N contract is shared by all domains.             | library                  | **Keep, simplified → `FacetedBrowserFilterDrawer`** (no screen stack) |
| 11  | `useFilterSheet`       | Draft copy, screen stack                      | `useState` + `useDisclosure`                                                | No; the screen stack is removed                                                       | domain                   | **Delete**                                                            |
| 12  | `ComparisonTable`      | Desktop comparison table                      | AG Grid Community (provisional)                                             | No custom table                                                                       | —                        | **Delete → shared theme + options subpath**                           |
| 13  | `ColumnChooser`        | Toggle column visibility                      | `Popover` + `Checkbox.Group` + AG Grid `hide`                               | Not yet                                                                               | domain                   | **Defer**; promote if two domains repeat it                           |
| 14  | `ResultList`           | Semantic card list                            | `Stack component="ul"`                                                      | No                                                                                    | domain                   | **Delete**                                                            |
| 15  | `ResultCard`           | Card frame                                    | `Card`/`Paper`                                                              | No                                                                                    | domain                   | **Delete**                                                            |
| 16  | `StatGrid`             | Compact stat facts                            | `SimpleGrid` + `dl`, or `DataList`                                          | No                                                                                    | domain                   | **Delete**                                                            |
| 17  | `StatValue`            | Unknown ≠ zero, numeric format                | `NumberFormatter`; unknown is a domain cell                                 | Not yet; it is a convention                                                           | domain                   | **Defer** until duplicated in ≥ 2 domains                             |
| 18  | `ResultSummary`        | Count announced politely                      | `Text aria-live="polite"`                                                   | No                                                                                    | domain via slot          | **Delete**                                                            |
| 19  | `Pagination`           | Real-href pagination                          | Mantine `Pagination` `getItemProps`/`getControlProps` **[measured]**        | No                                                                                    | domain via slot          | **Delete**                                                            |
| 20  | `SortSelect`           | Mobile sort                                   | `NativeSelect`/`Select`                                                     | No                                                                                    | domain                   | **Delete**                                                            |
| 21  | `BrowseStatus`         | Loading/error/empty                           | `Skeleton`, `Alert`, `EmptyState`                                           | No                                                                                    | domain via `status` slot | **Delete**                                                            |
| 22  | `ResponsiveResults`    | Table vs cards                                | `hiddenFrom` (cards) + `useMediaQuery` (grid mount) inside `FacetedBrowser` | No separate controller; no unmounting of server HTML                                  | library (inside #1)      | **Delete (folded into #1)**                                           |
| 23  | `useSearchDraft`       | Debounce + flush                              | `useDebouncedCallback` (`flush`, `cancel`) **[verified]**                   | No                                                                                    | app                      | **Delete**                                                            |
| 24  | `useStagedCount`       | Count for the pending draft                   | `useDebouncedValue` + domain query                                          | No library need                                                                       | app/domain               | **Delete**                                                            |
| 25  | `useVisualViewportFit` | Drawer footer above the soft keyboard         | `100dvh`, full-height Drawer, `interactive-widget=resizes-content`          | Not until CSS is shown to fail on a device                                            | —                        | **Defer**                                                             |
| 26  | `LinkProvider`         | Router-aware links                            | Domains render links; Mantine `component` props                             | No                                                                                    | app                      | **Delete**                                                            |

**Result:** 26 proposals become **2 components + 1 grid configuration
subpath**. Two items are deferred and one is conditional on device testing.
There are no predefined domain exceptions: every domain starts from desktop
table + mobile cards.

---

## 5. Milestones

### P0 — AG Grid Community spike (done; this PR)

- Storybook prototype and stories:
  - fixed, auto and bounded height;
  - short vs long results;
  - dark scheme;
  - the responsive probe.
- **Tests:** 35 browser tests, passing on Chromium, Firefox and WebKit (105
  runs). The package suite (unit + stories) passes 44 of 44 on Chromium.
- **Probes:** production chunk split, SSR output, width matrix.
- Evidence report and screenshots: [ag-grid-spike.md](./ag-grid-spike.md).

### P1 — `FacetedBrowser` and the shared grid configuration

- Promote the spike theme and options to the `comparison-grid` subpath, move
  AG Grid to `dependencies` at that point, and delete `src/spikes/`.
- Build `FacetedBrowser` and add `@storybook/addon-a11y` at error severity.
- **Acceptance:**
  - at 992/1 024/1 280/1 440 px, the rail and grid render and the cards are
    `display: none`;
  - at 375/320 px, the cards render and **the grid module is not requested**
    (lazy-import spy, as in the probe);
  - `renderToString` output contains every entity link;
  - no horizontal page overflow at 320 px;
  - short results fit their content and long results cap and scroll
    internally;
  - axe finds no violations.
- Measure hidden-card DOM cost with real card markup; the measurement informs
  D4. No performance targets are set until then.

### P2 — Facet interactions with Mantine

- Build `FacetedBrowserFilterDrawer` and compose these recipes in stories:
  - an `Accordion` rail;
  - `Checkbox.Group` with counts;
  - `NumberInput` ranges;
  - `NavLink` navigation;
  - a `Tree` facet;
  - `Pill` active filters;
  - `Scroller` quick facets.
- **Acceptance:**
  - Cancel, Escape and the overlay restore the committed value;
  - Apply calls `onApply` once and closes;
  - Reset clears the draft without closing;
  - a quick facet opens the drawer with its section expanded and focused;
  - focus returns to the trigger;
  - pill remove buttons are named "Remove <label>";
  - an invalid range disables Apply;
  - drawer navigation links are real `<a href>`.
- No new library component unless the P3 compositions repeat the same markup in
  ≥ 2 domains.

### P3 — Cross-domain reference compositions

- Monster-like, Map-like and Item-like stories, all desktop table + mobile cards
  - rail + drawer.
- **Acceptance:**
  - no domain identifiers in library source;
  - every library prop is used by ≥ 2 compositions;
  - each facet component is shared between rail and drawer unchanged.

### P4 — Accessibility gate and hardening (required before production adoption)

- **Gate:**
  - NVDA + Firefox and VoiceOver + Safari on the grid: sort announcements,
    row/column context, virtualised rows, link activation, leaving the grid;
  - Windows forced colors for the grid and cards.
  - Findings are recorded. A failure triggers the §1 fallback review.
- Real touch devices and visible desktop scrollbars at 992–1 280 px.
- Curated Vitest `toMatchScreenshot` baselines.
- Performance budgets derived from P1–P3 measurements, not set in advance.
- When the app exists: Back/drawer contract tests and URL round-trips.

---

## 6. Risks, by implementation impact

| Rank | Risk                                                                                                          | Impact                 | Mitigation                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| 1    | **Screen-reader experience of the ARIA grid** (virtualised DOM, cell focus, links via Enter) is untested      | High: adoption gate    | P4 gate; fall back to Mantine DataTable if materially worse                 |
| 2    | **Header not page-sticky.** It is visible only while scrolling inside the bounded body.                       | Medium: UX expectation | D1 decision; no CSS hacks                                                   |
| 3    | **Hidden card DOM on desktop** to satisfy server HTML                                                         | Medium                 | Measure with real cards in P1; minimal cards keep the cost low              |
| 4    | **Grid chunk 207 KB gzip** on desktop                                                                         | Medium                 | Already split by a dynamic import; D4 budget decision                       |
| 5    | **Vendor churn:** AG Grid majors changed theming (v33) and DOM (v36)                                          | Medium                 | Theme via params only; no `.ag-*` selectors in domain CSS; single major pin |
| 6    | **5–6 visible stat columns at 992–1 024 px**                                                                  | Low–Medium             | D3 provisional; pinned identity + native scroll verified                    |
| 7    | **Dev-only validation overlay** (warning #9, styles after init) covers the first grid on a page in dev builds | Low (dev only)         | Investigate in P1; production builds exclude `ValidationModule`             |
| 8    | Sort headers are not links (not crawlable or middle-clickable)                                                | Low                    | Accepted; sort state stays in the URL                                       |
| 9    | Vite dependency re-optimisation can fail one warm test run after a dependency change                          | Low                    | Passed from a cold cache; re-run                                            |

## 7. Decisions

| ID  | Decision                                                                                                                                                  | Status                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| D1  | Bounded auto height in normal page flow (§3.4) instead of a fixed-height workspace. The header stays visible while scrolling the grid body, not the page. | **Proposed**; needs product confirmation        |
| D2  | Indexable SSG/SSR results with entity links (product requirement), met by always-rendered cards + client-only lazy grid                                   | Requirement **accepted**; strategy **proposed** |
| D3  | Mantine `md` (992 px) for rail + table                                                                                                                    | **Provisional**; measured matrix in §3.4        |
| D4  | Desktop grid chunk of about 207 KB gzip (+742 KB raw) behind a dynamic import                                                                             | **Provisional**; recorded, no target set        |
| D5  | Colour schemes: dark-only (legacy) or light + dark (the spike supports both)                                                                              | Open; not blocking                              |

Non-blocking:

- page sizes;
- where column-visibility choices persist;
- per-domain card designs.

---

## 8. Changes from the original plan

| Area              | Original                                                                               | Revised                                                                      | Why                                                                        |
| ----------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Table             | Custom native `ComparisonTable`, `<col>` hover engine, two-mode sticky/overflow system | AG Grid Community with shared theme and options                              | Highlighting, pinning, overflow and bounded height are supplied and tested |
| Components        | 20 components + 5 hooks + `LinkProvider`                                               | `FacetedBrowser`, `FacetedBrowserFilterDrawer`, the grid config subpath      | Mantine supplies the rest (§4)                                             |
| Domain exceptions | Maps cards, NPC no rail, Quest grouped list, Item conditional list                     | None                                                                         | Product decision; deviations must be earned in implementation              |
| Mobile drawer     | Screen stack, `useFilterSheet`, viewport-fit JS, staged-count hook                     | One `Drawer` with `Accordion` sections; draft in domain `useState`           | KISS/YAGNI                                                                 |
| Responsive / SSR  | 768/1280 breakpoints, collapsible mid rail, SSR dual render + unmount controller       | One `md` breakpoint; always-rendered CSS-hidden cards; client-only lazy grid | Measured; satisfies indexable HTML without a controller                    |
| Desktop height    | Viewport-sticky header via a bespoke overflow mode                                     | Supported `autoHeightMaxBodyHeight`                                          | Supported API; short results no longer leave empty space                   |
| Links / routing   | `LinkProvider`, library history adapter                                                | Domains render links; Back/history stays in the app                          | No demonstrated failure of direct links                                    |
| Icons             | Inline SVGs in the library                                                             | None needed in library code; domains use an established set or pass icons in | Anti-bespoke                                                               |
| Milestones        | M0–M7                                                                                  | P0–P4 (P0 done)                                                              | Smaller surface                                                            |
