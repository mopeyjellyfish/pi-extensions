import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";

import { generateImage, type ImageInput } from "./image-generation.ts";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const ImageParameters = Type.Object(
  {
    operation: StringEnum(["generate", "edit"], {
      description: "Generate a new image or edit input images.",
    }),
    prompt: Type.String({ maxLength: 4000, minLength: 1 }),
    outputPath: Type.String({ minLength: 1 }),
    inputPaths: Type.Optional(Type.Array(Type.String({ minLength: 1 }), { maxItems: 4 })),
    maskPath: Type.Optional(Type.String({ minLength: 1 })),
    outputFormat: Type.Optional(StringEnum(["png", "jpeg", "webp"])),
    size: Type.Optional(StringEnum(["1024x1024", "1024x1536", "1536x1024"])),
  },
  { additionalProperties: false },
);

export default function frontendDeveloperExtension(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "image_generation",
    label: "Image Generation",
    description: "Generate or edit a GPT Image 2 artifact at an explicit project path.",
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
