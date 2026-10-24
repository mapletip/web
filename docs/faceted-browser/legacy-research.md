# Faceted Browser — Original Research & Superseded Plan

Status: **superseded.** The current plan is [README.md](./README.md).
§2 (repository audit) and §3 (cross-domain capability matrix) remain the
reference research. §1 and §4–§11 are the **original, superseded**
architecture and milestones, kept for traceability; the revised plan audits
each of their proposals.

Scope: a reusable browse capability in `@mapletip/component-library` that can
power Monsters, Maps, Items, Equipment, NPCs, Quests and later domains.

Legacy paths below are relative to the legacy repository
(`../mapletip`, at `4220fee1`), written as `legacy:apps/web/…`. New-repo paths
are relative to this repository.

---

## 1. Executive recommendation

**Do not build a `<FacetedBrowser>`, a schema-driven facet engine or a
general-purpose data grid.** The legacy code shows that the six browse domains
share a **mechanical vocabulary** (rail, sections, option lists, ranges, chips,
staged mobile sheet, result summary, pagination, sortable comparison table,
loading/empty/error states). They do **not** share a query model, a result
shape or a facet taxonomy. Most of the legacy duplication comes from
re-implementing those mechanics in each domain's own CSS. The query semantics
were never the duplicated part.

The recommended architecture is a **kit of controlled, router-agnostic
presentation components plus three small headless hooks**, composed by
domain-owned browse pages:

```
Mantine primitives (Drawer, Accordion, Checkbox, Table, Popover, Combobox…)
        │  used directly, never re-wrapped for branding
        ▼
@mapletip/component-library  ─ src/browse/*
  layout:     BrowseLayout · FacetSection · ActiveFilters · QuickFilters
  facets:     FacetOptionList · RangeFilter · DisclosureTree · NavList
  results:    ComparisonTable · ColumnChooser · ResultList/ResultCard · StatGrid
              StatValue · ResultSummary · Pagination · BrowseStatus
  mobile:     FilterSheet (+ useFilterSheet) · ResponsiveResults
  hooks:      useSearchDraft · useStagedCount · useVisualViewportFit
  port:       LinkProvider (how any library link navigates)
        ▼
App (domain-owned, not in the library)
  per domain: URL codec · query/Orama adapter · facet definitions ·
              column definitions · card component · page composition
  per app:    router adapter (TanStack link + sheet history), build context
```

Key decisions, each argued in §5–§7:

1. **Slots and controlled props, not configuration schemas.** Domains render
   their own facets from library pieces. The library never sees a "facet
   definition" or a query object. The one generic data contract is the table's
   `columns` array, which is render-prop based (`cell: (row) => ReactNode`).
2. **Native `<table>` for desktop comparisons**, built on Mantine `Table`
   elements. The legacy Monster and Item tables are ARIA `role="table"` grids on
   `div`s, with a cloned header track and a custom scrollbar. That breaks the IA
   spec's "real `<table>` semantics" rule and costs about 400 lines per domain.
3. **Cards are domain components.** The library supplies list semantics, a card
   frame with named regions, and `StatGrid`/`StatValue`. It never generates cards
   from columns.
4. **Two kinds of hierarchy stay distinct.** _Navigation_ changes the collection
   and owns a URL path, which makes it SEO-indexable: Maps Region → Area, Items
   inventory scope. _Facets_ refine the collection through the query string:
   Monster location, element, level. Both can use `DisclosureTree`, but the
   domain decides whether a node is a link or a selection control.
5. **Router, Orama, compiler and build identity stay out of the library.** All
   navigation goes through hrefs plus a `LinkProvider`. History integration for
   Back is an app adapter over `useFilterSheet`'s state.
6. **One responsive contract**: below 768 px, cards and a full-height filter
   sheet. From 768 px, the table. From 1280 px, a persistent rail. Between 768
   and 1279 px, the rail collapses with an inline toggle. All of this is CSS and
   tokens, with no JS viewport width read during render.

This replaces about 24k lines of browse TSX and 13k lines of browse CSS in the
legacy app with an estimated 3–4k-line library and much thinner domain pages.
The rich domain behaviours are preserved: Monster interval-union facets and
relationship inspector, Item conditional comparison tables, Maps geography
paths and preview cards, Equipment requirement filters.

---

## 2. Repository audit

### 2.1 New repository (`mapletip/web`, this repo)

| Area        | Finding                                                                                                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Packages    | `@mapletip/component-library` (Mantine 9.7, React 19.2) and `@mapletip/config`. No app exists yet.                                                                                                                    |
| Library     | `src/index.ts` exports only `theme` (`createTheme({ primaryColor: 'indigo' })`); `src/Stub.stories.tsx` is a placeholder. Exports point at source (`"." : "./src/index.ts"`).                                         |
| Storybook   | 10.6, `@storybook/react-vite`, colocated `src/**/*.stories.tsx`, light/dark toolbar global, `MantineProvider` decorator. **No a11y addon, no viewport configuration.**                                                |
| Tests       | Vitest 5 browser mode (Playwright Chromium; `PLAYWRIGHT_WS_ENDPOINT` support). Two projects: `unit` (`src/**/*.test.tsx`, `vitest-browser-react`) and `storybook` (`@storybook/addon-vitest`, every story is a test). |
| CI          | Runs tests inside the `mcr.microsoft.com/playwright` image matching the exact `playwright` pin, which gives deterministic fonts and is a good base for screenshots.                                                   |
| Styling     | `postcss-preset-mantine` + `postcss-simple-vars` configured; `styles.css` imports Mantine core CSS only. No tokens yet.                                                                                               |
| Not present | Icons, router, data layer, CSS conventions, docs. `@mapletip/config/vite/lib` exists for a future library build.                                                                                                      |

### 2.2 Legacy repository: instructions and product documents

- `legacy:AGENTS.md` covers only devcontainer usage.
- `legacy:docs/ux/ia-component-spec.md` is the product truth. Relevant sections:
  - §0 hard constraints: dense tables are first-class; mobile is not "every row a giant card"; Mantine owns mechanics and MapleTip owns semantics; no `MapleTable` branding wrappers.
  - §4 component naming rule.
  - C19 ResultIdentity, C20 DenseBrowser, C21 FilterPanel ("filters are domain semantics, not generic schema-driven controls"), C22 SortControl, C23 ActiveQuery, C55 EmptyState.
  - T02/T04/T07/T10 domain templates. T02 is a very detailed Monster contract with pixel targets.
  - §8 device strategy and §10 accessibility baseline: real table headers and captions, announced sort, no tooltip-only information.
- `legacy:docs/storybook-design-system.md` sets WCAG 2.2 AA with the a11y addon at error severity, a review checklist (320 px reflow, forced colors, unknown/zero values…), and the rule "promote only after reuse is demonstrated".
- `legacy:openspec/ROADMAP.md` covers future browse domains (Skills, Jobs, Global search), `add-equipment-compare` (2–4 records, **not implemented**: 0/11 tasks), and the rule "Mantine first; feature composition stays local unless stable cross-feature semantics earn promotion".
- Legacy rendering is a **Vite SPA** with no SSR. SEO comes from generated static geography pages and sitemaps (`legacy:apps/web/package.json` build script).

### 2.3 Legacy browse code inventory

| Domain    | Entry                                                           | Non-test TS/TSX | CSS   | Tests | Notes                                                                                                                |
| --------- | --------------------------------------------------------------- | --------------- | ----- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| Shared    | `legacy:apps/web/src/components/browse/`                        | 444             | 154   | 273   | Frame, rail section, chip, drawer choice row, staged drawer root/frame, Back hook, staged count, visual-viewport fit |
| Monsters  | `…/monster/MonsterIndexPage/index.tsx` (1 084 lines)            | 8 351           | 5 436 | 2 629 | Table grid, rail, drawer, cards, numeric facets, relationship inspector, column settings, highlight                  |
| Items     | `…/item/ItemBrowsePage/index.tsx` (2 903 lines)                 | 6 339           | 3 487 | 4 403 | Inventory tree nav, scope-dependent facets, 3 conditional comparison tables, chair grid/list                         |
| Maps      | `…/map/MapsWorkspace/MapsWorkspace.tsx` + `MapResultsPanel.tsx` | 3 958           | 1 360 | 2 080 | Region → Area link tree, commit-mode rail fields, drawer stack reducer, preview card grid                            |
| Equipment | `…/equipment/EquipmentBrowsePage/index.tsx` (3 015 lines)       | 3 210           | 1 668 | 132   | Top filter bar (Select/MultiSelect), taxonomy drawer, "more filters" drawer, highlight sheet, pseudo-table list      |
| NPCs      | `…/npc/NpcBrowsePage/NpcBrowsePage.tsx` + `NpcBrowseRoute.tsx`  | 435             | 307   | 428   | Search + link list, **presentation/route split**                                                                     |
| Quests    | `…/quest/QuestBrowsePage/index.tsx`                             | 1 048           | 626   | 0     | Top filter form + Collapse, series grouping                                                                          |

Other shared pieces: `…/components/PaginationButtonLink.tsx` and
`pagination-link-click.ts`, which provide a real `<a href>` with SPA
interception on unmodified primary click. `…/components/SortableColumnHeader.tsx`
is a proper `<th aria-sort>` component, but **it has no consumers**: both tables
reinvented it as `span[role=columnheader]`.

Where the shared primitives are used (verified by grep):

