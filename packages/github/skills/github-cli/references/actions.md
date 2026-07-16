# GitHub Actions

Use this reference for pull request checks and GitHub Actions workflows, runs,
jobs, and logs. Keep status queries structured and logs narrowly scoped.

## Start from the target

For a pull request, start with checks rather than searching all runs:

```sh
gh pr checks "$pr" \
  --json bucket,name,state,link,workflow \
  --jq '.[] | {name,state,bucket,workflow,link}'
```

For a branch, commit, workflow, or repository-wide question, list a bounded set
of runs:

```sh
gh run list \
  --branch "$branch" \
  --limit 20 \
  --json databaseId,workflowName,displayTitle,status,conclusion,headBranch,headSha,createdAt,updatedAt,url \
  --jq '.[] | {id:.databaseId,workflow:.workflowName,title:.displayTitle,status,conclusion,branch:.headBranch,sha:.headSha,createdAt,updatedAt,url}'
```

Replace the branch filter with `--commit`, `--workflow`, `--event`, or
`--status` when that is the user's actual scope. Runs associated with a PR are
usually represented most clearly by `gh pr checks`.

## Summarize one run

```sh
gh run view "$run_id" \
  --json databaseId,workflowName,displayTitle,status,conclusion,attempt,headBranch,headSha,createdAt,updatedAt,url,jobs \
  --jq '{
    id: .databaseId,
    workflow: .workflowName,
    title: .displayTitle,
    status,
    conclusion,
    attempt,
    branch: .headBranch,
    sha: .headSha,
    createdAt,
    updatedAt,
    url,
    jobs: [.jobs[] | {
      id: .databaseId,
      name,
      status,
      conclusion,
      startedAt,
      completedAt,
      url
    }]
  }'
```

Report queued/in-progress status separately from completed conclusions. Do not
call a run successful merely because the command returned data.

## Inspect failures without flooding context

Start with only failed logs:

```sh
gh run view "$run_id" --log-failed
```

Potentially large logs belong in the active context-preserving command tool or
a file for filtered analysis. If the run has many failed jobs, get job IDs from
the structured run summary and narrow the request:

```sh
gh run view "$run_id" --job "$job_id" --log-failed
```

Use the job `databaseId` returned by `gh run view --json jobs`; do not copy the
unrelated number from an Actions browser URL. Fetch complete `--log` output
only when failed logs omit context that is necessary to answer the question.

GitHub may be unable to associate some downloaded log lines with a job or step.
Report `UNKNOWN STEP` and missing-log diagnostics as platform limitations rather
than inventing attribution.

## Watch status

Watch only when the user wants to wait for completion:

```sh
gh run watch "$run_id" --compact --exit-status
```

For a non-blocking status request, use one `gh run view` call instead. Do not
start an indefinite watcher in a non-interactive session.

## Rerun, cancel, or dispatch

These commands mutate Actions state and can consume runner time. Show the run
or workflow, ref, inputs, and intended operation first, and run them only after
an explicit request.

```sh
# Rerun only failed jobs and their dependencies.
gh run rerun "$run_id" --failed

# Rerun an explicitly selected job database ID.
gh run rerun "$run_id" --job "$job_id"

# Cancel an active run.
gh run cancel "$run_id"

# Dispatch a workflow on an explicit ref with reviewed inputs.
gh workflow run "$workflow" --ref "$ref" --field key=value
```

After a mutation, query the resulting run once and report its canonical URL and
new state. Never enable or disable a workflow as an incidental fix.

## External checks

A PR can contain external checks from providers such as Buildkite or CircleCI.
`gh pr checks` can report their state and details URL, but `gh run view` only
retrieves GitHub Actions runs. For external checks, report the provider-facing
URL and stop unless a separately available, authorized tool covers that
provider.
