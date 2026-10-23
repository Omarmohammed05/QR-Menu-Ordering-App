import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "coverage/**",
      "next-env.d.ts",
      "src/server/db/migrations/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Spec 17: no console.log in src. Pino is the only logging path (Phase 1+).
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];

export default eslintConfig;
