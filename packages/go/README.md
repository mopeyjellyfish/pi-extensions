# pi-go

`@mopeyjellyfish/pi-go` is an independent, skill-only Pi package for idiomatic
Go programming guidance. It registers no extension, runtime dependency, or
install script.

## Install

Install this package in any target repository with Pi:

```sh
pi install npm:@mopeyjellyfish/pi-go
```

Pi discovers three skills from this package. All use the target repository's
instructions and Go toolchain:

- `go` activates for general Go code, modules, tools, services, reviews, and
  refactors.
- `cobra-viper` activates when a Go CLI needs commands, subcommands, flags, or
  CLI configuration, including when Cobra or Viper are not named.
- `go-spec-reviewer` activates when a Go specification, design document, RFC,
  PRD, or pitch needs review before implementation.
