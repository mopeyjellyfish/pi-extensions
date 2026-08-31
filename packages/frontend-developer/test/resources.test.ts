import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);

async function resource(path: string): Promise<string> {
  return readFile(new URL(path, root), "utf8");
}

async function markdownResources(directory: string): Promise<string[]> {
  const paths: string[] = [];
  async function walk(relative: string): Promise<void> {
    const entries = await readdir(new URL(`${relative}/`, root), { withFileTypes: true });
    for (const entry of entries) {
      const path = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith(".md")) paths.push(path);
    }
  }
  await walk(directory);
  return Promise.all(paths.map(resource));
}

async function directoryDigest(directory: string): Promise<string> {
  const files: string[] = [];
  async function walk(relative: string): Promise<void> {
    const entries = await readdir(new URL(`${directory}/${relative}`, root), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      const path = `${relative}${entry.name}`;
      if (entry.isDirectory()) await walk(`${path}/`);
      else files.push(path);
    }
  }
  await walk("");
  const digest = createHash("sha256");
  for (const file of files.sort((left, right) => left.localeCompare(right))) {
    digest.update(file);
    digest.update("\0");
    digest.update(await readFile(new URL(`${directory}/${file}`, root)));
    digest.update("\0");
  }
  return digest.digest("hex");
}

describe("design review resource contract", () => {
  it("requires compact image-backed, verified board feedback and lifecycle control for material design", async () => {
    expect.hasAssertions();
    const [prompt, frontendDesign, interfaceDesign, imageGeneration, visualValidation, readme] =
      await Promise.all([
        resource("prompts/design.md"),
        resource("skills/frontend-design/SKILL.md"),
        resource("skills/interface-design/SKILL.md"),
        resource("skills/image-generation/SKILL.md"),
        resource("skills/visual-validation/SKILL.md"),
        resource("README.md"),
      ]);
    expect(prompt).toMatch(/design_board[\s\S]*before asking for a visual choice/iu);
    expect(frontendDesign).toMatch(/mechanical[\s\S]*direct/iu);
    expect(interfaceDesign).toMatch(/at\s+most four/iu);
    expect(interfaceDesign).toMatch(/two to eight[\s\S]*image evidence/iu);
    expect(interfaceDesign).toMatch(
      /material direction[\s\S]*greenfield apps[\s\S]*major redesigns[\s\S]*unresolved visual[\s\S]*two to eight/iu,
    );
    expect(interfaceDesign).toMatch(
      /design_board[\s\S]*verif[\s\S]*URL[\s\S]*before requesting[\s\S]*feedback/iu,
    );
    expect(interfaceDesign).toMatch(/feedbackMode:[^\n]*cli[\s\S]*question/iu);
    expect(interfaceDesign).toMatch(
      /For image-backed CLI feedback,[^.]*question[^.]*presentation:\s*"inline"[^.]*below[^.]*\.[^.]*fallback\./iu,
    );
    expect(readme).toMatch(
      /For image-backed CLI feedback,[^.]*presentation:\s*"inline"[^.]*below[^.]*\.[^.]*fallback\./iu,
    );
    expect(interfaceDesign).toMatch(/separate target-owned live-site\s+URL/iu);
    expect(interfaceDesign).toMatch(/milestone[\s\S]*same\s+`design_board`/iu);
    expect(interfaceDesign).toMatch(/open[\s\S]*keep serving[\s\S]*close/iu);
    expect(imageGeneration).toMatch(/explicit consent/iu);
    expect(visualValidation).toMatch(/unmet proof/iu);
    expect(readme).toMatch(/board\/site distinction/iu);
    expect(readme).toMatch(/localhost-only/iu);
    expect(readme).toMatch(/full-width visual[\s\S]*feedbackMode: "board"/iu);
    expect(readme).toMatch(/unavailable review surface/iu);
  });
});

