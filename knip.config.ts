import type { KnipConfig } from "knip";

const config = {
  ignoreFiles: [".markdownlint-cli2.mjs"],
  workspaces: {
    ".": {
      entry: ["scripts/*.ts", "test/tooling/**/*.test.ts"],
      project: ["scripts/**/*.ts", "test/tooling/**/*.ts"],
    },
    "packages/*": {
      entry: ["src/index.ts", "test/**/*.test.ts"],
      project: ["src/**/*.ts", "test/**/*.ts"],
    },
    "test/fixtures/minimal-extension": {
      entry: ["src/index.ts"],
      project: ["src/**/*.ts"],
    },
  },
  ignoreBinaries: ["go", "taskkill", "zizmor"],
} satisfies KnipConfig;

export default config;
