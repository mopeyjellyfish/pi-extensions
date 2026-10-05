import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";

import { DesignBoardService, type DesignBoardInput } from "./design-board.ts";
import { generateImage } from "./image-generation.ts";

import type { ImageInput } from "./image-runtime.ts";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const ImageParameters = Type.Object(
  {
    operation: StringEnum(["generate", "edit"], {
      description: "Generate a new image or edit input images.",
    }),
    prompt: Type.String({ maxLength: 4000, minLength: 1 }),
    outputPath: Type.String({ minLength: 1 }),
    inputPaths: Type.Optional(Type.Array(Type.String({ minLength: 1 }), { maxItems: 4 })),
    outputFormat: Type.Optional(StringEnum(["png"])),
    size: Type.Optional(
      Type.String({
        pattern: "^(auto|[1-9][0-9]{0,3}x[1-9][0-9]{0,3})$",
        description:
          "auto (default) or WIDTHxHEIGHT: edges divisible by 16, at most 3840, ratio at most 3:1, 655360–8294400 pixels. Backend custom-size acceptance is unverified.",
      }),
    ),
  },
  { additionalProperties: false },
);

const DesignBoardParameters = Type.Object(
  {
    action: StringEnum(["present", "status", "open", "close"]),
    title: Type.Optional(Type.String({ maxLength: 160, minLength: 1 })),
    directions: Type.Optional(
      Type.Array(
        Type.Object(
          {
            id: Type.String({ maxLength: 64, minLength: 1 }),
            description: Type.Optional(Type.String({ maxLength: 500 })),
            imagePath: Type.String({ minLength: 1 }),
            label: Type.String({ maxLength: 160, minLength: 1 }),
          },
          { additionalProperties: false },
        ),
        { maxItems: 8, minItems: 2 },
      ),
    ),
    feedbackMode: Type.Optional(StringEnum(["cli", "board"])),
    recommendedDirectionId: Type.Optional(Type.String({ maxLength: 64, minLength: 1 })),
    liveSiteUrl: Type.Optional(Type.String({ maxLength: 2048, minLength: 1 })),
  },
  { additionalProperties: false },
);

export default function frontendDeveloperExtension(pi: ExtensionAPI): void {
  const designBoard = new DesignBoardService(pi);
  pi.on("session_start", async (_event, ctx) => designBoard.restore(ctx));
  pi.on("session_shutdown", async (event) => designBoard.shutdown(event.reason));
  pi.registerTool({
    name: "design_board",
    label: "Design Board",
    description:
      "Present image-backed design directions on a local inspection board with optional board-native feedback.",
    promptSnippet:
      "Create a verified local design inspection board before asking for a visual choice",
    promptGuidelines: [
      "Use design_board present with two to eight inspectable image-backed directions before asking for visual feedback.",
      "Default to feedbackMode cli and collect the visual choice in the CLI; use feedbackMode board only when explicit board-native feedback is useful.",
      "Use design_board status to verify reachability and optional board-native feedback, and use design_board close when the session no longer needs the board.",
    ],
    parameters: DesignBoardParameters,
    async execute(_id, input, signal, _update, ctx) {
      return designBoard.execute(input as DesignBoardInput, signal, ctx);
    },
  });
  pi.registerTool({
    name: "image_generation",
    label: "Image Generation",
    description: "Generate or edit a GPT Image artifact at an explicit project path.",
    promptSnippet: "Generate an inspectable frontend mock-up image",
    promptGuidelines: [
      "Use image_generation only when an explicit image artifact will improve the frontend workflow.",
      "Use image_generation with an explicit outputPath and inspect the saved artifact before treating it as design evidence.",
    ],
    parameters: ImageParameters,
    async execute(_id, input, signal, _update, ctx) {
      return generateImage(input as ImageInput, signal, ctx);
    },
  });
}
