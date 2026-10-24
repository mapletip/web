# Faceted Browser reference implementation (spike, not production)

A **verified, self-contained working example** for the `add-faceted-browser` OpenSpec change (store `mapletip`, repository `https://gitlab.com/mapletip/specs`). It lives in this spike branch so the spec can stay a spec and point here. It is not exported from the package, and the implementation PR starts from `main`: port from these files, do not merge this branch. The OpenSpec change governs wherever it differs.

## Verification

- Browser tests (`monster-page.test.tsx`, `hydration.test.tsx`): 20 tests on Chromium, Firefox and WebKit, 60 passing runs.
- Node server render (`monster-page.ssr.test.tsx`, the `ssr` Vitest project): passes with `window` undefined (about 266 KB of HTML for 100 rows plus the cards).
- Passed from a deleted Vite cache with a Vitest config whose `optimizeDeps.include` lists only `mantine-datatable`, `react-dom/client` and `react-dom/server` (this branch's `vitest.config.ts` also lists the AG Grid and TanStack spike dependencies, which are not needed here).
- ESLint with zero warnings, `tsc` and Prettier clean.

Not covered: Storybook stories, the accessibility addon, Map-like and Item-like compositions, column visibility, the forced-colors test (see `../semantic-table/forcedColors.test.tsx` and `../semantic-table/commands.d.ts`), the Chromium accessibility-tree check, and every manual gate.

## Files

| File                                                                          | Purpose                                                                                                                                        |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `ComparisonSortHeader.tsx` + `comparison-sort-header.module.css`              | Native sort button: label, hidden abbreviation expansion, announced sort state                                                                 |
| `comparison-table.module.css` + `comparison-table.ts`                         | Shared DataTable styling; `comparisonTableClasses` and `comparisonTableMaxHeight`                                                              |
| `FacetedBrowser.tsx` + `faceted-browser.module.css`                           | Slot layout with CSS-only table/cards switching                                                                                                |
| `FacetedBrowserFilterDrawer.tsx` + `faceted-browser-filter-drawer.module.css` | Staged drawer chrome                                                                                                                           |
| `support/MonsterPage.tsx`                                                     | A complete Monster-like composition (DataTable columns, sort state, cards, rail, quick facets, drawer with a draft and an invalid range)       |
| `support/{fixtures.ts,columns.ts,cells.tsx,cells.module.css}`                 | Deterministic fixtures and domain cells                                                                                                        |
| `monster-page.test.tsx`                                                       | Width matrix, header semantics, sorting by click, Enter and Space, highlighting, sorted tint, focus outline, bounded height, drawer behaviours |
| `monster-page.ssr.test.tsx`                                                   | Node server-render test                                                                                                                        |
| `hydration.test.tsx`                                                          | `renderToString` then `hydrateRoot` with error capture and layout rectangles                                                                   |

## Notes for the port

- Put `@import 'mantine-datatable/styles.css';` in `src/styles.css` (verified in a Vite build) instead of importing it from `support/MonsterPage.tsx`.
- `support/` is story-support code and must not be exported.
- Tests set `data-mantine-color-scheme` on `<html>` in `beforeEach`; without it DataTable cells are transparent and borders pop in.
- Playwright cannot hover a `<th>` (hover its button); the drawer slides in over 250 ms (wait before measuring its footer); unsorted DataTable cells are opaque with the color scheme attribute set, so the sorted tint is asserted by its alpha (0.08).
