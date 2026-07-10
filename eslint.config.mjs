import eslint from "@eslint/js";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import vitest from "@vitest/eslint-plugin";
import configPrettier from "eslint-config-prettier";
import importX from "eslint-plugin-import-x";
import regexp from "eslint-plugin-regexp";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

const typedFiles = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"];
const javascriptFiles = ["**/*.js", "**/*.mjs", "**/*.cjs"];
const testFiles = ["**/test/**/*.ts", "**/*.test.ts", "**/*.spec.ts"];

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/coverage/**",
      "**/dist/**",
      "**/.pi-subagents/**",
      "**/*.tgz",
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },
  {
    ...eslint.configs.recommended,
    files: [...typedFiles, ...javascriptFiles],
  },
  ...tseslint.configs.strictTypeChecked.map((config) => ({ ...config, files: typedFiles })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({ ...config, files: typedFiles })),
  {
    ...importX.flatConfigs.recommended,
    files: [...typedFiles, ...javascriptFiles],
  },
  {
    ...importX.flatConfigs.typescript,
    files: typedFiles,
  },
  {
    ...regexp.configs["flat/recommended"],
    files: [...typedFiles, ...javascriptFiles],
  },
  {
    ...unicorn.configs.unopinionated,
    files: [...typedFiles, ...javascriptFiles],
  },
  {
    files: [...typedFiles, ...javascriptFiles],
    rules: {
      "import-x/no-named-as-default": "off",
      "import-x/no-named-as-default-member": "off",
      "unicorn/import-style": "off",
      "unicorn/no-array-sort": "off",
      "unicorn/prefer-string-raw": "off",
    },
  },
  {
    files: typedFiles,
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@eslint-community/eslint-comments": eslintComments,
    },
    settings: {
      "import-x/resolver": {
        typescript: {
          project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
        },
        node: true,
      },
    },
    rules: {
      ...eslintComments.configs.recommended.rules,
      "@eslint-community/eslint-comments/require-description": ["error", { ignore: [] }],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { disallowTypeAnnotations: false, fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { allowDefaultCaseForExhaustiveSwitch: false, considerDefaultExhaustiveForUnions: false },
      ],
      complexity: ["error", 15],
      "import-x/first": "error",
      "import-x/newline-after-import": "error",
      "import-x/no-cycle": ["error", { ignoreExternal: true }],
      "import-x/no-duplicates": "error",
      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/test/**",
            "**/*.test.ts",
            "**/*.spec.ts",
            "**/*.config.ts",
            "scripts/**",
          ],
          optionalDependencies: false,
        },
      ],
      "import-x/no-mutable-exports": "error",
      "import-x/order": [
        "error",
        {
          alphabetize: { caseInsensitive: true, order: "asc" },
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"], "type"],
          "newlines-between": "always",
        },
      ],
      "max-depth": ["error", 4],
      "no-warning-comments": ["error", { location: "anywhere", terms: ["fixme", "todo"] }],
      "unicorn/prefer-node-protocol": "error",
    },
  },
  {
    files: javascriptFiles,
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: testFiles,
    ...vitest.configs.recommended,
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/consistent-test-it": ["error", { fn: "it", withinDescribe: "it" }],
      "vitest/no-disabled-tests": "error",
      "vitest/no-focused-tests": "error",
      "vitest/no-standalone-expect": "error",
      "vitest/prefer-expect-assertions": "error",
    },
  },
  {
    files: ["packages/*/src/**/*.ts"],
    rules: {
      "no-console": "error",
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "stdout",
          message: "Pi extensions must not write to stdout because it corrupts JSON and RPC modes.",
        },
      ],
    },
  },
  configPrettier,
);
