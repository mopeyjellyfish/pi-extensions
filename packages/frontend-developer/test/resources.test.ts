import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);

async function resource(path: string): Promise<string> {
  return readFile(new URL(path, root), "utf8");
}

describe("design review resource contract", () => {
  it("requires compact image-backed, verified board feedback and lifecycle control for material design", async () => {
    expect.hasAssertions();
    const [prompt, frontendDesign, interfaceDesign, imageGeneration, visualValidation, readme] =
      await Promise.all([
        resource("prompts/design.md"),
        resource("skills/frontend-design/SKILL.md"),
        resource("skills/interface-design/SKILL.md"),
        resource("skills/image-generation/SKILL.md"),
        resource("skills/visual-validation/SKILL.md"),
        resource("README.md"),
      ]);
    expect(prompt).toMatch(/design_board[\s\S]*before asking for a visual choice/iu);
    expect(frontendDesign).toMatch(/mechanical[\s\S]*direct/iu);
    expect(interfaceDesign).toMatch(/at\s+most four/iu);
    expect(interfaceDesign).toMatch(/two to eight[\s\S]*image evidence/iu);
    expect(interfaceDesign).toMatch(
      /design_board[\s\S]*verif[\s\S]*URL[\s\S]*before requesting[\s\S]*feedback/iu,
    );
    expect(interfaceDesign).toMatch(/feedbackMode:[^\n]*cli[\s\S]*question/iu);
    expect(interfaceDesign).toMatch(
      /For image-backed CLI feedback,[^.]*question[^.]*presentation:\s*"inline"[^.]*below[^.]*\.[^.]*fallback\./iu,
    );
    expect(readme).toMatch(
      /For image-backed CLI feedback,[^.]*presentation:\s*"inline"[^.]*below[^.]*\.[^.]*fallback\./iu,
    );
    expect(interfaceDesign).toMatch(/separate target-owned live-site\s+URL/iu);
    expect(interfaceDesign).toMatch(/milestone[\s\S]*same\s+`design_board`/iu);
    expect(interfaceDesign).toMatch(/open[\s\S]*keep serving[\s\S]*close/iu);
    expect(imageGeneration).toMatch(/explicit consent/iu);
    expect(visualValidation).toMatch(/unmet proof/iu);
    expect(readme).toMatch(/board\/site distinction/iu);
    expect(readme).toMatch(/localhost-only/iu);
    expect(readme).toMatch(/full-width visual[\s\S]*feedbackMode: "board"/iu);
    expect(readme).toMatch(/unavailable review surface/iu);
  });
});
