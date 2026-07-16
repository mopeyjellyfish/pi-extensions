# Issues and labels

Use this reference for issue discovery, details, comments, lifecycle changes,
assignees, milestones, and labels. Resolve the repository and explicit issue
number before a mutation.

## List and inspect issues

List a bounded, structured result:

```sh
gh issue list \
  --state open \
  --limit 30 \
  --json number,title,state,author,assignees,labels,updatedAt,url \
  --jq '.[] | {
    number,
    title,
    state,
    author: .author.login,
    assignees: [.assignees[].login],
    labels: [.labels[].name],
    updatedAt,
    url
  }'
```

Use `--label`, `--assignee`, `--author`, `--milestone`, or `--search` to narrow
the server-side result. Do not fetch every state or hundreds of issues and then
filter locally when a supported filter exists.

Inspect one issue, including its conversation:

```sh
gh issue view "$issue" --json number,title,state,stateReason,author,assignees,labels,milestone,body,comments,createdAt,updatedAt,url --jq '{
  number,
  title,
  state,
  stateReason,
  author: .author.login,
  assignees: [.assignees[].login],
  labels: [.labels[].name],
  milestone: .milestone.title,
  body,
  comments: [.comments[] | {
    author: .author.login,
    createdAt,
    body,
    url
  }],
  createdAt,
  updatedAt,
  url
}'
```

Issue and PR numbers share the repository's issue namespace. If the target may
be a PR, verify its type rather than editing it as an issue by accident.

## Create an issue

Read issue templates and repository policy first. Show the exact title, body,
labels, assignees, and milestone before creation. Keep the body in a reviewed
file when it contains substantial Markdown:

```sh
gh issue create \
  --title "$title" \
  --body-file "$body_file" \
  --label "$label"
```

Omit optional flags rather than inventing metadata. Add repeated `--label` or
other assignment flags only when explicitly requested or required by policy.
Report and then verify the URL returned by `gh issue create`.

## Comment on an issue

A request to pull comments is read-only; do not turn it into a response. When a
new comment is explicitly requested, show its target and exact body, then use
standard input to preserve Markdown:

```sh
gh issue comment "$issue" --body-file - <<'EOF'
<reviewed comment body>
EOF
```

Do not use `--edit-last` or `--delete-last` unless the user specifically asks
to change their prior comment.

## Edit issue metadata

Use one `gh issue edit` call for the requested fields only:

```sh
# Add or remove labels.
gh issue edit "$issue" --add-label "$add_label" --remove-label "$remove_label"

# Change title or body.
gh issue edit "$issue" --title "$title" --body-file "$body_file"

# Update assignment or milestone.
gh issue edit "$issue" --add-assignee "$login" --milestone "$milestone"
```

Before editing several issue numbers at once, list every target and the shared
change. Never infer bulk scope from a search result.

## Close or reopen

State transitions require an explicit request and a current-state check:

```sh
# Reasons are completed, not planned, or duplicate on supported gh versions.
gh issue close "$issue" --reason "$reason"

gh issue reopen "$issue"
```

If a substantial closing explanation is required, add it with
`gh issue comment --body-file -` before closing, but treat those as two visible
mutations. Use duplicate linkage only after verifying the canonical issue.

## Manage labels

List existing labels before assigning or creating one:

```sh
gh label list \
  --limit 100 \
  --json name,color,description \
  --jq '.[] | {name,color,description}'
```

Prefer assigning an existing label with `gh issue edit --add-label`. Creating,
editing, deleting, or cloning repository labels changes shared taxonomy and
requires a separate explicit request:

```sh
gh label create "$name" --color "$color" --description "$description"
gh label edit "$name" --name "$new_name" --color "$color" --description "$description"
gh label delete "$name"
gh label clone "$source_repo"
```

Consult the relevant `gh label <command> --help` before uncommon or destructive
label operations. Never delete or rename a label merely because it appears
unused in a bounded issue query.
