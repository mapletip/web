import '@testing-library/jest-dom/vitest';

// This project runs with Vitest globals enabled, so React Testing Library
// registers its own `afterEach(cleanup)` when it is first imported.

// jsdom implements neither media queries nor layout observation. Mantine reads
// media queries for responsive props and DataTable registers a ResizeObserver;
// these stand-ins report "no match / nothing observed" so component tests can
// assert semantics without pretending to measure geometry.
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

if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
