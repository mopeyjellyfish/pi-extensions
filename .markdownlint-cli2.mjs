export default {
  config: {
    default: true,
    MD013: false,
    MD024: { siblings_only: true },
    MD033: false,
  },
  overrides: [
    {
      filter: "packages/*/prompts/*.md",
      config: { MD041: false },
      combine: "merge",
    },
  ],
  globs: [
    "**/*.md",
    "!node_modules/**",
    "!coverage/**",
    "!.pi-subagents/**",
    "!.pi/subagents/**",
    "!packages/*/CHANGELOG.md",
  ],
};
