import js from "@eslint/js";
import jest from "eslint-plugin-jest";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      ".playwright-mcp/**",
    ],
  },
  js.configs.recommended,
  jest.configs["flat/recommended"],
  ...nextCoreWebVitals,
  prettier,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      // react-hooks v7 (via eslint-config-next 16) promove esta regra a error;
      // os 4 casos existentes (hydration guard, fetch-em-effect) ficam para refactor próprio.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