describe("image-first design resource contract", () => {
  it("uses one consented bounded generation pass before normal design fallback", async () => {
    expect.hasAssertions();
    const [frontendDesign, interfaceDesign, imageGeneration, prompt, readme] = await Promise.all([
      resource("skills/frontend-design/SKILL.md"),
      resource("skills/interface-design/SKILL.md"),
      resource("skills/image-generation/SKILL.md"),
      resource("prompts/design.md"),
      resource("README.md"),
    ]);

    expect(frontendDesign).toMatch(
      /greenfield web application[\s\S]*installed `image-generation`[\s\S]*initial design pass/iu,
    );
    expect(imageGeneration).toMatch(
      /before the first provider request in a pass[\s\S]*consent authorizes only the stated pass[\s\S]*new bound and consent/iu,
    );
    expect(interfaceDesign).toMatch(
      /unavailable,\s+declined,\s+or\s+failed[\s\S]*continue\s+normal\s+UI\s+design[\s\S]*no\s+generated\s+evidence/iu,
    );
    expect(interfaceDesign).toMatch(
      /inspect each direction[\s\S]*verified[\s\S]*`design_board`[\s\S]*explicit human\s+selection and notes/iu,
    );
    expect(prompt).toMatch(
      /greenfield web[\s\S]*application or materially new application surface[\s\S]*explicitly bounded[\s\S]*generation-first[\s\S]*consent[\s\S]*first provider request/iu,
    );
    expect(readme).toMatch(
      /2\. For design direction[\s\S]*generation-first[\s\S]*3\. For implementation[\s\S]*4\. Use `\/generate-image`/iu,
    );
  });
});

