import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
    "reference/**",
    // Separate deployable service with its own package.json/node_modules,
    // not part of this Next.js app -- see tsconfig.json's exclude for the
    // same reasoning. Its Remotion render-loop code (e.g. a local `let
    // cursor` mutated while mapping beats to <Sequence>) isn't a React
    // component in the Rules-of-Hooks sense the Next.js config assumes.
    "video-renderer/**",
  ]),
]);

export default eslintConfig;
