import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { analyzeUploadedInspirationImages } from "@/lib/inspiration/analyze-uploaded-images";

async function createSolidPng(hex: string) {
  return sharp({
    create: {
      width: 40,
      height: 40,
      channels: 3,
      background: hex,
    },
  })
    .png()
    .toBuffer();
}

async function analyzeImage(hex: string) {
  const buffer = await createSolidPng(hex);
  const file = new File(["placeholder"], "inspiration.png", {
    type: "image/png",
  });

  Object.defineProperty(file, "bufferData", {
    value: new Uint8Array(buffer),
    configurable: true,
  });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () =>
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ),
    configurable: true,
  });

  return analyzeUploadedInspirationImages({
    files: [file],
    imageRecords: [
      {
        id: `img-${hex}`,
        name: "inspiration.png",
        type: "image/png",
        size: buffer.length,
      },
    ],
  });
}

describe("analyzeUploadedInspirationImages", () => {
  it("derives different palette and material cues from different uploaded image colors", async () => {
    const warm = await analyzeImage("#c77957");
    const cool = await analyzeImage("#9cd6de");

    expect(warm.palette).not.toEqual(cool.palette);
    expect(warm.materials).not.toEqual(cool.materials);
    expect(warm.summary).not.toEqual(cool.summary);
  });
});
