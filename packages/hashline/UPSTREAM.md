# Upstream provenance

`src/hashline/`, `UPSTREAM_README.md`, and `UPSTREAM_CHANGELOG.md` were copied
from `packages/hashline` in Oh My Pi commit
`644ad30d6e9436074a00f8bd08ecadcd98992fc1` by Can Bölük.

The copied implementation retains its full MIT notice in `LICENSE`; package
distribution also includes `THIRD_PARTY_LICENSES.md`.

## Local deviations

| Deviation                                                                                                                   | Reason                                                                                          | Replacement proof                                                           |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Strict Node TypeScript refactor across the copied sources                                                                   | Match this repository's strict compiler and lint rules without suppressions.                    | `npm --workspace @mopeyjellyfish/pi-hashline run typecheck`; `npm run lint` |
| Markdown normalization in copied documentation and prompt examples                                                          | Meet repository Markdown rules while retaining upstream technical content.                      | `npm run markdownlint`                                                      |
| `web-tree-sitter`/WASM syntax backend with explicit `initializeSyntax()`                                                    | Run without the upstream native backend and make grammar loading an explicit host precondition. | `test/syntax.test.ts`; `npm --workspace @mopeyjellyfish/pi-hashline test`   |
| `NodeFilesystem.canonicalPath()` realpath canonicalization, including an existing-parent fallback for new move destinations | Treat symlink aliases as one filesystem identity before snapshots, queues, and mutation checks. | `test/runtime-adapters.test.ts`; `test/index.test.ts`                       |
| Pi host adapter for anchored reads, mutation queues, cancellation, and bounded edit output                                  | Prove Pi-specific behavior at the host boundary rather than asserting upstream behavior.        | `test/index.test.ts`; `npm run test:coverage`                               |

These are local package deviations, not claims about official upstream behavior.
