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
    "!**/node_modules/**",
    "!coverage/**",
    "!.pi-subagents/**",
    "!.pi/subagents/**",
    "!packages/*/CHANGELOG.md",
    "!packages/grafana-skills/skills/**",
    "!packages/go/skills/go/SKILL.md",
    "!packages/go/skills/cobra-viper/SKILL.md",
    "!packages/go/skills/go-spec-reviewer/SKILL.md",
    // Preserve source-derived Vercel React skill trees, including bounded local integration.
    "!packages/frontend-developer/skills/react-best-practices/**",
    "!packages/frontend-developer/skills/react-native-skills/**",
    "!packages/frontend-developer/skills/react-view-transitions/**",
  ],
};
