import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: [
      'node_modules',
      '.next',
      'e2e/**',
      '.claude/**',
      'src/**/*.test.ts.quarantined',
    ],
    setupFiles: ['./test/setup.ts'],
    environmentMatchGlobs: [
      ['src/components/**/*.test.tsx', 'jsdom'],
      ['src/app/**/*.test.tsx', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/**/*.{ts,tsx}',
        'src/app/api/**/*.{ts,tsx}',
        'src/middleware.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**',
        '**/*.d.ts',
        'src/lib/prisma.ts',
        'src/lib/supabase.ts',
        'src/lib/supabaseAdmin.ts',
      ],
      thresholds: {
        // Start conservative; ratchet up as tests are added.
        lines: 25,
        statements: 25,
        functions: 25,
        branches: 55,
      },
    },
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
