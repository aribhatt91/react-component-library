// jest.setup.js
import '@testing-library/jest-dom';

// Suppress console errors in tests for cleaner output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};