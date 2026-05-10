import sharp from "sharp";

import type { InspirationImage, StyleAnalysis } from "@/lib/domain/types";

type NamedColor = {
  name: string;
  rgb: [number, number, number];
  family:
    | "warm-neutral"
    | "cool-neutral"
    | "earth"
    | "green"
    | "blue"
    | "dark";
};

type ImageProfile = {
  pixelCount: number;
  brightnessAverage: number;
  saturationAverage: number;
  warmthAverage: number;
  contrast: number;
  width: number;
  height: number;
  colorHits: Map<string, number>;
};

type UploadedImageLike = Pick<File, "name" | "type" | "size"> & {
  arrayBuffer?: () => Promise<ArrayBuffer>;
  bufferData?: ArrayBuffer | Uint8Array;
};

const namedColors: NamedColor[] = [
  { name: "warm white", rgb: [240, 232, 220], family: "warm-neutral" },
  { name: "linen", rgb: [224, 214, 196], family: "warm-neutral" },
  { name: "sand", rgb: [210, 193, 161], family: "warm-neutral" },
  { name: "stone", rgb: [165, 156, 145], family: "cool-neutral" },
  { name: "taupe", rgb: [151, 131, 111], family: "warm-neutral" },
  { name: "charcoal", rgb: [69, 73, 77], family: "dark" },
  { name: "graphite", rgb: [53, 58, 63], family: "dark" },
  { name: "slate", rgb: [105, 116, 127], family: "cool-neutral" },
  { name: "terracotta", rgb: [188, 103, 71], family: "earth" },
  { name: "clay", rgb: [170, 118, 88], family: "earth" },
  { name: "rust", rgb: [145, 83, 59], family: "earth" },
  { name: "oak", rgb: [175, 145, 97], family: "earth" },
  { name: "walnut", rgb: [103, 76, 54], family: "earth" },
  { name: "sage", rgb: [145, 160, 129], family: "green" },
  { name: "moss", rgb: [111, 128, 84], family: "green" },
  { name: "olive", rgb: [132, 126, 63], family: "green" },
  { name: "sea glass", rgb: [149, 191, 188], family: "blue" },
  { name: "sky", rgb: [140, 182, 210], family: "blue" },
  { name: "deep blue", rgb: [79, 110, 148], family: "blue" },
  { name: "plaster", rgb: [225, 218, 208], family: "warm-neutral" },
];

function nearestNamedColor(r: number, g: number, b: number) {
  let match = namedColors[0];
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of namedColors) {
    const distance =
      (candidate.rgb[0] - r) ** 2 +
      (candidate.rgb[1] - g) ** 2 +
      (candidate.rgb[2] - b) ** 2;

    if (distance < smallestDistance) {
      smallestDistance = distance;
      match = candidate;
    }
  }

  return match;
}

