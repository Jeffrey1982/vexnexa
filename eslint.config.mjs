import nextVitals from 'eslint-config-next/core-web-vitals';

export default [
  {
    ignores: [
      '.claude/**', '.next/**', '.vercel/**', 'node_modules/**',
      'coverage/**', 'playwright-report/**', 'test-results/**',
      // Historical SaaS source is not part of the studio application.
      'src/**', 'e2e/**', 'test/**',
    ],
  },
  ...nextVitals,
];
