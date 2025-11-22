import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

const createMatchMedia = (matches = false) => ({
  matches,
  media: '',
  onchange: null,
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => createMatchMedia(false)),
});
