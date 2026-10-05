import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Herramientas locales de desarrollo (seeds, reportes). Está gitignorado y
    // corre con node directo, así que las reglas del bundle no aplican.
    ".gstack/**",
  ]),
]);

export default eslintConfig;
