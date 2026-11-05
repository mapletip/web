import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// React Testing Library registers its own cleanup only when a global `afterEach`
// exists; this project keeps Vitest globals off, so it is wired explicitly.
afterEach(cleanup);

// jsdom implements no media queries, and Mantine reads them for responsive
// props. The suite asserts semantics, not layout, so every query reports "no
// match"; real layout behavior belongs to the component library's browser and
// visual suites.
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  });
}

// jsdom has no layout, so it ships no ResizeObserver; the table registers one to
// track column widths. The suite asserts semantics, not measured widths.
if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
