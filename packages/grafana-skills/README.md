# pi-grafana-skills

`@mopeyjellyfish/pi-grafana-skills` is an independent, skill-only Pi package
that redistributes Grafana's official `grafana-oss`, `dashboarding`, and
`promql` Agent Skills. It registers no extension, API client, credential
manager, or install script.

## Install

Install this package in any target repository with Pi:

```sh
pi install npm:@mopeyjellyfish/pi-grafana-skills
```

The skills use the target repository's instructions and its existing Grafana or
Prometheus access. They do not require this monorepo, project-local credentials,
or a Grafana API extension.

## Provenance and license

The skill content is vendored unchanged from
[`grafana/skills@51d33e71e191b409bbd25fc7be2684c610d18166`](https://github.com/grafana/skills/tree/51d33e71e191b409bbd25fc7be2684c610d18166),
from these upstream paths:

- `skills/grafana-core/grafana-oss`
- `skills/grafana-core/dashboarding`
- `skills/grafana-core/promql`

The complete package, including the unchanged Grafana skill content, is
Apache-2.0 licensed. See [`LICENSE`](LICENSE).
