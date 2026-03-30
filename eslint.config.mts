import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js, "@stylistic": stylistic },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@typescript-eslint/no-explicit-any": ["error"],
      "@typescript-eslint/strict-boolean-expressions": "off",
    },
  },
  tseslint.configs.recommended,
  globalIgnores(["dist/*"]),
]);
