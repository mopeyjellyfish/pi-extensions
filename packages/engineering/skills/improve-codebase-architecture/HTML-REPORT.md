# Blueprint Ledger HTML report

Use this guide only to render the temporary architecture report. `SKILL.md` owns
discovery, orchestration, decisions, and lifecycle. This guide owns the semantic
HTML scaffold, visual grammar, accessibility, safe rendering, and concise copy.

Write one complete HTML file in the run's unique OS temp directory. The file
must remain readable when the loopback server, Tailwind, or Mermaid is
unavailable. Do not add repository files, downloaded assets, or browser-side
mutation authority.

## Render untrusted evidence safely

Treat repository paths, symbols, commit text, issue metadata, candidate copy,
and diagram labels as untrusted input.

- HTML-escape `&`, `<`, `>`, `"`, and `'` before interpolation.
- Use generated safe candidate and Mermaid node IDs. Do not derive element IDs
  directly from repository text.
- For Mermaid quoted labels, also replace line breaks and escape backslashes,
  quotes, brackets, and braces before adding the HTML-escaped value.
- Serialize the report-data block with a real JSON serializer, then replace `<`
  with `\u003c` before embedding it. Never build JSON by concatenating strings.
- Do not put credentials, confidential environment data, local report paths, or
  tracker authentication in HTML or Mermaid.
- Use Mermaid `securityLevel: "strict"`. Strict mode does not replace escaping.

The pinned CDN versions below are part of this contract. Do not silently change
them. Apply target-repository network, privacy, and source-disclosure rules
first. If those rules prohibit a CDN, omit the imports and preserve the semantic
fallback.

## Complete scaffold

Generate a complete document from this scaffold. Replace placeholder evidence,
repeat candidate articles, and remove states that do not apply. Preserve the
element IDs and `data-*` hooks used by local filtering, theme selection,
recoverable data, and live reload.

