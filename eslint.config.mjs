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
    // Open LLM VTuber Web wrapper is vendored upstream code. Keep it isolated
    // so Snow-owned lint remains strict without rewriting the companion app.
    "src/vtuber-app/**",
  ]),
]);

export default eslintConfig;
