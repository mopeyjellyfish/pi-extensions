# `@mopeyjellyfish/pi-lsp`

Give Pi LSP-aware file writes, edits, semantic navigation, validation, and refactoring.

The extension keeps Pi's built-in `write` and `edit` schemas, renderers,
argument compatibility, and file-mutation queues. After a successful mutation,
it synchronizes the file with an installed language server and adds only newly
introduced errors to the tool result. Slow diagnostics are delivered later as a
steering message instead of blocking the write indefinitely.

`lsp_rename_file` calls `workspace/willRenameFiles` before moving a file,
applies the returned `WorkspaceEdit`, performs the filesystem rename, sends
`workspace/didRenameFiles`, and checks the affected files again. This lets the
language server update imports, re-exports, barrel files, and configured path
aliases using the language's own module graph.

## Install

From a checkout of this repository:

```sh
pi install /path/to/pi-extensions/packages/lsp
```

The package does not download or install language servers. Install the servers
you want separately and expose their executables either on `PATH` or in a
trusted project's `node_modules/.bin` or `.venv` directory. Nested workspaces
also search those trusted local directories up to Pi's project root, supporting
common monorepo hoisting layouts.

Examples:

```sh
npm install --global typescript typescript-language-server
pipx install basedpyright
go install golang.org/x/tools/gopls@latest
rustup component add rust-analyzer
```

## Built-in server discovery

The first applicable installed server is selected for each language family.
Related TypeScript and JavaScript document kinds share one server process while
retaining their correct LSP language IDs.

| Languages                        | Commands checked                                                         |
| -------------------------------- | ------------------------------------------------------------------------ |
| TypeScript, JavaScript, TSX, JSX | `typescript-language-server --stdio`                                     |
| Python                           | `basedpyright-langserver --stdio`, `pyright-langserver --stdio`, `pylsp` |
| Go                               | `gopls`                                                                  |
| Rust                             | `rust-analyzer`                                                          |
| C and C++                        | `clangd`                                                                 |
| Java                             | `jdtls`                                                                  |
| C#                               | `csharp-ls`                                                              |
| Ruby                             | `ruby-lsp`                                                               |
| PHP                              | `phpactor language-server`                                               |
| Lua                              | `lua-language-server`                                                    |
| Swift                            | `sourcekit-lsp`                                                          |
| Kotlin                           | `kotlin-language-server`                                                 |
| Elixir                           | `elixir-ls`, `language_server.sh`                                        |
| Bash                             | `bash-language-server start`                                             |
| YAML                             | `yaml-language-server --stdio`                                           |
| JSON and JSONC                   | `vscode-json-language-server --stdio`                                    |
| HTML                             | `vscode-html-language-server --stdio`                                    |
| CSS, SCSS, Less                  | `vscode-css-language-server --stdio`                                     |
| Vue                              | `vue-language-server --stdio`                                            |
| Svelte                           | `svelteserver --stdio`                                                   |
| Dockerfile                       | `docker-langserver --stdio`                                              |
| Terraform                        | `terraform-ls serve`                                                     |

Servers are started lazily per detected workspace root and reused for the
session. Missing or failed servers are not retried on every write. Run `/lsp`
to see servers that are running, unavailable, or failed.

## Semantic queries

Use `lsp_query` for explicit, token-bounded semantic navigation and code discovery:

```json
{
  "operation": "references",
  "path": "src/service.ts",
  "line": 42,
  "column": 15,
  "includeDeclaration": true
}
```

Supported operations are `declaration`, `definition`, `typeDefinition`,
`implementation`, `references`, `hover`, `documentSymbols`, `workspaceSymbols`,
`callHierarchyIncoming`, `callHierarchyOutgoing`, `typeHierarchySubtypes`, and
`typeHierarchySupertypes`. Hierarchy operations prepare the symbol at the given
position, then return bounded related calls or types. Lines and UTF-16 columns
are one-based. Document operations
synchronize the current file under Pi's mutation queue before requesting a
result. Workspace symbol queries can use `path` to select one server; without a
path they fan out only to already-running servers. Results are deduplicated,
sanitized, and bounded. Semantic query data is requested explicitly and is not
appended to every `read`.

## Explicit validation

Use `lsp_validate` to request current document or workspace diagnostics:

```json
{
  "scope": "document",
  "paths": ["src/service.ts"],
  "severity": "warning"
}
```

Document validation uses LSP 3.17 pull diagnostics when the selected server
advertises them, including cached `resultId`, unchanged reports, related
documents, and diagnostic refresh requests. Other servers fall back to a
version-synchronized push diagnostic wait. Workspace validation is explicit,
requires server support, and can use paths to select relevant running servers.
Results are deduplicated and bounded to protect Pi's context.

