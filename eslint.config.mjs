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
      // Spec 17: no console.log in src. Pino is the only logging path.
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // Spec 3.2: tenant tables are queryable ONLY through the scoped repos.
    // src/server/auth/index.ts is exempt: the Better Auth drizzle adapter is
    // handed the schema object as wiring, it never queries tenant tables itself.
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "src/server/repos/**",
      "src/server/db/**",
      "tests/**",
      "src/server/auth/index.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/server/db/tenant-tables",
              message:
                "Tenant tables are only queryable via src/server/repos (createRestaurantRepo / platform repos).",
            },
            {
              name: "@/server/db/schema",
              importNames: ["restaurants", "restaurantMembers", "invitations"],
              message:
                "Tenant tables are only queryable via src/server/repos (createRestaurantRepo / platform repos).",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