| Primitive                   | Monsters             | Items         | Maps                                    | Equip.           | NPC | Quest           |
| --------------------------- | -------------------- | ------------- | --------------------------------------- | ---------------- | --- | --------------- |
| `BrowseWorkspaceFrame`      | ✓                    | ✓             | ✗ (own `<aside>` with same classes)     | ✗                | ✗   | ✗               |
| `BrowseRailSection`         | ✓                    | ✓             | ✓ (wrapper)                             | ✗                | ✗   | ✗               |
| `BrowseFilterChip`          | ✓                    | ✓             | drawer only (results chips hand-rolled) | ✗                | ✗   | ✗ (hand-rolled) |
| `StagedFilterDrawer*`       | ✓                    | ✓             | ✓                                       | ✗ (raw `Drawer`) | —   | —               |
| `useStagedFilterDrawerBack` | ✗ (own `useBlocker`) | ✓             | ✓                                       | ✗                | —   | —               |
| `useStagedResultCount`      | ✓                    | ✓             | ✓                                       | ✗                | —   | —               |
| `PaginationButtonLink`      | ✓                    | ✗ (raw `<a>`) | ✗ (raw `<a>`)                           | ✓                | ✓   | ✓               |

The reference hint that Maps, Monsters and Items share a frame is **only
partly true**. Maps duplicates the frame. Equipment and Quests use none of the
shared pieces.

---

## 3. Cross-domain capability matrix

Legend: ✓ present and good · ◐ present but inconsistent or weak · ✗ absent ·
— not applicable.

| Capability              | Monsters                                                                                                        | Items                                                                                | Maps                                                                                | Equipment                                                                               | NPCs                                                     | Quests                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Desktop rail            | ✓ collapsible; open ≥1024, toggle 768–1023 (`index.tsx` `railOverride`)                                         | ◐ ≥1280 only; sticky with its own scroll (`styles.css:2483`)                         | ◐ ≥1280 via `useMediaQuery` (`workspace-context.ts:15`); own aside                  | ✗ top bar of Selects                                                                    | —                                                        | ✗ top form + Collapse                                    |
| Hierarchical navigation | facet: Region → Area **tree as filter** (`location=region:…` query token)                                       | **path**: scope/category drill-down (`ItemInventoryTreeNav.tsx`, `items/${scope}/…`) | **path**: Region → Area link tree (`MapLocationTreeNav.tsx`, `/maps/$region/$area`) | ◐ scope tabs + taxonomy multiselect                                                     | —                                                        | series select                                            |
| Attribute facets        | ✓ interval unions with counts, custom range, element × response pair, traits, drops/quests pickers              | ✓ scope-dependent groups with counts, "see more", custom numeric ranges              | ◐ few: has monsters/NPCs, identity pickers, level range, min spawns                 | ✓ rich: slot, job, level, cash, gender, **max stat requirements**, bonus stat ≥, source | ✗ search only                                            | ◐ level, job, series, objective, reward, category, flags |
| Facet counts            | ✓ only while a surface is open; stale counts kept (`numericFresh`)                                              | ✓ contextual                                                                         | ✓ location match counts                                                             | ✗                                                                                       | —                                                        | ✗                                                        |
| Desktop commit model    | immediate; toggles push, ranges replace                                                                         | immediate                                                                            | immediate; numbers on blur/Enter (`MapFilterFields.tsx:13`)                         | immediate; taxonomy drawer staged ("Done")                                              | —                                                        | immediate                                                |
| Mobile entry            | Filters chip + 6 facet shortcut chips → drawer screens                                                          | quick filter chips with scroll hints → drawer group screens                          | Filters + Location chips + identity chip ("change/remove")                          | ◐ Selects + drawers                                                                     | —                                                        | ◐ same form, collapsed                                   |
| Mobile sheet            | right drawer, overview → screens, Cancel / **Show N monsters**                                                  | **bottom sheet** <64rem, Back/Cancel, Show N items                                   | right drawer, **typed stack reducer** (`drawer-model.ts`), Show N maps              | right drawers, no count                                                                 | —                                                        | —                                                        |
| Back semantics          | ◐ `useBlocker` without a history entry                                                                          | ✓ transient same-URL entry (shared hook)                                             | ✓ shared hook + stack                                                               | ✗                                                                                       | —                                                        | —                                                        |
| Search draft → URL      | ◐ 220 ms replace; Enter **replace**                                                                             | ✓                                                                                    | ✓                                                                                   | ✓                                                                                       | ✓ 300 ms replace, Enter **push** (`useNpcQueryDraft.ts`) | ✓                                                        |
| Sort UI                 | header **buttons** (no hrefs) + sort/"highlight" menus                                                          | `NativeSelect` + comparison header buttons                                           | native select                                                                       | Select                                                                                  | ✗                                                        | Select                                                   |
| Pagination              | links, 100 fixed, state 0-based / URL 1-based                                                                   | raw `<a>`, 25/50/75/100                                                              | raw `<a>`, default 50, selectable                                                   | links, 25–100                                                                           | links, 50 fixed                                          | links, 50 fixed, 0-based state                           |
| Desktop results         | ◐ CSS-grid `role="table"`, separate header track, custom `role="scrollbar"` (`MonsterResultsList.tsx:750–1353`) | ◐ `role="table"` only in comparison mode, otherwise list (`index.tsx` ~2737)         | preview **card grid** (`MapResultCard.tsx`)                                         | ◐ list with `aria-hidden` pseudo-headings (`index.tsx:2304`)                            | link list                                                | grouped list                                             |
| Mobile results          | ✓ purpose-built training cards (`ul/li/article/dl`)                                                             | ◐ same rows restyled                                                                 | same cards, reflowed                                                                | same list restyled                                                                      | same list                                                | same list                                                |
| Table/cards switch      | JS `window.innerWidth >= 768` in state, which breaks SSR/first paint                                            | CSS                                                                                  | —                                                                                   | CSS                                                                                     | —                                                        | —                                                        |
| Column highlight        | ✓ `:has([data-desktop-column=X]:hover)` enumerated per column (`styles.css:1680`)                               | ✓ same technique, separately enumerated (`styles.css:1073`)                          | —                                                                                   | ✗                                                                                       | —                                                        | —                                                        |
| Row highlight / focus   | ✓ hover + `:focus-within` ring                                                                                  | ✓ hover                                                                              | —                                                                                   | ✗                                                                                       | ✗                                                        | ✗                                                        |
| Emphasised stat         | ✓ URL `highlight` emphasises a column, adds an extra column if hidden                                           | ✗                                                                                    | —                                                                                   | ◐ "highlight sheet" (stat focus)                                                        | —                                                        | —                                                        |
| Sticky header           | ✓ `top: 64px` hard-coded (`styles.css:3127`)                                                                    | ✓ `top: 64px` comparison header                                                      | —                                                                                   | ✗                                                                                       | —                                                        | —                                                        |
| Sticky identity column  | ✓                                                                                                               | ✗                                                                                    | —                                                                                   | ✗                                                                                       | —                                                        | —                                                        |
| Column chooser          | ✓ not persisted (`MonsterColumnSettings.tsx`, `useState`)                                                       | ✗ (columns fixed per comparison)                                                     | —                                                                                   | ✗                                                                                       | —                                                        | —                                                        |
| Row detail / inspector  | ✓ one inline Maps/Drops inspector row, Escape returns focus                                                     | ✗                                                                                    | —                                                                                   | ✗                                                                                       | —                                                        | —                                                        |
| Active filter chips     | ✓ shared chip, "Remove X"; Clear filters                                                                        | ✓ shared chip                                                                        | ◐ hand-rolled, "Remove filter: X"                                                   | ◐ own                                                                                   | —                                                        | ◐ hand-rolled, "Remove filter: X"                        |
| Zero results            | ✓ with **recovery action** (`scope=all`) + Clear                                                                | ✓ build-empty vs filtered distinction                                                | ✓                                                                                   | ◐                                                                                       | ✓ query-specific copy + Clear search                     | ✓                                                        |
| Error / retry           | ✓ Alert + Retry; geography failure degrades only the tree                                                       | ✓ `role=alert`                                                                       | ✓                                                                                   | ◐                                                                                       | ✓ error vs **build mismatch**                            | ✓                                                        |
| Unknown vs zero         | ✓ explicit (`numericFieldKnown`)                                                                                | ✓ "unknown values last" sorts                                                        | ✓                                                                                   | ✓ `not-recorded`/`unresolved` in URL                                                    | —                                                        | —                                                        |
| Scroll handling         | ◐ ~150-line viewport + rail-anchor preservation (`index.tsx` `pendingFilterViewportRef`)                        | ◐ sessionStorage scroll                                                              | router                                                                              | router                                                                                  | heading focus                                            | heading focus                                            |
| Build isolation         | ✓ build-keyed loads; invalid build choices pruned after facets load                                             | ✓                                                                                    | ✓ build-scoped location keys                                                        | ✓                                                                                       | ✓ mismatch state                                         | ✓                                                        |
| Tests                   | jsdom + Playwright visual scripts                                                                               | jsdom + ~20 ad-hoc capture/verify scripts                                            | jsdom (large)                                                                       | minimal                                                                                 | jsdom                                                    | none                                                     |

### 3.1 Behaviours to preserve

- Staged mobile transaction with a **live "Show N results"** count, keyed to
  the exact draft and data source (`useStagedResultCount`: debounce, LRU of 36,
  race-safe).
