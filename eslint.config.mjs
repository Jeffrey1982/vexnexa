import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      ".claude/**",
      ".next/**",
      ".vercel/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "temp.json",
      "src/lib/axe-source.ts",
      "src/lib/axe-unminified.js",
    ],
  },
  ...nextVitals,
  {
    rules: {
      "react-hooks/error-boundaries": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];
