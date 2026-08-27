import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");

describe("Go skill package", () => {
  it("discovers the Go skill through its independent package manifest", async () => {
    expect.hasAssertions();
    const [manifestText, skill] = await Promise.all([
      readFile(join(PACKAGE_ROOT, "package.json"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "go", "SKILL.md"), "utf8"),
    ]);
    const manifest = JSON.parse(manifestText) as {
      name?: unknown;
      pi?: { extensions?: unknown; skills?: unknown };
    };

    expect(manifest.name).toBe("@mopeyjellyfish/pi-go");
    expect(manifest.pi?.skills).toEqual(["./skills"]);
    expect(manifest.pi?.extensions).toBeUndefined();
    expect(skill).toMatch(/^---\nname: go\ndescription:/u);
    expect(skill).toMatch(/Use whenever Go code is written/u);
  });
  it("discovers Cobra and Viper CLI guidance with isolated command factories", async () => {
    expect.hasAssertions();
    const skill = await readFile(join(PACKAGE_ROOT, "skills", "cobra-viper", "SKILL.md"), "utf8");

    expect(skill).toMatch(/^---\nname: cobra-viper\ndescription:/u);
    expect(skill).toMatch(
      /Use whenever a Go CLI or command-line tool is being built, reviewed, or refactored/u,
    );
    expect(skill).toContain("NewRootCmd()");
    expect(skill).toContain("viper.New()");
    expect(skill).toContain("BindPFlags(cmd.Flags())");
    expect(skill).toContain("fresh tree + fresh Viper every test");
  });
  it("discovers pre-implementation Go specification review guidance", async () => {
    expect.hasAssertions();
    const skill = await readFile(
      join(PACKAGE_ROOT, "skills", "go-spec-reviewer", "SKILL.md"),
      "utf8",
    );

    expect(skill).toMatch(/^---\nname: go-spec-reviewer\ndescription:/u);
    expect(skill).toContain("before implementation begins");
    expect(skill).toContain("### Step 0 — Load the Standards");
    expect(skill).toContain("## Go Spec Review");
    expect(skill).toContain("**Status:** Approved | Approved with Questions | Issues Found");
  });
  it("recommends Testify assertions with concise table-driven test names", async () => {
    expect.hasAssertions();
    const skill = await readFile(join(PACKAGE_ROOT, "skills", "go", "SKILL.md"), "utf8");
    const testingPatterns = /## Testing Patterns\n([\s\S]*?)(?=\n## |$)/u.exec(skill)?.[1];

    expect(testingPatterns).toContain("https://github.com/stretchr/testify");
    expect(testingPatterns).toContain("require.NoError(t, err)");
    expect(testingPatterns).toContain("assert.Equal(t, tt.want, got)");
    expect(testingPatterns).not.toContain("go-cmp");
    expect(testingPatterns).toContain(
      "TestThatThisThingWorksWhenSomethingGoesWrongOneTuesdayInMay",
    );
    expect(testingPatterns).toContain("TestThingWorks");
    expect(testingPatterns).toContain("Table-driven subtests are the Go unit-testing standard.");
    expect(testingPatterns).toContain(`import (
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)`);
    expect(testingPatterns).toContain('"Tuesday, May 6, 2025"');
    expect(testingPatterns).toContain('"Thursday, February 29, 2024"');
    expect(testingPatterns).toMatch(/days, months, years/u);
  });
  it("explains when and how to use functional options", async () => {
    expect.hasAssertions();
    const skill = await readFile(join(PACKAGE_ROOT, "skills", "go", "SKILL.md"), "utf8");
    const functionalOptions = /### Functional Options[\s\S]*?(?=\n## |$)/u.exec(skill)?.[0];

    expect(functionalOptions).toContain("Do not use functional options by default.");
    expect(functionalOptions).toContain("Use ordinary parameters when");
    expect(functionalOptions).toContain("Use a configuration struct when");
    expect(functionalOptions).toContain("Use functional options when");
    expect(functionalOptions).toContain("type Option func(*serverConfig) error");
    expect(functionalOptions).toContain(
      "func NewServer(addr string, opts ...Option) (*Server, error)",
    );
    expect(functionalOptions).toMatch(/duplicate options/u);
    expect(functionalOptions).toMatch(/applied in call order/u);
    expect(functionalOptions).toContain("https://go.dev/blog/module-compatibility");
    expect(functionalOptions).toContain("https://go.dev/blog/context-and-structs");
    expect(functionalOptions).toContain("First-party guidance includes the Go project and Google");
    expect(functionalOptions).toContain("Go co-creator Rob Pike");
    expect(functionalOptions).toContain("Steve Francia");
    expect(functionalOptions).toContain(
      "https://google.github.io/styleguide/go/best-practices.html#options",
    );
    expect(functionalOptions).toContain(
      "https://cloud.google.com/blog/products/gcp/go-1-18-and-google-cloud-go-now-with-google-cloud",
    );
    expect(functionalOptions).toContain("third-party language tutorial");
    expect(functionalOptions).not.toContain("dave.cheney.net");
    expect(functionalOptions).toContain("https://github.com/spf13/viper/blob/master/viper.go");
    expect(functionalOptions).toContain("https://gobyexample.com/variadic-functions");
  });
});
