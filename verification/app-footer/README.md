# App Footer verification captures

Review artifacts for the `feat/app-footer` integration. Captures use the production build.

- `monster-before-*`: untouched `origin/main` at `74eeaedb`.
- `monster-after-*`: this branch.
- All viewports report `scrollWidth === clientWidth`; no horizontal overflow.

Desktop Monster comparison table at 1366×768:

| State  | Main height | Table viewport | Table content | Footer top |
| ------ | ----------- | -------------- | ------------- | ---------- |
| Before | 704 px      | 488 px         | 1013 px       | —          |
| After  | 704 px      | 488 px         | 1013 px       | 768 px     |

The Footer begins exactly below the 100dvh Header + Monster region; the comparison table keeps its independent scroll area. At 992×768 and 1920×1080 the same before/after table viewport values hold (452 px and 800 px).

Short Home pages end with the Footer at the viewport bottom at 768 px and wider. At 320/375 px the footer is taller than the viewport and the document scrolls naturally. Long Privacy pages scroll naturally.