```html
<!doctype html>
<html lang="en" data-theme="system" data-mermaid="pending">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="referrer" content="no-referrer" />
    <title>Blueprint Ledger · repository name</title>
    <script>
      (() => {
        try {
          const saved = localStorage.getItem("blueprint-ledger-theme");
          if (saved === "light" || saved === "dark") {
            document.documentElement.dataset.theme = saved;
          }
        } catch {
          // The system theme remains the accessible fallback.
        }
      })();
    </script>
    <script src="https://cdn.tailwindcss.com/3.4.17" referrerpolicy="no-referrer"></script>
    <style>
      :root {
        color-scheme: light dark;
        --canvas: #e8e8e8;
        --paper: #ffffff;
        --paper-2: #f7f7f7;
        --paper-3: #efefef;
        --ink: #202020;
        --muted: #656565;
        --faint: #6f6f6f;
        --line: #d2d2d2;
        --accent: #527793;
        --accent-soft: #eaf0f4;
        --strong: #466653;
        --strong-soft: #e8efea;
        --warn: #7b602f;
        --danger: #934848;
        --decision: #334453;
        --decision-ink: #f5f7f9;
      }

      @media (prefers-color-scheme: dark) {
        :root[data-theme="system"] {
          --canvas: #141414;
          --paper: #1f1f1f;
          --paper-2: #191919;
          --paper-3: #292929;
          --ink: #d4d4d4;
          --muted: #a7a7a7;
          --faint: #929292;
          --line: #3b3b3b;
          --accent: #7899b2;
          --accent-soft: #25313b;
          --strong: #9eb4a5;
          --strong-soft: #29362e;
          --warn: #c0a472;
          --danger: #c78686;
          --decision: #2b3b48;
          --decision-ink: #e7edf2;
        }
      }

      :root[data-theme="dark"] {
        --canvas: #141414;
        --paper: #1f1f1f;
        --paper-2: #191919;
        --paper-3: #292929;
        --ink: #d4d4d4;
        --muted: #a7a7a7;
        --faint: #929292;
        --line: #3b3b3b;
        --accent: #7899b2;
        --accent-soft: #25313b;
        --strong: #9eb4a5;
        --strong-soft: #29362e;
        --warn: #c0a472;
        --danger: #c78686;
        --decision: #2b3b48;
        --decision-ink: #e7edf2;
      }

      * {
        box-sizing: border-box;
      }

      html {
        background: var(--canvas);
        color: var(--ink);
      }

      body {
        margin: 0;
        background: var(--canvas);
        color: var(--ink);
        font:
          15px/1.62 ui-sans-serif,
          system-ui,
          sans-serif;
      }

      button,
      select {
        font: inherit;
      }

      :focus-visible {
        outline: 3px solid var(--accent);
        outline-offset: 3px;
      }

      .page {
        max-width: 86rem;
        min-height: 100vh;
        margin: auto;
        background: var(--paper);
      }

      .coverage-strip,
      .finding-index {
        background: var(--paper-2);
      }

      .ledger {
        display: grid;
        grid-template-columns: 15rem minmax(0, 1fr);
      }

      .finding-index {
        border-right: 1px solid var(--line);
      }

      .reading {
        max-width: 64rem;
      }

      .candidate-visual {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 2rem minmax(0, 1fr);
        gap: 0.75rem;
      }

      .diagram-panel {
        min-height: 20rem;
        overflow: hidden;
        border: 1px solid var(--line);
        background: var(--paper-2);
      }

      pre.mermaid {
        max-width: 100%;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .deep-module {
        border: 3px solid var(--accent);
        background: var(--accent-soft);
      }

      .prose-section {
        display: grid;
        grid-template-columns: 11rem minmax(0, 1fr);
        gap: 1.75rem;
        border-top: 1px solid var(--line);
      }

      .decision-runway {
        background: var(--decision);
        color: var(--decision-ink);
      }

      .muted {
        color: var(--muted);
      }

      .faint {
        color: var(--faint);
      }

      .accent {
        color: var(--accent);
      }

      .candidate[hidden] {
        display: none;
      }

      html[data-mermaid="failed"] .mermaid-status {
        display: block;
      }

      .mermaid-status {
        display: none;
        color: var(--warn);
      }

      @media (max-width: 53rem) {
        .ledger,
        .candidate-visual,
        .prose-section {
          display: block;
        }

        .finding-index {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .change-arrow {
          transform: rotate(90deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          scroll-behavior: auto !important;
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      @media print {
        :root,
        :root[data-theme="system"],
        :root[data-theme="light"],
        :root[data-theme="dark"] {
          color-scheme: light;
          --canvas: #ffffff;
          --paper: #ffffff;
          --paper-2: #ffffff;
          --paper-3: #ffffff;
          --ink: #111111;
          --muted: #555555;
          --faint: #555555;
          --line: #777777;
          --accent: #315f7e;
          --strong: #385744;
          --warn: #6b5124;
          --danger: #823e3e;
        }

        html,
        body,
        .page {
          max-width: none;
          background: #ffffff !important;
          color: #111111 !important;
        }

        .browser-only,
        .finding-index,
        button,
        form {
          display: none !important;
        }

        .ledger {
          display: block;
        }

        .reading {
          max-width: none;
        }

        .candidate {
          break-inside: avoid;
        }

        .coverage-strip,
        .top-recommendation,
        .diagram-panel,
        .deep-module,
        .decision-runway {
          background: #ffffff !important;
          color: #111111 !important;
          box-shadow: none !important;
        }

        .status-badge {
          border: 1px solid #777777;
          background: #ffffff !important;
          color: #111111 !important;
        }
      }
    </style>
  </head>
  <body class="min-h-screen antialiased">
    <main class="page" id="report">
      <header class="border-b px-6 py-7 md:px-12" style="border-color: var(--line)">
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p class="accent mb-2 font-mono text-xs font-bold uppercase tracking-[0.14em]">
              Architecture review · repository name
            </p>
            <h1 class="font-serif text-3xl font-semibold tracking-tight">
              Deepening opportunities
            </h1>
            <p class="muted mt-3 text-sm">High depth · declared scope · revision 4</p>
          </div>
          <div class="browser-only flex items-center gap-2">
            <p
              class="rounded border px-3 py-2 text-xs font-semibold"
              style="border-color: var(--line)"
              aria-live="polite"
            >
              <span aria-hidden="true">●</span> Live
            </p>
            <button
              id="theme-toggle"
              class="rounded border px-3 py-2 text-xs font-semibold"
              style="border-color: var(--line); background: var(--paper-2)"
              type="button"
              aria-label="Toggle color theme; current theme is system"
            >
              Theme: system
            </button>
          </div>
        </div>
      </header>

      <section
        class="coverage-strip flex flex-wrap gap-x-8 gap-y-2 border-b px-6 py-3 text-xs md:px-12"
        style="border-color: var(--line)"
        aria-label="Declared coverage"
      >
        <p><strong>Scope</strong> checkout vertical slice</p>
        <p><strong>Depth</strong> high</p>
        <p><strong>Files</strong> 38</p>
        <p><strong>Modules</strong> 6</p>
        <p><strong>Tests</strong> 18</p>
        <p><strong>History</strong> 90 commits</p>
        <p><strong>Found</strong> 7 supported</p>
        <p><strong>Excluded</strong> payments · generated clients</p>
      </section>

      <div class="ledger">
        <nav class="finding-index px-6 py-8 md:pl-12" aria-label="Finding index">
          <h2 class="faint mb-5 text-xs font-bold uppercase tracking-[0.13em]">Findings</h2>
          <ol class="space-y-5">
            <li data-candidate-id="C-001">
              <a class="block border-l-2 pl-3" style="border-color: var(--accent)" href="#C-001">
                <strong class="block text-sm">C-001 · Order intake</strong>
                <span class="faint text-xs">Strong · implement</span>
              </a>
            </li>
          </ol>
        </nav>

        <div class="reading px-6 py-10 md:px-12">
          <section class="mb-10 border-b pb-8" style="border-color: var(--line)">
            <h2 class="font-serif text-2xl">
              A focused review of policy that is difficult to change.
            </h2>
            <p class="muted mt-2 max-w-3xl">
              Observed friction stays separate from proposed architecture. Candidate IDs remain
              stable while decisions update.
            </p>
            <aside
              class="top-recommendation mt-5 border-l-4 px-4 py-3"
              style="border-color: var(--accent); background: var(--accent-soft)"
            >
              <span class="faint block text-xs font-bold uppercase tracking-wider"
                >Top recommendation</span
              >
              C-001 · Collapse the order intake pipeline
            </aside>
          </section>

          <form class="browser-only mb-10 flex flex-wrap gap-4" aria-label="Filter findings">
            <label class="text-xs font-semibold">
              Evidence
              <select
                id="filter-evidence"
                class="ml-2 rounded border px-2 py-1"
                style="border-color: var(--line); background: var(--paper)"
              >
                <option value="all">All</option>
                <option value="strong">Strong</option>
                <option value="moderate">Moderate</option>
                <option value="weak">Weak</option>
              </select>
            </label>
            <label class="text-xs font-semibold">
              Impact
              <select
                id="filter-impact"
                class="ml-2 rounded border px-2 py-1"
                style="border-color: var(--line); background: var(--paper)"
              >
                <option value="all">All</option>
                <option value="localized">Localized</option>
                <option value="coordinated">Coordinated</option>
                <option value="cross-cutting">Cross-cutting</option>
              </select>
            </label>
            <label class="text-xs font-semibold">
              Route
              <select
                id="filter-route"
                class="ml-2 rounded border px-2 py-1"
                style="border-color: var(--line); background: var(--paper)"
              >
                <option value="all">All</option>
                <option value="implement">Implement</option>
                <option value="planning">Planning</option>
                <option value="shape">Shape</option>
              </select>
            </label>
          </form>

          <p class="mermaid-status mb-6" role="status">
            Mermaid is unavailable. The text alternative and proposed module view remain complete.
          </p>

          <article
            class="candidate"
            id="C-001"
            data-evidence="strong"
            data-impact="localized"
            data-route="implement"
            data-decision="awaiting-decision"
          >
            <header class="mb-7 grid gap-3 md:grid-cols-[3rem_1fr_auto]">
              <p class="accent font-serif text-3xl" aria-hidden="true">01</p>
              <div>
                <p class="muted font-mono text-xs font-bold uppercase tracking-wider">
                  Deepening candidate C-001
                </p>
                <h2 class="font-serif text-3xl font-semibold tracking-tight">
                  Collapse the order intake pipeline
                </h2>
                <p class="faint mt-2 font-mono text-xs">
                  checkout/order.ts · validation.ts · pricing.ts · order.test.ts
                </p>
              </div>
              <p class="text-xs font-bold uppercase tracking-wide">
                <span
                  class="status-badge rounded px-2 py-1"
                  style="color: var(--strong); background: var(--strong-soft)"
                  >Strong</span
                >
                <span class="status-badge rounded px-2 py-1" style="background: var(--paper-3)"
                  >Implement</span
                >
              </p>
            </header>

            <div class="candidate-visual mb-10" aria-label="Before and after architecture">
              <figure class="diagram-panel p-5">
                <figcaption class="faint mb-3 font-mono text-xs font-bold uppercase tracking-wider">
                  Before · graph-shaped call flow
                </figcaption>
                <pre
                  class="mermaid"
                  aria-label="Handler calls validator, pricing, and persistence through three shallow interfaces"
                >
flowchart LR
  handler["Handler"] --> validator["Validator"]
  validator --> pricing["Pricing"]
  pricing --> persistence["Persistence"]
                </pre>
                <p class="muted mt-3 text-sm">
                  Text alternative: policy crosses three shallow interfaces and five callers repeat
                  the sequence.
                </p>
              </figure>

              <div class="change-arrow grid place-items-center text-2xl" aria-hidden="true">→</div>

              <figure class="diagram-panel p-5">
                <figcaption class="faint mb-3 font-mono text-xs font-bold uppercase tracking-wider">
                  After · hand-built module mass
                </figcaption>
                <div class="deep-module my-10 p-8 text-center font-bold">
                  ORDER INTAKE MODULE
                  <span class="muted mt-2 block text-sm font-normal"
                    >validate · price · persist</span
                  >
                </div>
                <svg
                  class="mx-auto h-12 w-full max-w-xs"
                  role="img"
                  aria-label="One wide module contains validation, pricing, and persistence policy"
                  viewBox="0 0 320 48"
                >
                  <title>Consolidated order intake module</title>
                  <rect x="1" y="1" width="318" height="46" fill="none" stroke="currentColor" />
                  <path d="M106 1v46M213 1v46" stroke="currentColor" />
                </svg>
              </figure>
            </div>

            <section class="prose-section py-6">
              <h3 class="font-semibold">Problem</h3>
              <div>
                <p>Understanding one order requires tracing policy across three shallow modules.</p>
                <p class="muted mt-2 text-sm">
                  Evidence: five callers coordinate the same steps; 11 of 12 tests repeat setup.
                </p>
              </div>
            </section>
            <section class="prose-section py-6">
              <h3 class="font-semibold">Proposed change</h3>
              <p>
                Put complete intake policy behind one concrete module interface. Keep transport
                parsing outside and preserve behavior and test case names.
              </p>
            </section>
            <section class="prose-section py-6">
              <h3 class="font-semibold">Expected wins</h3>
              <ul class="list-disc space-y-1 pl-5">
                <li><strong>Locality:</strong> one module owns intake policy.</li>
                <li><strong>Leverage:</strong> five callers use one interface.</li>
                <li><strong>Depth:</strong> the smaller interface hides sequencing decisions.</li>
                <li><strong>Test effect:</strong> cases remain isolated while setup collapses.</li>
              </ul>
            </section>
            <section class="prose-section py-6">
              <h3 class="font-semibold">Delivery notes</h3>
              <div>
                <p><strong>Recommended route:</strong> <code>implement</code>.</p>
                <p class="mt-2">
                  <strong>Reversibility:</strong> internal movement with no migration.
                </p>
                <p class="mt-2">
                  <strong>Decision conflict:</strong> ADR-0007 requires the second adapter to remain
                  real.
                </p>
              </div>
            </section>

            <footer
              class="decision-runway mt-8 flex flex-wrap items-center justify-between gap-5 p-5"
            >
              <div>
                <h3 class="font-semibold">Continue in your terminal</h3>
                <p class="mt-1 text-sm">Action · Track — GitHub · Won't do · Deepen</p>
              </div>
              <p class="text-xs font-bold uppercase tracking-wider">Awaiting decision</p>
            </footer>
          </article>

          <section
            id="no-supported-findings"
            class="mt-12 border p-6"
            style="border-color: var(--line)"
            hidden
          >
            <h2 class="font-serif text-2xl">No supported findings</h2>
            <p class="muted mt-2">
              State the scanned scope, coverage, exclusions, and evidence gaps. Do not force a
              candidate.
            </p>
          </section>
        </div>
      </div>
    </main>

    <script id="report-data" type="application/json">
      {
        "revision": 4,
        "repository": "repository name",
        "scope": "checkout vertical slice",
        "depth": "high",
        "coverage": {
          "files": 38,
          "modules": 6,
          "tests": 18,
          "history": "90 commits",
          "exclusions": ["payments", "generated clients"],
          "evidenceGaps": []
        },
        "candidates": [
          {
            "id": "C-001",
            "evidence": "strong",
            "impact": "localized",
            "route": "implement",
            "decisionStatus": "awaiting-decision",
            "secondOpinionStatus": "agreed"
          }
        ]
      }
    </script>

    <script>
      (() => {
        const root = document.documentElement;
        const button = document.querySelector("#theme-toggle");
        const themes = ["system", "light", "dark"];
        const applyTheme = (theme) => {
          root.dataset.theme = theme;
          button.textContent = `Theme: ${theme}`;
          button.setAttribute("aria-label", `Toggle color theme; current theme is ${theme}`);
          try {
            if (theme === "system") localStorage.removeItem("blueprint-ledger-theme");
            else localStorage.setItem("blueprint-ledger-theme", theme);
          } catch {
            // The selected theme still applies for this page.
          }
          window.dispatchEvent(new CustomEvent("blueprint-theme-change"));
        };
        button.addEventListener("click", () => {
          const current = themes.includes(root.dataset.theme) ? root.dataset.theme : "system";
          applyTheme(themes[(themes.indexOf(current) + 1) % themes.length]);
        });
        button.textContent = `Theme: ${root.dataset.theme}`;
        button.setAttribute(
          "aria-label",
          `Toggle color theme; current theme is ${root.dataset.theme}`,
        );

        const filters = ["evidence", "impact", "route"];
        const controls = Object.fromEntries(
          filters.map((name) => [name, document.querySelector(`#filter-${name}`)]),
        );
        const applyFilters = () => {
          for (const candidate of document.querySelectorAll(".candidate")) {
            candidate.hidden = filters.some((name) => {
              const value = controls[name]?.value ?? "all";
              return value !== "all" && candidate.dataset[name] !== value;
            });
            const indexEntry = document.querySelector(`[data-candidate-id="${candidate.id}"]`);
            if (indexEntry) indexEntry.hidden = candidate.hidden;
          }
        };
        for (const control of Object.values(controls)) {
          control?.addEventListener("change", applyFilters);
        }
      })();
    </script>

    <script type="module">
      const mermaidUrl = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
      let mermaid;

      const selectedTheme = () => {
        const explicit = document.documentElement.dataset.theme;
        if (explicit === "dark") return "dark";
        if (explicit === "light") return "default";
        return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default";
      };

      const renderMermaid = async () => {
        mermaid ??= (await import(mermaidUrl)).default;
        const nodes = [...document.querySelectorAll(".mermaid")];
        for (const node of nodes) {
          node.dataset.source ??= node.textContent;
          node.textContent = node.dataset.source;
          node.removeAttribute("data-processed");
        }
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: selectedTheme(),
        });
        await mermaid.run({ nodes });
        document.documentElement.dataset.mermaid = "ready";
      };

      const safelyRender = () => {
        renderMermaid().catch(() => {
          document.documentElement.dataset.mermaid = "failed";
        });
      };

      safelyRender();
      window.addEventListener("blueprint-theme-change", safelyRender);
      matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (document.documentElement.dataset.theme === "system") safelyRender();
      });
    </script>
  </body>