## Automatic diagnostics

A successful `read` warms the applicable server in the background. Successful
`write` and `edit` calls then:

1. preserve a version-consistent diagnostic baseline when one is available;
2. run Pi's original filesystem mutation;
3. send only the document notifications negotiated through `textDocumentSync`;
4. wait for diagnostics published for the new document version;
5. report only errors introduced by that mutation.

Warmup waits for the matching diagnostic publication before making its baseline
available; a server timeout or missing publication leaves the baseline
unavailable. If a file has not been warmed yet, the first mutation synchronizes
it but suppresses the delta rather than mislabeling pre-existing errors as new.
Clean files add no model-facing output. Results are sanitized and limited to
eight errors and 2 KiB. A diagnostic that merely moves because lines were
inserted or removed is not reported as new.

## Safe code actions

Use `lsp_code_action` in `list` mode to request a fresh, bounded set of either
`quickfix` or `source.organizeImports` actions. Apply mode makes another fresh
request and requires the exact title to match exactly one action:

```json
{
  "path": "src/service.ts",
  "line": 18,
  "column": 14,
  "kind": "quickfix",
  "mode": "apply",
  "title": "Add missing await"
}
```

Only validated text edits are applied. Disabled actions, commands, resource
operations, confirmation annotations, stale versions, ambiguous titles, and
unversioned targets without request-time snapshots fail closed. The tool never
executes a server command or reuses a cached action identifier.

## Semantic symbol renames

Use `lsp_rename_symbol` to rename an identifier through
`textDocument/prepareRename` and `textDocument/rename`:

```json
{
  "path": "src/service.ts",
  "line": 18,
  "column": 14,
  "newName": "createAccount",
  "dryRun": true
}
```

The tool defaults to dry-run mode. It validates versioned document edits against
the exact synchronized text and version, requires request-time snapshots for
unversioned targets, rejects stale edits, resource operations, overlaps, unsafe
annotations, and edits outside the workspace, and reports bounded per-file edit
and byte counts. Apply mode acquires canonical
mutation queues for every affected file, writes transactionally with rollback,
resynchronizes changed documents, and reports post-edit diagnostics.

## Semantic file renames

Use `lsp_rename_file` instead of `mv`, `git mv`, or write-plus-delete:

```json
{
  "oldPath": "src/old-name.ts",
  "newPath": "src/new-name.ts"
}
```

Both paths must be within one trusted detected workspace. The selected server
must advertise `workspace/willRenameFiles`; the tool fails closed when no
capable installed server is available. Text edits returned outside the
workspace, overlapping edits, non-file URIs, unverifiable versioned document
edits, and nested resource operations are rejected. Queue targets are
canonicalized and acquired in one stable order so symlink aliases cannot
self-deadlock. Edit counts, inserted text, source files, and resulting files are
size-bounded before mutation. If the filesystem rename fails after semantic
edits are applied, the extension attempts to restore the edited files before
any changed document state is synchronized back to the server.

Raw shell moves bypass this protocol and cannot receive the same guarantee.

## Trust and safety

The extension starts language-server processes only when Pi reports the
project as trusted. This matters because servers can load project configuration,
plugins, and dependencies. Project-local executables are considered only in a
trusted project. Server stderr and diagnostic fields are bounded and are never
written to Pi's standard-output protocol channel.

All server processes, pending diagnostic waits, and document state are stopped
idempotently during `session_shutdown`, including reload, resume, fork, new
session, and quit transitions. On POSIX systems, servers run in their own
process groups so bounded shutdown can escalate from protocol exit to `SIGTERM`
and finally `SIGKILL` for the server and its descendants. Windows shutdown uses
`taskkill /T /F` so npm command shims cannot orphan their server processes.

## Current limitations

- The initial release supports stdio language servers and push diagnostics.
- Server installation and upgrades remain user-controlled.
- Server-specific initialization settings are not yet configurable.
- Multi-file text edits cannot be made truly atomic by the filesystem; rollback
  after a partial external failure is best effort.
- File operations performed through `bash` are not intercepted.

## Development

From the repository root:

```sh
npm ci --ignore-scripts
npm --workspace @mopeyjellyfish/pi-lsp test
npm --workspace @mopeyjellyfish/pi-lsp run typecheck
```

For a deterministic Pi session that loads only this package:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e packages/lsp
```

Run `/reload` while Pi is idle after source changes. Dependency changes require
a restart.
