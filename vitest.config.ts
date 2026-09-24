import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
    environment: 'node',
    // Former SaaS source is retained as an archive, not a deployed app.
    include: ['studio/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}', 'proxy.test.ts'],
    exclude: ['node_modules', '.next', 'studio/e2e/**', 'src/**', 'e2e/**', 'test/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['app/**/*.{ts,tsx}', 'studio/**/*.{ts,tsx}', 'proxy.ts'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'studio/e2e/**', '**/*.d.ts'],
      // Existing minimums are preserved; all active studio source is included.
      thresholds: { lines: 25, statements: 25, functions: 25, branches: 55 },
    },
    testTimeout: 10_000,
  },
  resolve: { alias: { '@studio': path.resolve(__dirname, './studio') } },
})