- Maps' **typed screen stack** (`drawer-model.ts`). Invalid screen combinations
  cannot be represented, and Back pops one level.
- Quick chips as **entry points into a specific sheet screen**, with the active
  count in the label and an accessible name that states what opens.
- Interval-union numeric facets (OR within a facet, AND across facets) with
  counts, plus an inline custom range that commits on Enter or blur and replaces
  history.
- Real `<a href>` pagination with SPA interception (`interceptPaginationLinkClick`).
- Monster's emphasised column (`highlight`), the comparison-first default
  columns, unknown ≠ zero, right-aligned tabular numerals, the single inline
  inspector row with Escape and focus return, and "unused width at the far
  edge".
- Zero-result **recovery** actions (Monster "Show all matching monsters",
  scoped to the specific reason).
- Geography failure degrading only the tree, not the whole browse.
- NPC's presentation/route split and its "type = replace, Enter = push" draft.
- Paths for navigational hierarchy (Maps, Items), which keeps them SEO
  landing pages.

### 3.2 Inconsistencies to normalise

The legacy code has five different rail breakpoints and drawer sizes (768,
1024, 1280, 64rem, 61.99em). Other inconsistencies:

- Drawer edge: right in Monster and Maps, bottom in Items.
- Back: blocker in Monster, history entry in Items and Maps.
- Sort: button headers vs selects.
- Pagination: component vs raw anchors, fixed vs selectable size, 0- vs
  1-based internal state.
- Chip labels: "Remove X" vs "Remove filter: X".
- Sticky offset is a magic `64px`.
- The rail is sticky in Items but explicitly not sticky in Monsters (IA T02).

### 3.3 Behaviours to redesign

- **Div-grid tables** (Monster, Item comparison) and the **pseudo-table with
  `aria-hidden` headings** (Equipment). Replace them with a native `<table>`
  with a caption.
- The **cloned header track and custom scrollbar**. Use native sticky inside a
  bounded scroll region, and only when the table overflows (§4.1.3).
- **JS viewport branching** for table vs cards. Use CSS first, then trim the
  inactive variant after hydration (§4.4).
- **Sort headers as buttons**. Sorting changes the URL, so the header should be
  a link to the sorted URL.
- **Per-column enumerated hover CSS**. Use one delegated listener and `<col>`
  attributes (§4.1.2).
- Equipment and Quest **top filter bars**. Move them to the rail and sheet
  pattern, keeping their specialised groups.
