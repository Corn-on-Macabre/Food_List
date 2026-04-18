import '@testing-library/jest-dom';

// jsdom does not implement ResizeObserver — provide a minimal stub for components that use it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void { /* noop */ }
    unobserve(): void { /* noop */ }
    disconnect(): void { /* noop */ }
  };
}