describe("interface craft resource contract", () => {
  const operations = [
    "design",
    "extract",
    "document",
    "critique",
    "audit",
    "polish",
    "bolder",
    "quieter",
    "distill",
    "harden",
    "onboard",
    "animate",
    "colorize",
    "typeset",
    "layout",
    "delight",
    "overdrive",
    "clarify",
    "adapt",
    "optimize",
    "live",
  ];

  it("routes natural web-interface requests through complete, portable operation guidance", async () => {
    expect.hasAssertions();
    const [
      catalog,
      documentation,
      prompt,
      frontendDesign,
      frontendDevelopment,
      interfaceDesign,
      readme,
      manifest,
      license,
      notice,
    ] = await Promise.all([
      resource("skills/interface-craft/SKILL.md"),
      resource("skills/interface-craft/references/document.md"),
      resource("prompts/design.md"),
      resource("skills/frontend-design/SKILL.md"),
      resource("skills/frontend-development/SKILL.md"),
      resource("skills/interface-design/SKILL.md"),
      resource("README.md"),
      resource("package.json"),
      resource("LICENSE"),
      resource("NOTICE.md"),
    ]);
    expect(catalog).toMatch(/^---\nname: interface-craft\ndescription:[\s\S]*web-interface/imu);
    expect(catalog).toMatch(/first-class.*natural-language.*router/isu);
    expect(catalog).toMatch(
      /settings flow.*mobile layout.*make this calmer.*document.*design system/isu,
    );
    expect(catalog).toMatch(/`\/shape` remains the feature pitch lifecycle/iu);
    expect(catalog).toMatch(/package-level Apache attribution[\s\S]*`NOTICE\.md`/iu);
    const frontmatter = catalog.slice(0, catalog.indexOf("\n---", 4));
    for (const operation of ["clarify", "adapt", "optimize", "bolder", "quieter", "distill"])
      expect(frontmatter).toMatch(new RegExp(`\\b${operation}\\b`, "u"));
    for (const phrase of [
      "polish this",
      "audit the settings flow",
      "fix the mobile layout",
      "make this calmer",
      "improve onboarding",
      "clarify the errors",
      "document the design system",
      "teach me this design system",
      "Normalize",
    ])
      expect(prompt).toMatch(new RegExp(phrase.replaceAll(" ", "\\s+"), "iu"));
    for (const source of [frontendDesign, frontendDevelopment, interfaceDesign, readme])
      expect(source).toMatch(/interface-craft/iu);
    expect(documentation).toMatch(/repository-native.*`\/design` workflow/iu);
    expect(documentation).toMatch(/upstream.*does not provide.*`design\.md`/isu);
    expect(documentation).toMatch(/explicit human approval[\s\S]*DESIGN\.md/iu);
    expect(manifest).toMatch(/"license": "MIT AND Apache-2\.0"/u);
    expect(manifest).toMatch(/"NOTICE\.md"/u);
    expect(license).toMatch(/Apache License\s+Version 2\.0/iu);
    expect(license).toMatch(/APPENDIX: How to apply the Apache License/iu);
    expect(notice).toMatch(/Impeccable[\s\S]*4\.1\.1/iu);
    expect(notice).toContain("56f44523f76efdcec813e67b38ee550e49b16f48");
    expect(notice).toMatch(/Apache-2\.0[\s\S]*Paul Bakaus/iu);

    for (const operation of operations) {
      const source = await resource(`skills/interface-craft/references/${operation}.md`);
      expect(source).not.toMatch(/^(?:Modified from|Source:|Adapted from) Impeccable/mu);
    }

    const references = await Promise.all(
      operations.map(async (operation) => ({
        operation,
        source: await resource(`skills/interface-craft/references/${operation}.md`),
      })),
    );
    for (const { operation, source } of references) {
      expect(catalog).toMatch(new RegExp(`\\b${operation}\\b`, "u"));
      expect(source.split(/\s+/u).length).toBeGreaterThan(300);
    }
    expect(new Set(references.map(({ source }) => source))).toHaveLength(operations.length);
    const productUiReferences = await Promise.all(
      [
        "adapt",
        "animate",
        "bolder",
        "colorize",
        "critique",
        "delight",
        "layout",
        "overdrive",
        "quieter",
        "typeset",
      ].map((operation) => resource(`skills/interface-craft/references/${operation}.md`)),
    );
    for (const source of productUiReferences)
      expect(source).not.toMatch(/Persuade \+ Experience|marketing|landing pages?|portfolios?/iu);
    const adapt = await resource("skills/interface-craft/references/adapt.md");
    expect(adapt).not.toMatch(/\biOS\b|\bAndroid\b|\badaptive\b/iu);
    const polish = await resource("skills/interface-craft/references/polish.md");
    expect(polish).not.toMatch(/phone and tablet|supported OS versions|on native/iu);

    const nonAttributionResources = [
      ...(await markdownResources("skills")),
      ...(await markdownResources("prompts")),
      readme,
    ];
    const packedResources = [...nonAttributionResources, notice];
    for (const source of packedResources) {
      for (const forbidden of [
        "npx impeccable",
        ".impeccable/",
        "PRODUCT.md",
        "`/impeccable`",
        "impeccable/scripts",
        "design.json",
        "question server",
        "hooks.json",
        "bundled detector",
        "detect.mjs",
        "sub-agent",
        "Questions skipped",
      ])
        expect(source).not.toContain(forbidden);
    }
    for (const source of nonAttributionResources) {
      expect(source).not.toMatch(/\/(?:Users|home|tmp)\//u);
      expect(source).not.toMatch(/pi-extensions|packages\/frontend-developer/iu);
    }
  });

  it("provides one approval-gated portable DESIGN.md workflow for humans and agents", async () => {
    expect.hasAssertions();
    const [
      documentation,
      template,
      prompt,
      frontendDesign,
      designContract,
      interfaceDesign,
      readme,
      rootReadme,
      agents,
    ] = await Promise.all([
      resource("skills/design-documentation/SKILL.md"),
      resource("skills/design-documentation/assets/DESIGN.template.md"),
      resource("prompts/design.md"),
      resource("skills/frontend-design/SKILL.md"),
      resource("skills/frontend-design/references/design-contract.md"),
      resource("skills/interface-design/SKILL.md"),
      resource("README.md"),
      resource("../../README.md"),
      resource("../../AGENTS.md"),
    ]);
    expect(documentation).toMatch(/^---\nname: design-documentation\ndescription:.*DESIGN\.md/im);
    expect(prompt).toMatch(/design document[\s\S]*design-documentation/iu);
    expect(documentation).toMatch(/scan mode[\s\S]*seed mode[\s\S]*merge\/refresh mode/iu);
    expect(documentation).toMatch(/complete proposal[\s\S]*format: "md"[\s\S]*fullscreen/iu);
    expect(documentation).toMatch(
      /explicit human approval[\s\S]*create[\s\S]*material(?:ly)? rewrite/iu,
    );
    expect(documentation).toMatch(/cancel[\s\S]*not\s+approval/iu);
    expect(documentation).toMatch(
      /repository instructions[\s\S]*verified behavior[\s\S]*outrank/iu,
    );
    expect(documentation).toMatch(/preserve unknown[\s\S]*no silent overwrite/iu);
    for (const key of ["version", "name", "description", "omitted"])
      expect(template).toMatch(new RegExp(`^${key}:`, "mu"));
    for (const tokenGroup of ["colors", "typography", "rounded", "spacing", "components"])
      expect(documentation).toMatch(new RegExp(`\\b${tokenGroup}\\b`, "u"));
    expect(template).toMatch(
      /## Overview[\s\S]*## Colors[\s\S]*## Typography[\s\S]*## Layout[\s\S]*## Elevation & Depth[\s\S]*## Shapes[\s\S]*## Components[\s\S]*## Do's and Don'ts/iu,
    );
    for (const source of [frontendDesign, designContract, interfaceDesign, readme]) {
      expect(source).toMatch(/design-documentation/iu);
      expect(source).not.toMatch(/frontend-design\/assets\/DESIGN\.template\.md/iu);
    }
    await expect(resource("skills/frontend-design/assets/DESIGN.template.md")).rejects.toThrow();
    for (const profile of [rootReadme, agents]) {
      expect(profile).toMatch(/interface-craft/iu);
      expect(profile).toMatch(/design-documentation/iu);
    }
    for (const forbidden of ["PRODUCT.md", ".impeccable/", "design.json"]) {
      expect(documentation).not.toContain(forbidden);
      expect(template).not.toContain(forbidden);
    }
    for (const unsupported of ["motion:", "breakpoints:", "shadows:"]) {
      expect(template).not.toContain(unsupported);
    }
  });
});

describe("React skill resource contract", () => {
  const reactRules =
    "_sections.md _template.md advanced-effect-event-deps.md advanced-event-handler-refs.md advanced-init-once.md advanced-use-latest.md async-api-routes.md async-cheap-condition-before-await.md async-defer-await.md async-dependencies.md async-parallel.md async-suspense-boundaries.md bundle-analyzable-paths.md bundle-barrel-imports.md bundle-conditional.md bundle-defer-third-party.md bundle-dynamic-imports.md bundle-preload.md client-event-listeners.md client-localstorage-schema.md client-passive-event-listeners.md client-swr-dedup.md js-batch-dom-css.md js-cache-function-results.md js-cache-property-access.md js-cache-storage.md js-combine-iterations.md js-early-exit.md js-flatmap-filter.md js-hoist-regexp.md js-index-maps.md js-length-check-first.md js-min-max-loop.md js-request-idle-callback.md js-set-map-lookups.md js-tosorted-immutable.md rendering-activity.md rendering-animate-svg-wrapper.md rendering-conditional-render.md rendering-content-visibility.md rendering-hoist-jsx.md rendering-hydration-no-flicker.md rendering-hydration-suppress-warning.md rendering-resource-hints.md rendering-script-defer-async.md rendering-svg-precision.md rendering-usetransition-loading.md rerender-defer-reads.md rerender-dependencies.md rerender-derived-state-no-effect.md rerender-derived-state.md rerender-functional-setstate.md rerender-lazy-state-init.md rerender-memo-with-default-value.md rerender-memo.md rerender-move-effect-to-event.md rerender-no-inline-components.md rerender-simple-expression-in-memo.md rerender-split-combined-hooks.md rerender-transitions.md rerender-use-deferred-value.md rerender-use-ref-transient-values.md server-after-nonblocking.md server-auth-actions.md server-cache-lru.md server-cache-react.md server-dedup-props.md server-hoist-static-io.md server-no-shared-module-state.md server-parallel-fetching.md server-parallel-nested-fetching.md server-serialization.md".split(
      " ",
    );
  const nativeRules =
    "_sections.md _template.md animation-derived-value.md animation-gesture-detector-press.md animation-gpu-properties.md design-system-compound-components.md fonts-config-plugin.md imports-design-system-folder.md js-hoist-intl.md list-performance-callbacks.md list-performance-function-references.md list-performance-images.md list-performance-inline-objects.md list-performance-item-expensive.md list-performance-item-memo.md list-performance-item-types.md list-performance-virtualize.md monorepo-native-deps-in-app.md monorepo-single-dependency-versions.md navigation-native-navigators.md react-compiler-destructure-functions.md react-compiler-reanimated-shared-values.md react-state-dispatcher.md react-state-fallback.md react-state-minimize.md rendering-no-falsy-and.md rendering-text-in-text-component.md scroll-position-no-state.md state-ground-truth.md ui-expo-image.md ui-image-gallery.md ui-measure-views.md ui-menus.md ui-native-modals.md ui-pressable.md ui-safe-area-scroll.md ui-scrollview-content-inset.md ui-styling.md".split(
      " ",
    );
  const viewTransitionReferences =
    "css-recipes.md implementation.md nextjs.md patterns.md troubleshooting.md".split(" ");

  it("ships the pinned React skill inventories under local names", async () => {
    expect.hasAssertions();
    const [react, native, transitions, skills] = await Promise.all([
      resource("skills/react-best-practices/SKILL.md"),
      resource("skills/react-native-skills/SKILL.md"),
      resource("skills/react-view-transitions/SKILL.md"),
      markdownResources("skills"),
    ]);
    const [actualReactRules, actualNativeRules, actualReferences] = await Promise.all([
      readdir(new URL("skills/react-best-practices/rules/", root)),
      readdir(new URL("skills/react-native-skills/rules/", root)),
      readdir(new URL("skills/react-view-transitions/references/", root)),
    ]);

    expect(actualReactRules.sort((left, right) => left.localeCompare(right))).toEqual(
      reactRules.sort((left, right) => left.localeCompare(right)),
    );
    expect(actualNativeRules.sort((left, right) => left.localeCompare(right))).toEqual(
      nativeRules.sort((left, right) => left.localeCompare(right)),
    );
    expect(actualReferences.sort((left, right) => left.localeCompare(right))).toEqual(
      viewTransitionReferences.sort((left, right) => left.localeCompare(right)),
    );
    for (const [source, name] of [
      [react, "react-best-practices"],
      [native, "react-native-skills"],
      [transitions, "react-view-transitions"],
    ] as [string, string][]) {
      expect(source).toMatch(new RegExp(`^---\\nname: ${name}\\n`, "mu"));
      expect(source).toContain("063bee94c3f4df8453406c830b0a7df0f2860278");
      expect(source).toMatch(/target repository instructions[\s\S]*override/iu);
      expect(source).toMatch(/examples[^.]*optional[^.]*not[^.]*install/iu);
    }
    expect(skills.join("\n")).not.toMatch(/^name: react-interface$/mu);
    expect(await directoryDigest("skills/react-best-practices/rules")).toBe(
      "ca90bfc3f2b068c8e22feb71c2f1e47a0e9c9fa3eb8a3822263d2983b7674f4e",
    );
    expect(await directoryDigest("skills/react-native-skills/rules")).toBe(
      "5c6ca56a32acd5bf98a45e91c9e2e4868deb2a3acd6360f730b8057f496ae0c7",
    );
    expect(await directoryDigest("skills/react-view-transitions/references")).toBe(
      "976cba45adae9663395223ad0c6515250038fad6025307ecbd6d263166ff7d0f",
    );
  });

  it("keeps local React implementation guidance with the vendored performance guide", async () => {
    expect.hasAssertions();
    const [react, implementation] = await Promise.all([
      resource("skills/react-best-practices/SKILL.md"),
      resource("skills/react-best-practices/references/implementation.md"),
    ]);
    expect(react).toMatch(/Local integration[\s\S]*implementation\.md/iu);
    for (const guidance of [
      "real owner",
      "Derive values during render",
      "external systems",
      "semantic HTML",
      "keyboard order",
      "focus entry and return",
      "RTL",
      "localized text expansion",
      "forced-colors",
      "behavior through roles, labels, navigation, and visible state",
      "Avoid speculative component layers",
      "blanket memoization",
      "measured evidence",
    ])
      expect(implementation).toContain(guidance);
  });

  it("keeps the portable audit offline while covering stable interaction checks", async () => {
    expect.hasAssertions();
    const [audit, notice] = await Promise.all([
      resource("skills/interface-craft/references/audit.md"),
      resource("NOTICE.md"),
    ]);
    for (const check of [
      "unobscured focus",
      "paste",
      "deep-link state",
      "Locale-aware formatting",
      "hydration-safe",
      "safe areas",
      "captions/transcripts/descriptions",
      "file:line",
    ])
      expect(audit).toContain(check);
    expect(audit).toMatch(/### 5\. Implementation Integrity[\s\S]*\*\*Check for\*\*:/u);
    expect(notice).toContain("e3d624baaf29dc1fc645aff3e38f03e564d2d6b1");
    expect(notice).toMatch(/Vercel Labs[\s\S]*MIT/iu);
    expect(notice).toContain("Every listed upstream file is byte-identical except each discovered");
    expect(notice).toContain("no separate root LICENSE or copyright string");
    expect(notice).toMatch(
      /web-interface-guidelines[\s\S]*Copyright \(c\) 2025 Vercel Labs[\s\S]*Reproduced MIT notice for web-interface-guidelines/iu,
    );
    expect(audit).not.toMatch(/WebFetch|Vercel-specific copywriting/iu);
  });
});
