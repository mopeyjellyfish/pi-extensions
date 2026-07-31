# pi-simple-english

`@mopeyjellyfish/pi-simple-english` is an independent, skill-only Pi package. It
helps Pi write clear human-facing text with pragmatic ASD-STE100 Simplified
Technical English rules.

The repository aggregate loads this skill automatically. To install only this
package, run:

```sh
pi install npm:@mopeyjellyfish/pi-simple-english
```

## Skill

The `simple-english` skill applies to documentation and communication where
misreading has a cost. Examples include pitches, plans, READMEs, runbooks, error
messages, release notes, incident reports, agent instructions, and pull request
text.

Pragmatic mode is the default. It keeps necessary technical terms and applies
clear sentence, vocabulary, and structure rules. Strict mode applies only when
the user explicitly requests STE or ASD-STE100 compliance. Full compliance
requires the official ASD-STE100 specification and dictionary.

The skill does not change code, identifiers, commands, paths, links, quoted
text, or required document structure. It is practical writing guidance, not the
official ASD-STE100 specification or a compliance certificate.
