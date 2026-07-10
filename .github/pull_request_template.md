# Pull request

## Summary

<!-- Describe the focused change and affected package(s). -->

## Risk and security

<!-- Describe permissions, process/network/file access, dependencies, package contents, and platform constraints. -->

## Validation

- [ ] Pull request title and every commit follow Conventional Commits
- [ ] `npm run check`
- [ ] `npm run workflows:check` when workflows changed
- [ ] `npm run security:check` when dependencies or installation changed
- [ ] Source and packed Pi smoke tests passed
- [ ] No credentials, local paths, generated artifacts, or session data are included
- [ ] Dependency changes passed the release-age gate, or a security exception is documented

## Evidence

<!-- Include commands, exit codes, coverage, and relevant manual checks. -->
