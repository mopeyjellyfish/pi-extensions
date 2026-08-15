# pi-engineering

`@mopeyjellyfish/pi-engineering` is an independent skill-and-prompt package. It
provides `implement` plus optional focused skills for TDD, design, diagnosis,
domain language, and review. It has no extension or runtime dependency.

The root profile loads only `implement`. Its default path uses the direct parent:

```text
accepted slice -> focused change -> focused tests -> required checks -> evidence
```

Optional delegation is limited to one bounded independent lane with a
host-provided role. The parent stays responsible for writing, synthesis, final
diff inspection, and verification.

Install the complete independent package from a repository checkout:

```sh
pi install /path/to/pi-extensions/packages/engineering
```

The focused implementation, TDD, codebase-design, and diagnosis methods adapt
MIT-licensed guidance from [mattpocock/skills](https://github.com/mattpocock/skills)
at the commit recorded in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
