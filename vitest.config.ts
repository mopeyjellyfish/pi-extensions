import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/tooling/**/*.test.ts", "packages/*/test/**/*.test.ts"],
    passWithNoTests: false,
    testTimeout: 20_000,
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.d.ts"],
      reporter: ["text", "json-summary", "lcov"],
      thresholds: {
        perFile: true,
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