- Apply pushes on top of the transient sheet history entry, which leaves a dead
  Back press (`useStagedFilterDrawerBack.ts`: "Do not pop that committed query
  back off"). Apply should **replace** the transient entry.

### 3.4 Distinctions a generic abstraction would destroy

- **Geography (Maps):** the tree is _navigation_. Nodes are links to indexable
  paths with counts that reflect current filters. Monsters render the same tree
  as a _single-select facet_. One tree rendering primitive works for both. One
  "hierarchy facet" model would not.
- **Item comparisons:** the column set depends on the query context (upgrade
  scroll, recovery, projectile). A fixed per-domain column schema cannot express
  this. Domains must be free to pass different `columns` per render.
- **Monster combat statistics:** emphasised column, extra column for a hidden
  emphasised stat, element/response micro-icons in the identity cell, nine-fact
  training cards with a prescribed order. All of this is domain rendering inside
  library frames.
- **Equipment:** "Can I equip it?" is a _requirement ceiling_ filter (max STR,
  DEX, INT, LUK, fame) with inverse semantics to stat floors. Generic min/max
  ranges would mislabel it, so the domain owns copy and validation and reuses
  `RangeFilter` only for layout and commit mechanics.
- **NPCs and Quests:** NPC needs no rail. Quests group by series. Forcing them
  into a full rail or table would add chrome without serving a player task
  (IA T07: "extra filters require a demonstrated player task").

---

## 4. UX interaction specification

### 4.0 Responsive contract

| Token     | Width       | Results                                       | Filters                                                                    |
| --------- | ----------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| `compact` | < 768 px    | domain cards (`ResultList`)                   | quick chips + full-height `FilterSheet`                                    |
| `medium`  | 768–1279 px | `ComparisonTable` (or domain grid, e.g. Maps) | rail **collapsed by default**; inline toggle opens it in flow (no overlay) |
| `wide`    | ≥ 1280 px   | same                                          | rail open by default; collapse choice persists per session                 |

- Breakpoints become Mantine theme breakpoints (`sm: 48em`, `lg: 80em`) so CSS
  modules use `$mantine-breakpoint-*` and no component reads `window.innerWidth`
  during render.
- Domains with no rail (NPC) skip the rail slot. Domains with cards on every
  breakpoint (Maps) skip `ComparisonTable`.
- Vertical chrome budget on `compact`: from the top of the page to the first
  result is at most **search + one chip row + one summary line** (≈ 150 px
  below the app header). The page title and lede collapse to one line or become
  visually hidden.

### 4.1 Desktop comparison table

#### 4.1.1 Structure and semantics

- `<table>` with `<caption>` (visually hidden by default, e.g. "Monsters, sorted
  by EXP descending, 1–100 of 1 284"), `<thead>` and `<th scope="col">`. The
  identity cell is `<th scope="row">`.
- Sortable header: `<th aria-sort="ascending|descending|none">` containing an
  `<a href={sortHref}>`. The link's accessible name is "EXP, sort descending".
  `aria-sort` alone announces the current state, with no "currently…"
  duplication.
- Numeric columns are right-aligned with `font-variant-numeric: tabular-nums`.
  Header alignment matches the cell alignment.
- Values go through `StatValue`, which distinguishes `known`, `zero`, `unknown`
  (visible "—" plus visually hidden "Unknown") and `notApplicable`. Unknown
  never renders as 0.
- Complex cells (sprites, badges, links, wrapped long names) are domain
  content. The identity column has a bounded width (`min`/`max` per column) so
  long names wrap rather than widen. Each row keeps an explicit entity link.
  Row click is not a navigation target.

#### 4.1.2 Row, column and intersection highlighting

| Signal                                                      | Trigger                         | Visual                                                       | Accessible equivalent                                           |
| ----------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| Row hover                                                   | pointer over row                | `--mt-browse-row-hover` background                           | —                                                               |
| Row focus                                                   | `:focus-within` on the row      | 2 px inset focus outline on the row                          | focus is on a real link or button in the row                    |
| Column hover                                                | pointer over any cell or header | `--mt-browse-col-hover` on `<col>` and its `<th>`            | —                                                               |
| Column focus                                                | focus inside a header or cell   | same as column hover                                         | header name is part of the cell's table context                 |
| Intersection                                                | row ∩ column                    | both translucent layers stack, so the intersection is darker | —                                                               |
| Sorted column                                               | `sort.columnId`                 | subtle persistent tint + header icon                         | `aria-sort`                                                     |
| Emphasised column (domain choice, e.g. Monster `highlight`) | controlled `emphasizedColumnId` | stronger persistent tint + bold values                       | caption mentions it; header has visually hidden "(highlighted)" |

Implementation:

- One delegated `pointerover`/`focusin` listener on `<table>` resolves the
  cell's column index. It then sets `data-hover` on the matching `<col>` and
  `<th>` and removes it from the previous one. Hover therefore costs **zero
  React renders** and needs no per-column CSS.
- CSS table paint order (columns → rows → cells) gives the intersection
  naturally when the row and column layers are translucent.
- Sticky cells must be opaque, so the sticky identity column and header compute
  their background with `color-mix()` over the same tokens.
- Touch has no hover. On touch, the persistent signals (sorted and emphasised
  column) carry comparison emphasis. Tapping a header link sorts, which is the
  touch equivalent of "focus this column".
- `forced-colors`: replace tints with `Highlight`/`CanvasText` outlines.
  `prefers-reduced-motion`: no transitions.
- No custom keyboard grid navigation (no roving tabindex, no arrow-key cell
  movement). Tab moves through links and buttons in reading order. A focusable
  overflow region (below) supports arrow-key scrolling natively. A grid
  interaction pattern is unwarranted for a read-only table and would conflict
  with screen-reader table navigation.

#### 4.1.3 Sticky header, sticky identity, horizontal overflow

`position: sticky` on `<thead>` stops working relative to the viewport once an
ancestor has `overflow-x: auto`. The legacy code worked around this by cloning
the header outside the scroller, syncing `scrollLeft`, and drawing a custom
scrollbar. The recommendation is two modes chosen by a single
`ResizeObserver` boolean:

1. **Fits** (the common case at `wide` with default columns): the wrapper uses
   `overflow: visible`. The header sticks to the viewport at
   `top: var(--mt-sticky-top)`, a token the app shell sets instead of a magic
   `64px`.
2. **Overflows** (the `medium` case, or many visible columns): the wrapper
   becomes a bounded scroll region
   (`max-block-size: calc(100dvh - var(--mt-sticky-top) - 1rem)`,
   `overflow: auto`, `tabindex="0"`, `role="region"`,
   `aria-label="<caption>, scrollable"`). Header and identity column are both
   sticky **inside** it. Edge shadows show that more columns exist (IA §8: never
   hide horizontal scroll affordance).

Alternatives considered:

- (a) Cloned header + synced scroll, as in legacy. Rejected: it breaks table
  semantics, needs a custom scrollbar with its own ARIA, and costs about 300
  lines of code that keeps breaking.
- (b) Always use a bounded region. Rejected: it adds a nested scroll area even
  when nothing overflows.
- (c) Drop sticky. Rejected: header context matters for long numeric lists.

#### 4.1.4 Columns

- Domains declare an ordered `columns` array. The identity column is always
  first and always visible.
- **Visibility only**, through `ColumnChooser` (popover checklist with "Show
  all" and "Reset to default"; at least one data column stays visible).
  Ordering, resizing and pinning beyond identity are **not provided**. Hidden
  columns keep their logical position when re-shown (legacy behaviour).
- Persistence is the app's job: per domain, in `localStorage`, not in the URL.
  Column choice is a viewing preference, not part of the query. The emphasised
  column is shown even if hidden (legacy "extra highlight" column).

#### 4.1.5 Sorting and pagination URLs

- Sort, page and page size live in the query string, through domain codecs.
  Changing a filter or sort resets the page. Header links and pagination links
  are real hrefs (crawlable, middle-clickable).
  - Pagination: Previous / "Page N of M" / Next, plus first and last when M > 5.
    `aria-current="page"` on the status. Disabled ends render as non-links.
  - After paginating, move focus to the results heading and scroll it into
    view (legacy Monster and NPC behaviour).
- Page size: the library supports an optional selector. Product decides per
  domain; the recommended default is 50, with Monsters keeping 100.
- Canonical page indexing: **1-based in the URL and in all component props.**

#### 4.1.6 Performance

- At most 100 rows × 12 columns (about 1 200 cells): no virtualisation. Rows are
  `memo`ised by key. Hover and focus effects are DOM-attribute based and never
  re-render rows.
- `ResizeObserver` for overflow mode only.
- `content-visibility: auto` with `contain-intrinsic-size` on mobile card items
  only. It is not used on table rows, where it breaks column sizing.
- Revisit virtualisation only if a domain needs more than 200 rows per page.
  That is a product question, not a library default.

### 4.2 Desktop rail and facets

- The rail is an `<aside aria-label="<Domain> filters">` of `FacetSection`s
  (`<section>` + heading + disclosure). Sections with active filters show an
  indicator dot and a local "Clear" action. Open/closed choices persist per
  session (IA T02).
- The rail follows document flow by default (IA T02). `sticky` is an opt-in
  prop for domains with a short rail. This settles the Monster vs Item
  conflict in favour of the explicit spec.
- Commit model on desktop is **immediate**:
  - Discrete toggles (checkbox, radio, tree selection): navigate with
    **push**.
  - Continuous input (range text, search text): debounced (250 ms) **replace**.
    Enter or blur commits immediately with replace.
  - Invalid ranges (min > max) show an inline error and never commit.
- Counts: `FacetOptionList` shows `count` when supplied. While new counts load,
  previous counts stay visible but dimmed (`countsPending`), so the rail never
  reflows. Zero-count options stay visible but de-emphasised, with no "hide"
  magic.
- Scroll: rail edits must not move the page. With React-controlled hrefs and
  `resetScroll: false` this is the default. The legacy rail-anchor compensation
  is only needed because the rail re-mounts, and keeping the rail mounted
  across navigations removes the need.
- Active filters appear above the results as `ActiveFilters`: chips labelled
  "Remove <label>" plus "Clear all" when there is more than one. Clearing
  keeps text search, sort and columns (IA T02).

### 4.3 Hierarchical navigation

- `DisclosureTree`: nested `<ul>` with disclosure `<button aria-expanded>` per
  branch, plus Expand/Collapse all. The domain renders each node: a link with
  `aria-current="page"` for navigation (Maps), or a radio/checkbox for a facet
  (Monster location). **No `role="tree"`**: the ARIA tree pattern requires
  roving focus and suits widgets, not link lists. Legacy Maps already uses
  disclosure buttons.
- `NavList`: a flat list with an optional "Back to parent" entry, for
  drill-down navigation (Items inventory).
- On mobile, navigation is a sheet screen. Selecting a navigation link closes
  the sheet and navigates immediately; it is not staged, because it changes the
  collection. Facet selections are staged.

### 4.4 Mobile

- **Results:** domain-designed cards in `ResultList` (`<ul>` → `<li>` →
  `<article aria-labelledby>`), with `ResultCard` regions `media`, `title`,
  `meta`, `stats`, `actions` and `detail`. `StatGrid` renders a `<dl>` with a
  configurable column count. At most one expanded card detail at a time
  (controlled `expandedKey`, as in legacy Monster relationships).
- **Sort on mobile:** a `SortSelect` (native select for a reliable mobile
  picker) in the summary row, or a "Sort" screen inside the sheet for domains
  with many sorts.
- **Quick chips (`QuickFilters`):** one horizontally scrollable row:
  `[Filters (n)]`, then 3–6 domain-chosen shortcuts, each opening the sheet at
  its screen. Selected chips show the value (single selection) or a count.
  Edge fades only appear when the row overflows. Chips are buttons with
  `aria-haspopup="dialog"` and names like "Level, 2 active filters. Open Level
  filters". Active filter removal stays in `ActiveFilters` below. The legacy
  Maps identity chip ("Monster: Snail. Change selection" plus a separate remove
  button) is a domain composition of `QuickFilters.Chip` and `FilterChip`.
- **`FilterSheet`:** full-height on `compact` (`100dvh`, adjusted by
  `useVisualViewportFit` so the footer stays above the software keyboard).
  A right drawer, `min(420px, 100vw)`, is used if a domain opens it on
  `medium`.
  - Header: Back (screen depth > 1) or Close, then the title (focused on every
    screen change, `tabIndex=-1`), then Reset.
  - Body: scrolls on its own.
  - Footer, always visible: Cancel and `Show N <noun>`. N is the staged count;
    the button says "Show results" while the count is unknown. Apply is
    disabled when the draft is invalid.
  - Overview screen: `FilterSheet.NavRow`s for each group, each with a summary
    of its staged selection ("Lv 30–40, 60+").
  - Nested screens: facet controls, and searchable pickers built on Mantine
    `Combobox`.
  - **Staging:** all edits change the draft only. Cancel, Close, Escape at
    root, overlay click and Back at root all discard the draft. Reset clears
    the draft's filters but keeps search and sort, and does not close.
  - Apply commits once (one navigation) and closes, then scrolls to the results
    top and focuses the results heading.
- **Browser Back (app adapter contract):**
  - Opening pushes one transient same-URL history entry.
  - Back at depth > 1 pops one screen. Back at the root closes and discards.
  - Apply **replaces** the transient entry with the committed URL, so the
    history after Apply is `[A] [B]`, not `[A] [A*] [B]`.
  - Closing by UI pops the transient entry.
  - A route change from outside the sheet (a link in it, or a build switch)
    closes it without popping.
- **Focus:** opening moves focus to the title; closing returns focus to the
  invoking chip or button (Mantine `returnFocus`). Screen changes focus the new
  title, and Back returns focus to the row that opened the screen (legacy
  `data-drawer-return-focus`). The focus trap is Mantine's.
- **Keyboard opening:** Enter or Space on a chip. Escape steps back, then
  closes. On desktop widths the sheet never opens automatically; if a resize
  crosses into `medium`/`wide` while it is open, it closes and keeps the draft
  discarded (legacy Maps behaviour).
- **Narrow screens (320 px):** chips wrap labels to a max width. The footer
  buttons stack below 360 px. No horizontal page scroll.
- **Responsive results rendering (`ResponsiveResults`):** server and first
  client render emit **both** variants, with CSS showing one, so there is no
  hydration mismatch or layout flash. After mount, a `matchMedia` listener
  unmounts the inactive variant to keep the DOM and accessibility tree single.
  In a pure SPA this collapses to a single render immediately. Alternatives
  considered: JS-only branching (legacy: wrong first paint and impossible for
  SSR), and CSS-only with both kept forever (doubles the DOM for 100 heavy
  rows).

### 4.5 Search, states and announcements

- `useSearchDraft(value, onCommit)`: typing commits with **replace** after
  250 ms. Enter commits with **push**. Clear commits with push and keeps focus
  in the input. External value changes (Back/Forward) resync the draft. This is
  NPC's semantics, adopted everywhere.
- `ResultSummary`: "1–100 of 1 284 monsters" in an `aria-live="polite"`
  region, updated **once per committed query**, never per keystroke or count
  refresh. Staged counts are announced only through the Apply button label.
- `BrowseStatus` variants:
  - `loading`: a skeleton matching the result density, with `role="status"`
    text.
  - `error`: `role="alert"`, a short cause and Retry.
  - `unavailable`: data does not exist for this build (NPC "mismatch", Items
    "no records for this build"), with no Retry.
  - `empty`: zero results. Title states the query (IA C55: "No quests in this
    build match Lv 30–40 in Lith Harbor"), with domain recovery actions
    (Remove <last filter>, Show all matching, Clear search/filters).
  - Partial degradation (geography unavailable) is an inline notice in the
    affected section, not a page state.

### 4.6 Game-version isolation

The library has no notion of builds. The app:

- keys each browse page by `buildId`, so all local state resets on a build
  switch;
- builds build-scoped hrefs;
- capability-gates facet options from the build's facet artifact;
- prunes URL values that the build cannot satisfy (legacy pattern, with
  `replace`).

`useStagedCount` takes an explicit `key` and `source`, so a count from one build
or draft is never shown for another.

---

## 5. Proposed component architecture

### 5.1 Layering and ownership

| Layer             | Owns                                                                                                                                                                                                                                                                  | Must not know                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Mantine           | focus trap, portals, scroll lock, popover positioning, inputs, Accordion/Collapse, Table elements, Combobox                                                                                                                                                           | —                                                                                 |
| Library `browse/` | layout regions, responsive rules, disclosure, option-list rendering, range input mechanics, chips, sheet chrome, table semantics, sticky/overflow, highlight, column visibility UI, stat value states, pagination UI, status UI, staged-count and search-draft timing | routers, URLs (beyond receiving hrefs), Orama, compiler types, builds, game nouns |
| App domain module | URL codec and validation, query execution, facet definitions and copy, counts, column definitions, cards, sort semantics, recovery actions, persistence of view preferences                                                                                           | other domains                                                                     |
| App platform      | `LinkProvider` (TanStack `createLink`), sheet ↔ history adapter, build context, scroll restoration, app shell sticky offset                                                                                                                                           | domain semantics                                                                  |

### 5.2 Composition diagram

```
<MonsterBrowsePage>                                    (app, domain-owned)
 ├─ <BrowseLayout rail={…} railOpen onRailToggle>      (library)
 │   ├─ header:  <SearchField draft=useSearchDraft()/>  <QuickFilters>  (compact only)
 │   ├─ rail:    <FacetSection title="Training">
 │   │             <FacetOptionList kind="checkbox" options=levelBands/> <RangeFilter/>
 │   │           <FacetSection title="Locations">
 │   │             <DisclosureTree nodes=geography renderNode={radio}/>
 │   ├─ toolbar: <ActiveFilters/> <ResultSummary/> <SortSelect|ColumnChooser/>
 │   └─ results: <BrowseStatus/> | <ResponsiveResults
 │                  table={<ComparisonTable columns=monsterColumns renderRowDetail=Inspector/>}
 │                  cards={<ResultList>{rows.map(r => <MonsterTrainingCard/>)}</ResultList>}/>
 │               <Pagination getHref/>
 └─ <FilterSheet {...useFilterSheet()}> screens…  </FilterSheet>   (+ app useSheetHistory)
```

### 5.3 Library inventory (public)

| Export                                                     | Kind               | Replaces (legacy)                                                                                   | Proven reuse                            |
| ---------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `BrowseLayout`                                             | layout             | `BrowseWorkspaceFrame`, Maps aside, per-domain intros                                               | Monsters, Items, Maps; NPC without rail |
| `FacetSection`                                             | disclosure         | `BrowseRailSection`, Monster `FacetGroup` accordion items                                           | Monsters, Items, Maps                   |
| `FacetOptionList`                                          | control            | Monster numeric options, Item `FilterChoices`/`FilterGroupChoices`                                  | Monsters, Items, Equipment, Quests      |
| `RangeFilter`                                              | control            | Monster custom range, `ItemBrowseNumericCustomRange`, Map level range, Equipment/Quest level        | 5 domains                               |
| `DisclosureTree`                                           | navigation/control | `MapLocationTreeNav`, Monster location facet, `DrawerLocationTree`                                  | Maps, Monsters                          |
| `NavList`                                                  | navigation         | `ItemInventoryTreeNav`, Equipment scope tabs                                                        | Items, Equipment                        |
| `ActiveFilters`, `FilterChip`                              | display/action     | `BrowseFilterChip` + 3 hand-rolled variants                                                         | all faceted domains                     |
| `QuickFilters`                                             | action row         | Monster/Item/Maps quick chips                                                                       | Monsters, Items, Maps                   |
| `FilterSheet` (+ `.NavRow`, `.Screen`)                     | modal chrome       | `StagedFilterDrawer*`, `BrowseDrawerChoiceRow`, 3 domain drawers                                    | Monsters, Items, Maps                   |
| `useFilterSheet`                                           | headless state     | Maps `drawerReducer` + per-domain draft state                                                       | Monsters, Items, Maps                   |
| `ComparisonTable`                                          | table              | `MonsterResultsList`, Item comparison tables, Equipment pseudo-table, unused `SortableColumnHeader` | Monsters, Items, Equipment              |
| `ColumnChooser`                                            | control            | `MonsterColumnSettings`                                                                             | Monsters (Items/Equipment candidates)   |
| `ResultList`, `ResultCard`, `StatGrid`                     | list/frame         | per-domain card markup                                                                              | all                                     |
| `StatValue`                                                | value              | per-domain number formatting + unknown handling                                                     | all (IA C14)                            |
| `ResultSummary`, `Pagination`, `SortSelect`                | toolbar            | 6 pagination variants, 5 sort selects                                                               | all                                     |
| `BrowseStatus`                                             | state              | 6 loading/error/empty implementations                                                               | all                                     |
| `ResponsiveResults`                                        | responsive switch  | Monster JS branching                                                                                | Monsters, Items, Equipment              |
| `useSearchDraft`, `useStagedCount`, `useVisualViewportFit` | hooks              | `useNpcQueryDraft` + 4 inline debounces, `useStagedResultCount`, same                               | all                                     |
| `LinkProvider`, `useLinkComponent`                         | port               | legacy library's TanStack-coupled `RouterLink`                                                      | every link in the library               |

Deliberately **not** in the library: facet definitions, URL codecs, Orama
adapters, card contents, relationship inspectors, Monster "highlight" menus,
element icons, map previews, equipment requirement copy, "View N results"
floating jump (Monster-only until a second domain needs it).

### 5.4 File layout

```
packages/component-library/src/
  index.ts                      # re-exports browse + link + theme
  link/LinkProvider.tsx
  browse/
    index.ts
    BrowseLayout/   BrowseLayout.tsx  BrowseLayout.module.css  BrowseLayout.stories.tsx  BrowseLayout.test.tsx
    FacetSection/   FacetOptionList/  RangeFilter/  DisclosureTree/  NavList/
    ActiveFilters/  QuickFilters/     FilterSheet/  (useFilterSheet.ts lives here)
    ComparisonTable/ ColumnChooser/   ResultList/   StatValue/  StatGrid/
    ResultSummary/  Pagination/       SortSelect/   BrowseStatus/  ResponsiveResults/
    hooks/          useSearchDraft.ts useStagedCount.ts useVisualViewportFit.ts
    __fixtures__/   creatures.ts places.ts goods.ts   # deterministic, not exported
    examples/       MonsterLike.stories.tsx MapLike.stories.tsx ItemLike.stories.tsx
```

No `atoms/ molecules/ organisms/` folders. Atomic Design is useful as a review
lens (is this a control, a region, or a page composition?), but the folder
taxonomy forces arbitrary placement decisions. The legacy team reached the same
conclusion.

---

## 6. Illustrative TypeScript / React APIs

These sketches show the contract shape; names may change during implementation.

### 6.1 Library contracts

```ts
// link/LinkProvider.tsx — the library's only navigation dependency
export type LinkComponent = React.ComponentType<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>;
export function LinkProvider(props: {
  component: LinkComponent;
  children: React.ReactNode;
}): JSX.Element;
export function useLinkComponent(): LinkComponent; // default: 'a'

// browse/ComparisonTable
export type SortDirection = 'asc' | 'desc';
export interface ComparisonColumn<Row> {
  readonly id: string;
  /** Visible header content; may be an abbreviation. */
  readonly header: React.ReactNode;
  /** Plain-text name for sort links, ColumnChooser and captions. */
  readonly label: string;
  readonly cell: (row: Row) => React.ReactNode;
  readonly align?: 'start' | 'end' | 'center';
  readonly width?: { readonly min: string; readonly max?: string };
  /** Exactly one column — the first — is the row header and may stick. */
  readonly rowHeader?: boolean;
  readonly sortable?: boolean;
}
export interface ComparisonTableProps<Row> {
  readonly caption: string;
  readonly captionVisible?: boolean;
  readonly rows: readonly Row[];
  readonly getRowKey: (row: Row) => string;
  readonly columns: readonly ComparisonColumn<Row>[];
  /** Defaults to all columns. The row-header column is always shown. */
  readonly visibleColumnIds?: readonly string[];
  readonly sort?: {
    readonly columnId: string;
    readonly direction: SortDirection;
  };
  /** Domain decides direction semantics; returns the href for activating a header. */
  readonly getSortHref?: (columnId: string) => string;
  readonly emphasizedColumnId?: string;
  readonly expandedRowKey?: string | null;
  readonly renderRowDetail?: (row: Row) => React.ReactNode;
  readonly onRowDetailClose?: () => void; // Escape; focus returns to the opener
  readonly density?: 'compact' | 'comfortable';
}

// browse/FilterSheet/useFilterSheet.ts — headless, no router
export interface FilterSheetController<Draft, Screen extends string> {
  readonly opened: boolean;
  readonly screen: Screen;
  readonly depth: number;
  readonly draft: Draft;
  open(screen?: Screen): void; // copies committed → draft
  push(screen: Screen): void;
  back(): boolean; // false at root
  setDraft(update: (draft: Draft) => Draft): void;
  cancel(): void; // discard + close
  commit(): Draft; // returns draft, closes
}
export function useFilterSheet<Draft, Screen extends string>(options: {
  readonly committed: Draft;
  readonly root: Screen;
  /** Close and discard when the committed value changes from outside. */
  readonly isEqual?: (a: Draft, b: Draft) => boolean;
}): FilterSheetController<Draft, Screen>;

export interface FilterSheetProps {
  readonly opened: boolean;
  readonly title: string;
  readonly onBack?: () => void; // shown when defined
  readonly onClose: () => void;
  readonly onReset?: () => void;
  readonly onApply: () => void;
  readonly applyLabel: string; // "Show 214 monsters" | "Show results"
  readonly applyDisabled?: boolean;
  readonly children: React.ReactNode;
}

// browse/hooks
export function useStagedCount(options: {
  key: string;
  source: unknown;
  enabled: boolean;
  query: () => Promise<number | null>;
  delay?: number;
}): number | null;
export function useSearchDraft(
  value: string,
  onCommit: (value: string, history: 'replace' | 'push') => void,
  options?: { delay?: number },
): { draft: string; change(v: string): void; commitNow(): void; clear(): void };
```

### 6.2 Monsters (dense comparison, staged facets, row detail)

```tsx
// app: domains/monster/browse/columns.tsx — domain-owned column set
export const monsterColumns: ComparisonColumn<MonsterBrowseRecord>[] = [
  {
    id: 'name',
    label: 'Monster',
    header: 'Monster',
    rowHeader: true,
    sortable: true,
    width: { min: '14.375rem', max: '15rem' },
    cell: (m) => <MonsterIdentity record={m} />, // sprite, link, trait/element icons, Maps/Drops actions
  },
  {
    id: 'level',
    label: 'Level',
    header: <abbr title="Level">Lv</abbr>,
    align: 'end',
    sortable: true,
    width: { min: '3rem', max: '3.25rem' },
    cell: (m) => <StatValue value={m.level} />,
  },
  {
    id: 'hp',
    label: 'HP',
    header: 'HP',
    align: 'end',
    sortable: true,
    cell: (m) => <StatValue value={m.hp} format="compact" exactTitle />,
  },
  // exp, expPer100Hp, physicalDamage … evasion
];

// app: domains/monster/browse/MonsterBrowsePage.tsx
export function MonsterBrowsePage({
  query,
  result,
  facets,
  counts,
  hrefFor,
  navigate,
}: Props) {
  const sheet = useFilterSheet<MonsterQuery, MonsterScreen>({
    committed: query,
    root: 'overview',
  });
  useSheetHistory(sheet); // app adapter (TanStack)
  const stagedCount = useStagedCount({
    key: monsterQueryKey(sheet.draft),
    source: result.index,
    enabled: sheet.opened,
    query: () => countMonsters(result.index, sheet.draft),
  });
  const [columns, setColumns] = usePersistentColumns(
    'monsters',
    monsterDefaultColumnIds,
  );
  const [inspector, setInspector] = useState<string | null>(null);

  return (
    <BrowseLayout
      title="Monsters"
      railLabel="Monster filters"
      rail={
        <MonsterRail
          query={query}
          facets={facets}
          counts={counts}
          onChange={navigate}
        />
      }
      header={
        <>
          <SearchField
            label="Search monsters"
            draft={useSearchDraft(query.q, (q, h) => navigate({ q }, h))}
          />
          <QuickFilters label="Quick monster filters">
            <QuickFilters.Trigger
              count={activeCount(query)}
              onClick={() => sheet.open()}
            />
            <QuickFilters.Chip
              label="Level"
              active={levelCount(query)}
              onClick={() => sheet.open('level')}
            />
            {/* Location, HP, EXP, Element, Traits */}
          </QuickFilters>
        </>
      }
      toolbar={
        <>
          <ActiveFilters
            items={monsterChips(query, facets)}
            onRemove={(c) => navigate(c.clear)}
            onClearAll={() => navigate(clearMonsterFilters)}
          />
          <ResultSummary
            range={result.range}
            total={result.total}
            noun={['monster', 'monsters']}
          />
          <ColumnChooser
            columns={monsterColumns}
            visible={columns}
            defaults={monsterDefaultColumnIds}
            onChange={setColumns}
          />
        </>
      }
    >
      <BrowseStatus
        status={result.status}
        empty={<MonsterEmpty query={query} recovery={result.recovery} />}
      >
        <ResponsiveResults
          table={
            <ComparisonTable
              caption={monsterCaption(query, result)}
              rows={result.rows}
              getRowKey={(m) => m.monsterId}
              columns={withEmphasis(monsterColumns, query.highlight)}
              visibleColumnIds={columns}
              sort={query.sort}
              getSortHref={(id) =>
                hrefFor({
                  ...query,
                  sort: nextMonsterSort(query.sort, id),
                  page: 1,
                })
              }
              emphasizedColumnId={query.highlight}
              expandedRowKey={inspector}
              onRowDetailClose={() => setInspector(null)}
              renderRowDetail={(m) => (
                <MonsterRelationshipInspector record={m} />
              )}
            />
          }
          cards={
            <ResultList label="Monster results">
              {result.rows.map((m) => (
                <MonsterTrainingCard
                  key={m.monsterId}
                  record={m}
                  expanded={inspector === m.monsterId}
                  onToggle={() => setInspector(toggle(m.monsterId))}
                />
              ))}
            </ResultList>
          }
        />
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          getHref={(p) => hrefFor({ ...query, page: p })}
        />
      </BrowseStatus>
      <MonsterFilterSheet
        sheet={sheet}
        facets={facets}
        applyLabel={showLabel(stagedCount, 'monster')}
        onApply={() => navigate(sheet.commit(), 'push')}
      />
    </BrowseLayout>
  );
}
```

Monster specifics stay in the domain: interval-union encoding
(`serializeMonsterNumericRanges`), the element × response pairing rule, the
"extra emphasised column" (`withEmphasis`), relationship lazy loading, and the
nine-fact card order from IA T02.

### 6.3 Maps (navigation hierarchy, light facets, card grid)

```tsx
export function MapBrowsePage({ location, query, result, tree, hrefFor, navigate }: Props) {
  const sheet = useFilterSheet<MapDraft, 'form' | 'location' | 'monsters' | 'npcs'>({
    committed: { filters: query.filters, sort: query.sort, location: location.key }, root: 'form',
  });
  useSheetHistory(sheet);
  return (
    <BrowseLayout
      title={location.title}                         // "Henesys" — path-derived, SEO landing title
      railLabel="Map navigation and filters"
      rail={<>
        <FacetSection title="Location" collapsible={false}>
          <DisclosureTree
            nodes={tree}
            renderNode={(node) => (
              <NavLink href={hrefFor({ location: node.key })} current={node.key === location.key}
                       count={result.locationCounts[node.key]}>{node.label}</NavLink>
            )}
          />
        </FacetSection>
        <FacetSection title="Contents">
          <FacetOptionList kind="checkbox" options={[
            { value: 'hasMonsters', label: 'Has monsters' }, { value: 'hasNpcs', label: 'Has NPCs' }]}
            selected={selectedFlags(query)} onToggle={(v) => navigate(toggleFlag(query, v), 'push')} />
          <RangeFilter label="Monster level" value={query.levelRange} onCommit={(r) => navigate({ levelRange: r }, 'replace')} />
          <MapIdentityPicker kind="monster" … />  {/* domain: Mantine Combobox */}
        </FacetSection>
      </>}
      header={<QuickFilters>…Filters, Location, identity chip…</QuickFilters>}
      toolbar={<><ActiveFilters …/><ResultSummary …/><SortSelect options={mapSorts} value={query.sort} getHref={…}/></>}
    >
      <BrowseStatus status={result.status} empty={<MapEmpty …/>}>
        <ResultList layout="grid" label="Map results">
          {result.rows.map((m) => <MapPreviewCard key={m.id} map={m} />)}   {/* domain: minimap preview */}
        </ResultList>
        <Pagination …/>
      </BrowseStatus>
      <MapFilterSheet sheet={sheet} … />
    </BrowseLayout>
  );
}
```

How it differs from Monsters:

- Selecting a location is **navigation**. In the sheet's Location screen,
  choosing a node closes the sheet and navigates (it is not staged), because it
  changes the collection's path. Other screens are staged.
- There is no `ComparisonTable` or `ResponsiveResults`; cards are used at every
  width.

### 6.4 Items: what is different

- **Rail navigation is drill-down.** `NavList` shows the current scope's
  children plus "Back to <parent>". These are path links, as in Maps, but one
  level at a time.
- **Facet groups depend on the scope.** The domain computes groups from
  `(scope, child, search)` (`item-browse-presentation.ts`) and renders
  `FacetSection` + `FacetOptionList` for each. The library is unaffected.
- **The result presentation depends on the query:**
  `comparisonContext(search)` returns `'upgrade' | 'recovery' | 'projectile' |
null`. Each context maps to its own `ComparisonColumn<ItemBrowseRecord>[]`
  (Slot, Stat improvement, Success, Destruction risk for scrolls; HP, MP for
  recovery). With no context, the domain renders a discovery `ResultList`
  instead of a table. Because `columns` is a plain per-render prop, this needs
  no table configuration API.
- **Chair grid/list toggle:** a domain-local `SegmentedControl` that chooses
  between `ResultList layout="grid"` and `layout="list"`.
- **Sort:** comparison contexts use header links; discovery uses `SortSelect`.
  Both derive from one domain sort codec, so the URL stays canonical.

Equipment follows the Items results model (a `ComparisonTable` replaces the
pseudo-table) and adopts the rail. Its requirement group renders four
`RangeFilter` "max" inputs with domain copy ("Your STR"). Its slot taxonomy is
a `FacetOptionList` with groups. A future 2–4 item compare is a separate
pattern (selection tray + compare view). The table permits a domain-rendered
checkbox column but does not build selection.

NPCs use `BrowseLayout` without a rail, plus `SearchField`, `ResultSummary`,
`ResultList` (link rows), `Pagination` and `BrowseStatus`. That is an existing
page rewritten with no new concepts. Quests use the rail and sheet for their
eight facets, and a domain grouped list (series headers) inside `ResultList`.

---

## 7. Dependency decisions

| Option                                              | Decision                                                                 | Reasoning                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mantine `Table` (+ `stickyHeader`, `Thead` …)       | **Use** as table elements                                                | Native elements with theme styling. `stickyHeaderOffset` maps to `--mt-sticky-top`. Verify Mantine 9's `Table.ScrollContainer` behaviour in M2; we may need our own wrapper for overflow mode.                                                                                                                                         |
| Native `<table>` semantics                          | **Required**                                                             | IA §10, screen-reader table navigation, caption, `aria-sort`.                                                                                                                                                                                                                                                                          |
| TanStack Table                                      | **Avoid for now**                                                        | Its value is headless sorting, filtering, grouping, pagination and visibility state. Our sort and pagination live in the URL and Orama, and visibility is about 20 lines. It would add an API layer domains must learn without removing code. Revisit if column reorder/resize, grouping or client-side sorting becomes a requirement. |
| Mantine React Table / AG Grid / data grids          | **Reject**                                                               | Grid widgets with roving focus fight the reference-table model, are heavy, and are hard to theme to the density targets.                                                                                                                                                                                                               |
| Virtualisation (TanStack Virtual etc.)              | **Avoid**                                                                | ≤ 100 rows per page. Virtualisation breaks sticky columns, find-in-page and SSR.                                                                                                                                                                                                                                                       |
| Mantine `Drawer`                                    | **Use** inside `FilterSheet`                                             | Focus trap, return focus, scroll lock, portal (legacy-proven).                                                                                                                                                                                                                                                                         |
| Mantine `Accordion` vs `Collapse`                   | `Collapse` + own disclosure button                                       | `FacetSection` needs a heading-level `<h2>`/`<h3>` with an indicator and local Clear. Accordion's control markup fights this, and independent sections are simpler with `Collapse`.                                                                                                                                                    |
| Mantine `Combobox`                                  | **Use** for searchable pickers                                           | Replaces the bespoke keyboard handling in `handleEquipmentOptionKeyboard`.                                                                                                                                                                                                                                                             |
| `@mantine/hooks` (`useMediaQuery`, `useDisclosure`) | **Use**                                                                  | `ResponsiveResults` trimming and disclosure state.                                                                                                                                                                                                                                                                                     |
| Icon set                                            | **Add `@phosphor-icons/react`** (legacy choice) or accept icons as props | Library components need about 8 glyphs (caret, X, sliders, arrows). Option A: depend on Phosphor. Option B: inline SVGs (a few lines each). **Recommend B** to keep the library dependency-light; domains keep Phosphor.                                                                                                               |
| `@storybook/addon-a11y`                             | **Add**                                                                  | Legacy standard: WCAG 2.2 AA at error severity. Every story becomes an a11y test via addon-vitest.                                                                                                                                                                                                                                     |
| CSS approach                                        | **CSS Modules + Mantine Styles API**                                     | Scoped, no global class collisions (legacy `:not(.maps-drawer-chip)` overrides show the cost). `postcss-preset-mantine` is already configured.                                                                                                                                                                                         |
| Visual regression                                   | **Vitest browser `toMatchScreenshot`, curated**                          | Runs in the existing Playwright container (deterministic fonts). No external service. About 12 screenshots, not every story. Chromatic rejected for now (cost, external dependency); a separate Playwright runner rejected (second test runner).                                                                                       |
| TanStack Router, Orama, zod, compiler               | **Never in the library**                                                 | App-only.                                                                                                                                                                                                                                                                                                                              |

---

## 8. Incremental implementation plan

Each milestone is one PR. All of them run `pnpm lint`, `pnpm check-types` and
`pnpm test` with zero a11y violations.

### M0 — Foundations (no browse components)

- **Theme:**
  - semantic CSS variables via `cssVariablesResolver`: `--mt-surface`,
    `--mt-row-hover`, `--mt-col-hover`, `--mt-col-sorted`,
    `--mt-col-emphasis`, `--mt-sticky-surface`, `--mt-focus`, `--mt-sticky-top`,
    `--mt-rail-width`, density spacing;
  - breakpoints `sm: 48em`, `lg: 80em`.
  - Light and dark values (see open question B4).
- Add `@storybook/addon-a11y` (error severity), Storybook viewports
  (`compact` 375×812, `narrow` 320×640, `medium` 1024×768, `wide` 1440×900),
  and `LinkProvider` with a test that a custom link component receives `href`.
- **Spike** (documented in the PR):
  - confirm addon-vitest honours story viewport globals (fallback:
    `page.viewport()` in `play`);
  - confirm `toMatchScreenshot` works in the CI container.
- Remove `Stub.stories.tsx`.
- **Acceptance:** a token story renders both schemes; an intentionally broken
  story fails a11y; the viewport and screenshot spike results are recorded.

### M1 — Result scaffolding (NPC-shaped browse)

- `BrowseLayout` (no rail yet), `ResultSummary`, `Pagination`, `BrowseStatus`,
  `SearchField` + `useSearchDraft`, `ResultList` (list), `StatValue`.
- **Stories:** `Browse/Simple` with 0, 1, 50 and 1 284 results; loading;
  error with retry; unavailable; empty with recovery.
- **Tests:**
  - typing "sn" calls `onCommit('sn','replace')` once after 250 ms;
  - Enter calls `push` immediately and cancels the timer;
  - an external value change resyncs the draft;
  - Previous on page 1 is not a link;
  - Next has `href` from `getHref(2)`;
  - an unmodified click calls the LinkProvider component and a modified click
    does not intercept;
  - the summary live region text changes once per committed result.
- **Acceptance:** no props mention a domain; 320 px has no horizontal overflow.

### M2 — `ComparisonTable` core

- Native table, caption, row header, sortable header links with `aria-sort`,
  alignment, `StatValue` integration, delegated row and column hover and focus,
  sorted and emphasised column, viewport-sticky header in fits mode.
- **Stories:** `ComparisonTable/Default`, `/LongNames`, `/UnknownAndZero`,
  `/Emphasized`, `/SortedDescending`, `/Density`, `/ForcedColors` (manual
  review note).
- **Tests:**
  - exactly one `th[aria-sort!="none"]`;
  - header link names ("EXP, sort descending");
  - hover over cell (r3, c4) sets `data-hover` on `col[4]` and `th[4]`;
  - `focusin` on a link in column 2 moves `data-hover` to column 2;
  - **row hover renders zero React commits** (React Profiler `onRender` count
    unchanged);
  - unknown renders "—" with an accessible "Unknown", and 0 renders "0".

### M3 — Overflow, sticky identity, column choice, row detail

- Overflow mode (bounded region, focusable, labelled, edge shadows), sticky
  identity column, `ColumnChooser`, `renderRowDetail` with Escape and focus
  return.
- **Stories:** `/Overflow` at the `medium` viewport, `/ManyColumns`,
  `/ColumnChooser`, `/RowDetail`, `/Perf100x12`.
- **Tests:**
  - at 1024 px with 11 columns the region has `tabindex=0` and its name, while
    at 1440 px with 6 columns it does not;
  - ArrowRight on the focused region increases `scrollLeft`;
  - the identity cell's `getBoundingClientRect().left` stays constant while
    scrolled;
  - unchecking a column removes its `<col>`, `<th>` and cells, and re-checking
    restores the original position;
  - the last visible data column cannot be unchecked;
  - Escape closes the detail and focus returns to the opener;
  - `/Perf100x12` initial render stays under a budget measured in M3 and
    recorded as a regression guard.

### M4 — Rail and facets

- `BrowseLayout` rail (wide open, medium collapsed with inline toggle),
  `FacetSection`, `FacetOptionList` (checkbox and radio, counts,
  `countsPending`, show more), `RangeFilter` (commit and change modes,
  validation), `DisclosureTree`, `NavList`, `ActiveFilters`/`FilterChip`.
- **Stories:** `Rail/Wide`, `Rail/MediumCollapsed`, `FacetOptionList/Counts`,
  `/CountsPending`, `/ZeroCounts`, `RangeFilter/Invalid`,
  `DisclosureTree/Links`, `/RadioSelection`, `ActiveFilters/Many`.
- **Tests:**
  - range: min 50 / max 10 shows the error and never calls `onCommit`;
  - range: Enter commits once and blur after Enter does not commit again;
  - pending counts keep their previous numbers with `data-pending`;
  - disclosure buttons expose `aria-expanded` and the controlled region;
  - the current tree link has `aria-current="page"`;
  - chip remove button names are "Remove Level 30–40";
  - Clear all appears only with ≥ 2 chips;
  - the medium rail toggle has `aria-expanded` and keeps focus after toggling.

### M5 — Mobile

- `QuickFilters`, `FilterSheet` (+ `NavRow`, `Screen`), `useFilterSheet`,
  `useStagedCount`, `useVisualViewportFit`, `ResultCard`, `StatGrid`,
  `ResponsiveResults`, `SortSelect`.
- **Stories (compact viewport):** `FilterSheet/Overview`, `/NestedScreen`,
  `/InvalidDraft`, `/CountPending`, `/KeyboardOpen` (simulated
  `visualViewport`), `QuickFilters/Overflowing`, `ResultCard/Variants`,
  `ResponsiveResults/BothBreakpoints`.
- **Tests:**
  - open → push(level) → back() returns true and back() at root returns false;
  - Cancel restores the committed draft;
  - `commit()` returns the draft once and closes;
  - a changed `committed` prop while open closes and discards;
  - focus moves to the title on open and on each screen change, and returns to
    the opener chip on close;
  - Escape at depth 2 pops, Escape at root closes;
  - the Apply label switches "Show results" → "Show 214 monsters" when the
    staged count resolves, and a late count for an old key is ignored (port the
    legacy `useStagedResultCount` tests);
  - `ResponsiveResults` renders both variants before mount effects, and after
    mount only the matching one is in the accessibility tree;
  - at 320 px there is no horizontal scroll and the footer buttons stack.

### M6 — Reference compositions and visual baselines

- `examples/MonsterLike`, `MapLike` and `ItemLike` stories built **only from
  public exports**, with deterministic fixtures (§9).
- Curated `toMatchScreenshot` baselines: table wide (light and dark), table
  overflow medium, emphasised and hovered intersection, rail with counts, cards
  compact, sheet overview and nested, empty state.
- **Acceptance:**
  - all three compositions build without private imports or library changes
    other than bug fixes;
  - every prop added during M6 is justified in the PR by at least two of the
    three compositions;
  - screenshot diffs fail CI.

### M7 — App integration (after an app package exists; outside this library)

- `LinkProvider` via TanStack `createLink`; `useSheetHistory` (transient entry
  and replace-on-apply); domain codecs that stay compatible with legacy URLs
  (fixture-driven round-trip tests from legacy `validate*Search`).
- **Migration order:**
  1. NPCs (smallest; validates the scaffolding);
  2. Monsters (flagship; validates the table and sheet);
  3. Maps (navigation + cards);
  4. Items (contextual tables);
  5. Quests;
  6. Equipment (largest redesign: rail adoption).
- **App tests:**
  - with history `[A]`, open the sheet, Back closes it with history `[A]`;
  - open, push, Back, Back gives screen root then closed;
  - open, Apply gives history `[A][B]`, and Back lands on A with the sheet
    closed;
  - a build switch while open closes the sheet and drops the draft.

---

## 9. Storybook plan

- **Titles:** `Browse/<Component>/<Variant>` for components,
  `Browse/Examples/<Composition>` for references.
- **Fixtures:** `src/browse/__fixtures__/` with seeded, hand-written records:
  - "creatures" with level/HP/EXP/stats, including unknowns, zero, a 60-char
    name and a missing sprite;
  - "places" as a 3-level tree with counts and an empty branch;
  - "goods" with three comparison contexts.
  - No compiled artifacts, no real asset URLs (inline SVG placeholders), no
    `Math.random`/`Date`.
  - Fixtures are **not exported**, so game knowledge never leaves stories.
- **Controls:** examples keep URL-like state in a story-local
  `useState<Query>`, with a fake `getHref` that encodes the query as `?…`. A
  LinkProvider decorator logs navigations to the Actions panel and applies
  them, which makes stories interactive end to end.
- **Variants per component:** default, dense, long content, unknown/zero, empty,
  loading, error, compact/narrow/medium/wide viewports, dark/light,
  `forced-colors` (manual checklist; Chromium emulation in a `play` where
  feasible).
- **Representative interaction stories (with `play`):**
  - `Examples/MonsterLike/SortByExp`: click the EXP header; the URL action
    shows `sort=exp-desc` and the caption updates.
  - `Examples/MonsterLike/ColumnHighlight`: hover the HP cell in row 5; the HP
    column and row 5 are highlighted and the screenshot shows the intersection.
  - `Examples/MonsterLike/MobileStagedFilter`: compact viewport. Tap Level, pick
    two bands, see "Show N", Apply. Chips appear and focus lands on the results
    heading.
  - `Examples/MapLike/NavigateRegion`: expand Region, click Area; navigation is
    logged and the sheet closes on compact.
  - `Examples/ItemLike/ContextualComparison`: select the "Upgrade scroll"
    facet; the results switch from list to the comparison table with its own
    columns.
  - `BrowseStatus/EmptyWithRecovery`: the recovery button is the first
    focusable element after the heading.

---

## 10. Risks and adversarial review

| Risk                                                                                                                        | Severity | Mitigation                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overengineering:** about 20 exports designed before any app consumes them                                                 | High     | M6 gate: props must be needed by ≥ 2 reference compositions. Cut list: `NavList`, `SortSelect` and `ColumnChooser` may stay app-local if the compositions do not need them.  |
| **`ComparisonTable` prop creep** into a data grid (filters in headers, resize, reorder, grouping, selection)                | High     | Written non-goals in the component docs. New props require a domain story. Selection, if ever needed, is a domain cell.                                                      |
| **Abstraction leakage:** game nouns or Monster-shaped props (e.g. `highlight`) appear in library APIs                       | Med      | Lint rule (`no-restricted-syntax` on identifiers like `monster`, `item`, `build`) in `src/browse/**`. Neutral names (`emphasizedColumnId`).                                  |
| **Fixture realism vs leakage:** example stories look like MapleStory                                                        | Low      | Fixtures stay unexported; examples are documentation, not API.                                                                                                               |
| **Overflow-mode nested scroll** on `medium`: double scrollbars, trackpad scroll-chaining, iOS sticky quirks inside overflow | Med      | `overscroll-behavior: contain` on the region. Test on Safari via the Playwright WebKit project in M3 (one extra browser instance for that file only).                        |
| **Column highlight via `<col>`** interacts with opaque sticky cells and forced colors                                       | Med      | Sticky cells compute their own blended background from the same tokens. Forced-colors fallback outlines. Screenshot coverage.                                                |
| **Both-variant SSR render** doubles the HTML for the first paint                                                            | Low–Med  | Only if the app is SSR (open question B1). Cards are lighter than rows. Measure in M7.                                                                                       |
| **Back semantics depend on the router** and cannot be fully tested in the library                                           | Med      | Library tests cover the controller; M7 owns the history tests listed above. The adapter is about 60 lines, ported from the proven legacy hook with the replace-on-apply fix. |
| **Live-region noise** from counts and results                                                                               | Med      | One live region (summary), updated on commit only. Staged counts appear only in the Apply label.                                                                             |
| **Links in `<th>`** make some screen readers verbose                                                                        | Low      | Short link names; `aria-sort` carries the state; NVDA/VoiceOver smoke check in the M2 checklist.                                                                             |
| **Migration URL breakage** (page base, sort tokens, interval encodings, legacy band ids)                                    | High     | Domain codecs keep legacy parsing. Round-trip fixture tests from legacy validators. `replace`-normalise non-canonical URLs, as legacy does.                                  |
| **IA spec conflicts:** T02 pixel targets and "no sticky rail" vs generic tokens                                             | Med      | Tokens default to the T02 values. Domains may override track widths via `column.width`. Conflicts get recorded against the spec rather than silently diverging.              |
| **Mantine 9 API drift** (Table sticky props, Drawer composition)                                                            | Low      | Confirm in M2/M5. Wrap behind our component, never re-export Mantine props wholesale.                                                                                        |
| **Visual regression maintenance** (font or Chromium bumps cause churn)                                                      | Med      | About 12 curated shots, baselines only from the pinned container, an update script, and Renovate grouping for the Playwright pin.                                            |

What this plan deliberately does **not** do:

- a schema-driven facet DSL;
- a query-state framework;
- a `<FacetedBrowser>` monolith;
- a generic URL codec in the library;
- virtualisation;
- column reordering and resizing;
- a separate Storybook app or browse package.

A new package would add versioning and build steps without an independent
consumer, so it is not justified.

---

## 11. Open questions and decisions

### Blockers (needed before the milestone named)

| #   | Question                                                                                                                                                                                                               | Blocks                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| B1  | **Rendering model of the new app:** SPA (like legacy), SSG, or SSR? This decides whether `ResponsiveResults` needs the dual first render and how the history adapter is written.                                       | M5 (`ResponsiveResults` details), M7 |
| B2  | **Breakpoints:** confirm 768 px (cards ↔ table) and 1280 px (persistent rail), with medium collapsed-by-default. Legacy Monsters opened the rail from 1024 px.                                                         | M4 CSS, M5                           |
| B3  | **Does `legacy:docs/ux/ia-component-spec.md` carry over as product truth?** If yes, it should be copied or linked into this repo, and T02's detailed contract becomes acceptance criteria for the Monster composition. | M6                                   |
| B4  | **Colour schemes:** legacy forces dark (`forceColorScheme="dark"`); the new Storybook has a light/dark toggle. Dark-only, or both?                                                                                     | M0 token values                      |

### Non-blocking (resolve during implementation)

- Page-size options per domain (recommend fixed 50; Monsters 100).
- Icons: inline SVG in the library (recommended) vs a Phosphor dependency.
- Mobile sheet edge: full-height bottom sheet (recommended) vs right drawer.
- Column visibility persistence scope: per domain vs per domain+build
  (recommend per domain).
- Quests: grouped list (current) vs a table with T10's six default fields on
  desktop.
- Equipment rail adoption timing and the compare-tray pattern (separate future
  design).
- Whether `SortSelect` on mobile is enough, or domains with many sorts need a
  Sort sheet screen.
- Whether the Monster "View N results" jump earns promotion after a second
  domain asks for it.