</html>
```

## Diagram selection grammar

Choose the visual method from the evidence. Do not make every candidate a
Mermaid card.

- Use Mermaid only for graph-shaped dependency graphs, caller flows, and
  sequences where edges carry the meaning.
- Use hand-built HTML and CSS for a large deep module, layered responsibility,
  surface-area mass, and a collapsed call graph.
- Use inline SVG for a focused cross-section or geometry that needs exact visual
  composition. Keep SVG labels escaped and provide `<title>` plus an accessible
  text alternative.
- Use one focused before-and-after comparison per candidate. Redraw a dense
  visual instead of explaining an unreadable graph with more prose.

Keep diagrams near 20rem high for side-by-side reading. A Mermaid failure must
leave its source or a nearby text alternative visible. A custom visual must not
depend on Tailwind to communicate its meaning.

## Editorial copy and candidate states

Start with findings, not an essay. Use short action-oriented candidate titles.
For each candidate show involved files, evidence strength, impact, route, a
before-and-after visual, then vertical **Problem**, **Proposed change**,
**Expected wins**, and **Delivery notes** sections. State locality, leverage,
Depth, test effect, reversibility, overlap, integration points, evidence gaps,
and decision conflicts only when they apply.

Use the report's restrained VS Code-like neutral palette and muted semantic
accents. Avoid neon color, glow, decorative saturation, dashboard card grids,
and repeated helper text. The report is an editorial architecture brief that is
readable, printable, and shareable.

Render the applicable state honestly: generating, partial update, complete,
report-only, awaiting decision, action started, issue draft pending, won't do,
deepening, no supported findings, CDN failure, server unavailable, or stale or
expired report. Keep the terminal handoff visible. Browser filters, theme,
selection, and copy controls are conveniences only; they never start work or
create issues.

For no supported findings, set the coverage count to zero, replace the finding
index with `No candidates`, remove filters, the top recommendation, and candidate
articles, and show the no-finding section with scanned scope, exclusions, and
evidence gaps.

The headings, lists, articles, text alternatives, and structured evidence form
the semantic fallback. They must remain complete without Tailwind, Mermaid,
JavaScript, or the live server.
