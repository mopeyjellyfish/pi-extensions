# pi-simple-english

`@mopeyjellyfish/pi-simple-english` is an independent Pi extension and skill
package. It tells Pi to write clear human-facing text with pragmatic ASD-STE100
Simplified Technical English rules.

The repository aggregate loads the extension and skill automatically. To
install only this package, run:

```sh
pi install npm:@mopeyjellyfish/pi-simple-english
```

## Automatic output guidance

Before each agent turn, the extension adds concise writing guidance to the
system prompt. By default, the guidance applies to human-facing prose. Explicit
user and project requirements control the language, tone, style, and format. The
guidance tells the agent not to omit or weaken requirements, uncertainty,
tradeoffs, risks, or technical detail. It preserves exact code, identifiers,
commands, flags, paths, URLs, product and API names, quotations, citations,
normative contract words, and required document structure.

The extension changes instructions before generation. It does not rewrite
completed output. Technical accuracy has priority over style. Disable or remove
the package if you do not want this default.

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
