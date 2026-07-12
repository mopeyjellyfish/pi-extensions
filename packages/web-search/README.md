# pi-web-search

`@mopeyjellyfish/pi-web-search` adds a `web_search` tool to Pi. It asks the
selected model provider to search the live web and returns the grounded answer
and deduplicated source links.

## Install

Install the repository aggregate to get this extension with the other packages:

```sh
pi install git:github.com/mopeyjellyfish/pi-extensions
```

Use `pi update --all` to update an unpinned Git installation. See the
[root README](../../README.md) for local and project-scoped installation.

## Use web search

Select and authenticate a compatible model in Pi, then ask for information
that needs the live web. Pi can call `web_search` with a query and will receive
the provider-generated answer plus a `Sources` list.

By default, the extension uses the current conversation model. It supports
models exposed by Pi through these provider API families:

- `openai-responses`, including current GPT models;
- `openai-codex-responses`, including current Codex models;
- `anthropic-messages`, including current Claude models;
- `google-generative-ai`, including current Gemini models.

Support is based on the model's Pi API family, not a hard-coded model-name
allowlist. New compatible OpenAI, Anthropic, and Google models therefore work
as Pi adds them to its model catalog. Unsupported APIs fail clearly instead of
silently switching models or providers.

Web results are untrusted external content. Review consequential claims and
follow the returned source links before acting on them.

## Write effective searches

Give `web_search` one focused, self-contained question. Include constraints the
provider needs in that query, such as the relevant date, region, preferred
domains, or source-quality requirements:

```text
Find the current stable Pi release as of July 2026. Prefer the official Pi
repository and documentation.
```

Start with one search. Search again only when the first answer leaves a
specific information gap; this avoids repeated provider calls and gives the
model a clearer retrieval target.

The extension uses provider-conscious efficiency defaults:

- reasoning-capable OpenAI Responses models use low reasoning effort;
- Anthropic searches allow at most five searches and 4,096 output tokens;
- provider output, errors, and streaming updates stay within Pi's limits;
- final output keeps a visible source section even when a long answer is
  truncated, showing up to 20 sources and reporting omissions.

These defaults target normal coding-agent lookups. Break broad research into
focused follow-up questions when one search cannot cover it reliably. See the
official [OpenAI web-search guide](https://developers.openai.com/api/docs/guides/tools-web-search)
and [Anthropic web-search guide](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)
for the underlying provider behavior.

## Choose a dedicated search model

Create `.pi/web-search.json` in a trusted project or worktree when web search
should use a different model from the conversation:

```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-5"
}
```

The `provider` and `model` values must identify a model in Pi's model registry.
This project-local file is read only after Pi trusts the project. Because it is
resolved from Pi's starting directory, linked worktrees can choose independent
search models; start Pi inside the worktree being tested.

For a user-wide default, put the same JSON shape in
`~/.pi/agent/web-search.json`. Configuration precedence is:

1. the file named by `PI_WEB_SEARCH_CONFIG`;
2. `<project>/.pi/web-search.json` for a trusted project;
3. `~/.pi/agent/web-search.json`;
4. the current conversation model.

`PI_WEB_SEARCH_CONFIG` is intended for automation and isolated testing. A
configured file must exist and contain only non-empty `provider` and `model`
strings. Invalid, missing, unknown, or unsupported explicit selections stop
the tool before it sends a provider request.

## Develop with reload

From the target checkout or linked worktree:

```sh
nvm use
npm ci --ignore-scripts
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e packages/web-search
```

Approve project trust only after reviewing the checkout. Run `/reload` while
Pi is idle after editing TypeScript or package metadata. Restart Pi after
changing dependencies or startup flags.

Run the focused suite without making real provider requests:

```sh
npm --workspace @mopeyjellyfish/pi-web-search test
```

The tests mock only the provider network boundary and cover current-model and
configured-model selection, OpenAI Responses and Codex, Anthropic API-key and
OAuth authentication, Gemini grounding, citations, invalid configuration, and
output truncation.
