import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "playwright-report/**",
      "test-results/**",
      "public/**",
      "coverage/**",
      "evals/**",
      "poa-engine/**",
      "drizzle/**",
    ],
  },
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default eslintConfig;
