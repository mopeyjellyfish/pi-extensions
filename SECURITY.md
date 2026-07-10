# Security policy

## Supported versions

Only the latest revision of `main` is supported before the first stable package release. Published extension support windows will be documented per package.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private vulnerability reporting for this repository and include:

- the affected package and revision;
- a minimal reproduction;
- expected and observed impact;
- relevant platform and Pi version;
- any suggested mitigation.

Avoid including real credentials, private source code, session transcripts, or unrelated user data. Maintainers will acknowledge a complete report, assess severity, and coordinate disclosure and remediation through the private report.

## Security model

Pi extensions execute arbitrary code with the user's permissions. Installing an extension is equivalent to trusting its source and dependency graph. This repository therefore treats package contents, lifecycle cleanup, process execution, network access, path handling, protocol output, secrets, and dependency updates as security-sensitive changes.
