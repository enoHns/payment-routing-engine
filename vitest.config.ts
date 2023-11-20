import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    include:     ['tests/**/*.test.ts'],
    setupFiles:  ['./tests/setup.ts'],
    coverage: {
      provider:  'v8',
      reporter:  ['text', 'lcov', 'html'],
      exclude:   ['**/node_modules/**', '**/dist/**', '**/tests/**'],
      thresholds: {
        lines:      70,
        functions:  70,
        branches:   60,
        statements: 70,
      },
    },
  },
});