function standardDeviation(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

async function resolveFileBuffer(file: UploadedImageLike) {
  if (file.bufferData && ArrayBuffer.isView(file.bufferData)) {
    return Buffer.from(file.bufferData.buffer, file.bufferData.byteOffset, file.bufferData.byteLength);
  }

  if (file.bufferData instanceof ArrayBuffer) {
    return Buffer.from(file.bufferData);
  }

  if (typeof file.arrayBuffer === "function") {
    return Buffer.from(await file.arrayBuffer());
  }

  throw new Error("Uploaded inspiration image could not be read.");
}

async function profileUploadedImage(file: UploadedImageLike): Promise<ImageProfile> {
  const buffer = await resolveFileBuffer(file);
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();
  const { data, info } = await image
    .resize(48, 48, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const brightnessValues: number[] = [];
  const colorHits = new Map<string, number>();
  let brightnessSum = 0;
  let saturationSum = 0;
  let warmthSum = 0;
  let pixelCount = 0;

  for (let index = 0; index < data.length; index += info.channels) {
    const r = data[index] ?? 0;
    const g = data[index + 1] ?? 0;
    const b = data[index + 2] ?? 0;
    const alpha = info.channels >= 4 ? data[index + 3] ?? 255 : 255;

    if (alpha < 32) {
      continue;
    }

    const brightness = (r + g + b) / (255 * 3);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const warmth = (r - b) / 255;
    const nearest = nearestNamedColor(r, g, b);

    brightnessValues.push(brightness);
    brightnessSum += brightness;
    saturationSum += saturation;
    warmthSum += warmth;
    pixelCount += 1;
    colorHits.set(nearest.name, (colorHits.get(nearest.name) ?? 0) + 1);
  }

  return {
    pixelCount,
    brightnessAverage: pixelCount ? brightnessSum / pixelCount : 0,
    saturationAverage: pixelCount ? saturationSum / pixelCount : 0,
    warmthAverage: pixelCount ? warmthSum / pixelCount : 0,
    contrast: standardDeviation(brightnessValues),
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    colorHits,
  };
}

function createColorSummary(profiles: ImageProfile[]) {
  const colorHits = new Map<string, number>();
  const familyHits = new Map<NamedColor["family"], number>();
  let totalPixels = 0;
  let brightnessWeighted = 0;
  let saturationWeighted = 0;
  let warmthWeighted = 0;
  let contrastWeighted = 0;
  let landscapeCount = 0;

  for (const profile of profiles) {
    totalPixels += profile.pixelCount;
    brightnessWeighted += profile.brightnessAverage * profile.pixelCount;
    saturationWeighted += profile.saturationAverage * profile.pixelCount;
    warmthWeighted += profile.warmthAverage * profile.pixelCount;
    contrastWeighted += profile.contrast * profile.pixelCount;

    if (profile.width >= profile.height) {
      landscapeCount += 1;
    }

    for (const [name, count] of profile.colorHits.entries()) {
      colorHits.set(name, (colorHits.get(name) ?? 0) + count);
      const family = namedColors.find((candidate) => candidate.name === name)?.family;

      if (family) {
        familyHits.set(family, (familyHits.get(family) ?? 0) + count);
      }
    }
  }

  const averageBrightness = totalPixels ? brightnessWeighted / totalPixels : 0;
  const averageSaturation = totalPixels ? saturationWeighted / totalPixels : 0;
  const averageWarmth = totalPixels ? warmthWeighted / totalPixels : 0;
  const averageContrast = totalPixels ? contrastWeighted / totalPixels : 0;
  const landscapeShare = profiles.length ? landscapeCount / profiles.length : 0.5;

  return {
    colorHits,
    familyHits,
    averageBrightness,
    averageSaturation,
    averageWarmth,
    averageContrast,
    landscapeShare,
  };
}

function familyShare(
  familyHits: Map<NamedColor["family"], number>,
  totalHits: number,
  family: NamedColor["family"],
) {
  if (!totalHits) {
    return 0;
  }

  return (familyHits.get(family) ?? 0) / totalHits;
}

function inferAesthetic(
  summary: ReturnType<typeof createColorSummary>,
  filenameHints: string,
) {
  const totalHits = Array.from(summary.familyHits.values()).reduce(
    (sum, count) => sum + count,
    0,
  );
  const warmNeutralShare = familyShare(summary.familyHits, totalHits, "warm-neutral");
  const coolNeutralShare = familyShare(summary.familyHits, totalHits, "cool-neutral");
  const earthShare = familyShare(summary.familyHits, totalHits, "earth");
  const greenShare = familyShare(summary.familyHits, totalHits, "green");
  const blueShare = familyShare(summary.familyHits, totalHits, "blue");
  const darkShare = familyShare(summary.familyHits, totalHits, "dark");

  if (
    blueShare > 0.18 ||
    filenameHints.includes("coast") ||
    filenameHints.includes("beach")
  ) {
    return "breezy coastal modern";
  }

  if (
    summary.averageBrightness > 0.7 &&
    summary.averageSaturation < 0.22 &&
    darkShare < 0.16
  ) {
    return "minimal bright modernism";
  }

  if (
    darkShare > 0.22 ||
    (summary.averageContrast > 0.18 && coolNeutralShare + darkShare > 0.4)
  ) {
    return "quiet premium modernism";
  }

  if (
    earthShare + greenShare + warmNeutralShare > 0.5 ||
    summary.averageWarmth > 0.06 ||
    filenameHints.includes("wood") ||
    filenameHints.includes("timber") ||
    filenameHints.includes("organic")
  ) {
    return "warm organic contemporary";
  }

  return "climate-smart contemporary";
}

function selectPalette(
  summary: ReturnType<typeof createColorSummary>,
  aesthetic: string,
) {
  const sorted = Array.from(summary.colorHits.entries()).sort(
    (left, right) => right[1] - left[1],
  );
  const selected: string[] = [];
  const usedFamilies = new Set<string>();

  for (const [name] of sorted) {
    const family =
      namedColors.find((candidate) => candidate.name === name)?.family ?? "warm-neutral";

    if (selected.includes(name)) {
      continue;
    }

    if (selected.length < 2 || !usedFamilies.has(family)) {
      selected.push(name);
      usedFamilies.add(family);
    }

    if (selected.length === 4) {
      break;
    }
  }

  const fallbackPaletteByAesthetic: Record<string, string[]> = {
    "breezy coastal modern": ["sea glass", "sand", "warm white", "driftwood"],
    "minimal bright modernism": ["warm white", "linen", "stone", "oak"],
    "quiet premium modernism": ["charcoal", "stone", "graphite", "warm white"],
    "warm organic contemporary": ["terracotta", "sage", "stone", "warm white"],
    "climate-smart contemporary": ["terracotta", "stone", "moss", "warm white"],
  };

  for (const fallback of fallbackPaletteByAesthetic[aesthetic] ?? fallbackPaletteByAesthetic["climate-smart contemporary"]) {
    if (!selected.includes(fallback)) {
      selected.push(fallback);
    }

    if (selected.length === 4) {
      break;
    }
  }

  return selected.slice(0, 4);
}

function selectMaterials(
  aesthetic: string,
  palette: string[],
  filenameHints: string,
) {
  const materialsByAesthetic: Record<string, string[]> = {
    "breezy coastal modern": ["bleached oak", "limestone", "brushed aluminum"],
    "minimal bright modernism": ["mineral plaster", "light oak", "large-format porcelain"],
    "quiet premium modernism": ["textured stone", "bronze metal", "smoked oak"],
    "warm organic contemporary": ["reclaimed timber", "limewash", "textured stone"],
    "climate-smart contemporary": ["limewash", "recycled timber", "porcelain tile"],
  };

  const selected = [...(materialsByAesthetic[aesthetic] ?? materialsByAesthetic["climate-smart contemporary"])];

  if (palette.some((name) => ["terracotta", "clay", "rust"].includes(name))) {
    selected.unshift("terracotta tile");
  }

  if (palette.some((name) => ["sage", "moss", "olive"].includes(name))) {
    selected.unshift("natural plaster");
  }

  if (
    palette.some((name) => ["charcoal", "graphite", "slate"].includes(name)) ||
    filenameHints.includes("metal")
  ) {
    selected.push("matte metal");
  }

  if (filenameHints.includes("stone")) {
    selected.unshift("textured stone");
  }

  if (filenameHints.includes("wood") || filenameHints.includes("timber")) {
    selected.unshift("reclaimed timber");
  }

  return Array.from(new Set(selected)).slice(0, 3);
}

function selectLighting(
  summary: ReturnType<typeof createColorSummary>,
  aesthetic: string,
) {
  const primary =
    summary.averageBrightness > 0.7
      ? "sun-washed daylight"
      : summary.averageContrast > 0.18
        ? "directional daylight"
        : "diffused natural light";
  const secondary =
    aesthetic === "quiet premium modernism"
      ? "moody layered evening lighting"
      : "soft ambient evening lighting";

  return [primary, secondary];
}

function selectLayoutPatterns(
  aesthetic: string,
  landscapeShare: number,
) {
  const firstPattern =
    landscapeShare >= 0.5
      ? "wide indoor-outdoor social spaces"
      : "layered threshold transitions";

  const secondPatternByAesthetic: Record<string, string> = {
    "breezy coastal modern": "veranda-like living edges",
    "minimal bright modernism": "clean circulation spine",
    "quiet premium modernism": "gallery-like arrival sequence",
    "warm organic contemporary": "garden-facing shared rooms",
    "climate-smart contemporary": "open kitchen-living flow",
  };

  return [firstPattern, secondPatternByAesthetic[aesthetic] ?? "open kitchen-living flow"];
}

export async function analyzeUploadedInspirationImages({
  files,
  imageRecords,
}: {
  files: UploadedImageLike[];
  imageRecords: InspirationImage[];
}): Promise<StyleAnalysis> {
  const profiles = await Promise.all(files.map((file) => profileUploadedImage(file)));
  const summary = createColorSummary(profiles);
  const filenameHints = imageRecords.map((image) => image.name.toLowerCase()).join(" ");
  const aesthetic = inferAesthetic(summary, filenameHints);
  const palette = selectPalette(summary, aesthetic);
  const materials = selectMaterials(aesthetic, palette, filenameHints);
  const lighting = selectLighting(summary, aesthetic);
  const layoutPatterns = selectLayoutPatterns(aesthetic, summary.landscapeShare);
  const sourceLabel =
    imageRecords.length === 1 ? "The uploaded image" : "The uploaded images";

  return {
    aesthetic,
    palette,
    materials,
    lighting,
    layoutPatterns,
    summary: `${sourceLabel} suggest${imageRecords.length === 1 ? "s" : ""} ${aesthetic} with ${palette.join(
      ", ",
    )} tones and cues toward ${materials.join(", ")}.`,
  };
}
