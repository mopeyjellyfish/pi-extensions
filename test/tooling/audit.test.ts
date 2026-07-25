import { describe, expect, it } from "vitest";

import { isExpectedPiDevelopmentAdvisory } from "../../scripts/audit.ts";

const piNode = "node_modules/@earendil-works/pi-coding-agent/node_modules/brace-expansion";

function report(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    vulnerabilities: {
      "brace-expansion": {
        fixAvailable: true,
        isDirect: false,
        nodes: [piNode, "node_modules/brace-expansion"],
        range: "<=5.0.7",
        severity: "high",
        via: [
          {
            name: "brace-expansion",
            severity: "high",
            url: "https://github.com/advisories/GHSA-mh99-v99m-4gvg",
          },
        ],
        ...overrides,
      },
    },
  };
}

describe("temporary Pi audit exception", () => {
  it("allows only the exact development-only upstream advisory", () => {
    expect.hasAssertions();
    expect(isExpectedPiDevelopmentAdvisory(report())).toBe(true);
  });

  it("rejects the advisory outside Pi's development dependency paths", () => {
    expect.hasAssertions();
    expect(
      isExpectedPiDevelopmentAdvisory(report({ nodes: ["node_modules/brace-expansion"] })),
    ).toBe(false);
  });

  it("rejects changed advisory metadata", () => {
    expect.hasAssertions();
    expect(
      isExpectedPiDevelopmentAdvisory(
        report({
          via: [
            {
              name: "brace-expansion",
              severity: "high",
              url: "https://example.test/different-advisory",
            },
          ],
        }),
      ),
    ).toBe(false);
  });

  it("rejects every additional high or critical vulnerability", () => {
    expect.hasAssertions();
    const value = report();
    const vulnerabilities = value["vulnerabilities"] as Record<string, unknown>;
    vulnerabilities["unexpected"] = { severity: "critical" };
    expect(isExpectedPiDevelopmentAdvisory(value)).toBe(false);
  });
});
