# Pull requests

Use this reference for pull request creation, inspection, comments, reviews, and
checks. Let an explicit number or URL win; otherwise `gh pr view` without an
argument resolves the pull request for the current branch.

## Resolve and summarize

```sh
gh pr view "$pr" \
  --json number,title,url,state,isDraft,author,baseRefName,headRefName,reviewDecision \
  --jq '{number,title,url,state,isDraft,author:.author.login,base:.baseRefName,head:.headRefName,reviewDecision}'
```

For the current branch, omit `"$pr"`. Open the resolved PR in a browser only
when requested:

```sh
gh pr view "$pr" --web
```

## Create a pull request

Before running `gh pr create`:

1. Inspect repository rules, worktree status, the commit range, and the diff.
2. Resolve and state the base and head. Confirm the remote head already exists;
   do not let `gh` push or fork interactively.
3. Draft and show the exact title and body. Use repository templates and issue
   closing syntax only when applicable.
4. Ask about draft state, reviewers, assignees, and labels only when they are
   material or required by repository policy.

Create with explicit inputs:

```sh
gh pr create \
  --base "$base" \
  --head "$head" \
  --title "$title" \
  --body-file "$body_file"
```

Add `--draft` only when requested. Do not use `--dry-run` as a no-mutation
safety check because the command may still push. After creation, report the URL
printed by `gh`, then verify the new PR with one structured `gh pr view` call.

## Pull comments and review feedback

PR feedback has separate surfaces:

1. Conversation comments on the PR issue.
2. Review summaries such as approved, commented, or changes requested.
3. Inline review-thread comments, including thread resolution state.

Fetch conversation comments and review summaries together:

```sh
gh pr view "$pr" --json comments,reviews --jq '{
  comments: [.comments[] | {
    author: .author.login,
    createdAt,
    body,
    url
  }],
  reviews: [.reviews[] | {
    author: .author.login,
    state,
    submittedAt,
    body
  }]
}'
```

`gh pr view --comments` is useful for humans but is not a complete structured
representation of inline review threads. Normalize a number, URL, or branch to
the numeric PR ID required by GraphQL; for the current branch, omit `"$pr"`:

```sh
pr_number="$(gh pr view "$pr" --json number --jq '.number')"
```

Then fetch up to 100 review threads:

```sh
gh api graphql \
  -F owner='{owner}' \
  -F name='{repo}' \
  -F number="$pr_number" \
  -f query='query($owner:String!, $name:String!, $number:Int!) {
    repository(owner:$owner, name:$name) {
      pullRequest(number:$number) {
        reviewThreads(first:100) {
          nodes {
            isResolved
            isOutdated
            path
            line
            comments(first:100) {
              nodes { author { login } body createdAt url }
            }
          }
        }
      }
    }
  }' \
  --jq '.data.repository.pullRequest.reviewThreads.nodes | map({
    isResolved,
    isOutdated,
    path,
    line,
    comments: [.comments.nodes[] | {
      author: .author.login,
      body,
      createdAt,
      url
    }]
  })'
```

Keep the 100-thread and 100-comments-per-thread bounds unless the user needs
exhaustive history. If either result reaches its bound, report that it may be
incomplete before considering a cursor-paginated query. Summarize unresolved,
current threads first and retain comment URLs so the user can verify context.

## Leave a comment or review

A general PR conversation comment is a mutation. Show the target PR and exact
body, then preserve the multiline text through standard input:

```sh
gh pr comment "$pr" --body-file - <<'EOF'
<reviewed comment body>
EOF
```

Use `gh pr review "$pr" --comment --body-file -` only when the user asked to
submit a formal review. Approval and change requests are materially different
operations; never infer them from a request to leave a comment. Inline comments
require file, line/side, and commit context through `gh api`; inspect
`gh api --help` and the current GitHub endpoint contract instead of guessing
those coordinates.

## Pull request checks

Get a bounded structured status summary:

```sh
gh pr checks "$pr" \
  --json bucket,name,state,link,workflow \
  --jq '.[] | {name,state,bucket,workflow,link}'
```

Use `--required` only when the user wants required checks rather than every
reported check. Follow GitHub Actions links with the Actions reference. For an
external check, report its name, state, and details URL; do not claim that
`gh run view` can retrieve another provider's logs.
