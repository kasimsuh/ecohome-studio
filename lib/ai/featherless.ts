import OpenAI from "openai";

import {
  generatedHomeConceptSchema,
  homeConceptSchema,
  type GenerateHomeRequest,
  type GeneratedHomeConceptPayload,
  type GuidanceSnippet,
  type HomeConcept,
  type SourceReference,
} from "@/lib/domain/home-concept-schema";

const FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1";

function createProjectId(location: string) {
  const slug = location
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return `eco-${slug || "concept"}-${Math.random().toString(36).slice(2, 6)}`;
}

function getClient() {
  const apiKey = process.env.FEATHERLESS_API_KEY;
  const model = process.env.FEATHERLESS_MODEL;
  const baseURL = process.env.FEATHERLESS_BASE_URL || FEATHERLESS_BASE_URL;

  if (!apiKey || !model) {
    throw new Error(
      "Featherless credentials are not configured. Set FEATHERLESS_API_KEY and FEATHERLESS_MODEL."
    );
  }

  return {
    model,
    client: new OpenAI({
      apiKey,
      baseURL
    })
  };
}

function clampScore(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Model output did not contain a valid JSON object.");
    }

    return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
  }
}

function normalizeHomeConceptCandidate(
  candidate: unknown,
  input: GenerateHomeRequest,
  guidanceSnippets: GuidanceSnippet[],
): HomeConcept {
  if (!candidate || typeof candidate !== "object") {
    throw new Error("Model output was not an object.");
  }

  const raw = candidate as Record<string, unknown>;
  const rawScore =
    raw.sustainabilityScore && typeof raw.sustainabilityScore === "object"
      ? (raw.sustainabilityScore as Record<string, unknown>)
      : {};
  const normalizedScore = {
    energyEfficiency: clampScore(rawScore.energyEfficiency),
    waterEfficiency: clampScore(rawScore.waterEfficiency),
    climateResilience: clampScore(rawScore.climateResilience),
    materialSustainability: clampScore(rawScore.materialSustainability),
    affordability: clampScore(rawScore.affordability),
    environmentalImpact: clampScore(rawScore.environmentalImpact)
  };
  const total = Math.round(
    (
      normalizedScore.energyEfficiency +
      normalizedScore.waterEfficiency +
      normalizedScore.climateResilience +
      normalizedScore.materialSustainability +
      normalizedScore.affordability +
      normalizedScore.environmentalImpact
    ) / 6
  );

  const visualPrompts =
    raw.visualPrompts && typeof raw.visualPrompts === "object"
      ? (raw.visualPrompts as Record<string, unknown>)
      : {};
  const rawSources = Array.isArray(raw.sources) ? raw.sources : [];

  const normalizedSources = rawSources
    .map((entry): SourceReference | null => {
      const sourceEntry =
        entry && typeof entry === "object"
          ? (entry as Record<string, unknown>)
          : {};
      const source =
        typeof sourceEntry.source === "string"
          ? sourceEntry.source
          : typeof sourceEntry.filename === "string"
            ? sourceEntry.filename
            : "";
      const filename =
        typeof sourceEntry.filename === "string"
          ? sourceEntry.filename
          : typeof sourceEntry.source === "string"
            ? sourceEntry.source
            : undefined;
      const page =
        typeof sourceEntry.page === "number" && Number.isInteger(sourceEntry.page)
          ? sourceEntry.page
          : undefined;
      const title =
        typeof sourceEntry.title === "string"
          ? sourceEntry.title
          : typeof sourceEntry.label === "string"
            ? sourceEntry.label
            : source
              ? `${source} guidance`
              : "";

      if (!title.trim() || !source.trim()) {
        return null;
      }

      return {
        title,
        source,
        filename,
        page,
      };
    })
    .filter((source): source is SourceReference => source !== null);

  const fallbackSources = guidanceSnippets
    .map((snippet) => ({
      title: snippet.title,
      source: snippet.source,
      filename: snippet.source,
    }))
    .filter(
      (source, index, sources) =>
        sources.findIndex(
          (candidate) =>
            candidate.title === source.title &&
            candidate.source === source.source &&
            candidate.filename === source.filename,
        ) === index,
    )
    .slice(0, 8);

  const normalized = {
    ...raw,
    conceptSummary:
      typeof raw.conceptSummary === "string"
        ? raw.conceptSummary
        : typeof raw.summary === "string"
          ? raw.summary
          : "",
    location:
      typeof raw.location === "string" && raw.location.trim()
        ? raw.location
        : input.location,
    climateType:
      typeof raw.climateType === "string"
        ? raw.climateType
        : typeof raw.climateRegion === "string"
          ? raw.climateRegion
          : input.climateRegion,
    budgetLevel:
      typeof raw.budgetLevel === "string" ? raw.budgetLevel : input.budgetLevel,
    sustainabilityScore: {
      ...normalizedScore,
      total
    },
    upgrades: Array.isArray(raw.upgrades)
      ? raw.upgrades.map((upgrade) => {
          const entry = upgrade as Record<string, unknown>;

          return {
            ...entry,
            impactLevel:
              typeof entry.impactLevel === "string"
                ? entry.impactLevel
                : typeof entry.impact === "string"
                  ? entry.impact
                  : "Medium",
            explanation:
              typeof entry.explanation === "string"
                ? entry.explanation
                : typeof entry.rationale === "string"
                  ? entry.rationale
                  : "",
            estimatedBenefit:
              typeof entry.estimatedBenefit === "string"
                ? entry.estimatedBenefit
                : typeof entry.estimatedSavings === "string"
                  ? entry.estimatedSavings
                  : ""
          };
        })
      : [],
    visualPrompts: {
      exteriorPrompt:
        typeof visualPrompts.exteriorPrompt === "string"
          ? visualPrompts.exteriorPrompt
          : "",
      interiorPrompt:
        typeof visualPrompts.interiorPrompt === "string"
          ? visualPrompts.interiorPrompt
          : ""
    },
    sources: normalizedSources.length ? normalizedSources.slice(0, 8) : fallbackSources,
    model3D: {
      ...(raw.model3D && typeof raw.model3D === "object" ? raw.model3D : {}),
      windows: Array.isArray((raw.model3D as Record<string, unknown> | undefined)?.windows)
        ? (raw.model3D as Record<string, unknown>).windows
        : [],
      doors: Array.isArray((raw.model3D as Record<string, unknown> | undefined)?.doors)
        ? (raw.model3D as Record<string, unknown>).doors
        : [],
      sustainabilityFeatures: {
        solarPanels: Boolean(
          (raw.model3D as Record<string, unknown> | undefined)?.sustainabilityFeatures &&
            (raw.model3D as Record<string, unknown>).sustainabilityFeatures &&
            (
              (raw.model3D as Record<string, unknown>).sustainabilityFeatures as Record<
                string,
                unknown
              >
            ).solarPanels
        ),
        greenRoof: Boolean(
          (
            (raw.model3D as Record<string, unknown>)?.sustainabilityFeatures as Record<
              string,
              unknown
            > | undefined
          )?.greenRoof
        ),
        rainwaterTank: Boolean(
          (
            (raw.model3D as Record<string, unknown>)?.sustainabilityFeatures as Record<
              string,
              unknown
            > | undefined
          )?.rainwaterTank
        ),
        trees: Boolean(
          (
            (raw.model3D as Record<string, unknown>)?.sustainabilityFeatures as Record<
              string,
              unknown
            > | undefined
          )?.trees
        ),
        permeableDriveway: Boolean(
          (
            (raw.model3D as Record<string, unknown>)?.sustainabilityFeatures as Record<
              string,
              unknown
            > | undefined
          )?.permeableDriveway
        ),
        crossVentilation: Boolean(
          (
            (raw.model3D as Record<string, unknown>)?.sustainabilityFeatures as Record<
              string,
              unknown
            > | undefined
          )?.crossVentilation
        )
      }
    }
  };

  return homeConceptSchema.parse(normalized);
}

function buildMessages(input: GenerateHomeRequest, guidanceSnippets: GuidanceSnippet[]) {
  const systemPrompt = `
You are generating a compact sustainable home concept for EcoHome Studio.
Return JSON only. Do not include markdown, explanations, or code fences.
Never say that you cannot create 3D assets. Instead, describe a renderable structured concept.

Required top-level keys:
- conceptSummary
- location
- climateType
- budgetLevel
- architecturalStyle
- sustainabilityScore
- floorPlan
- model3D
- upgrades
- materials
- visualPrompts
- sources

Requirements:
- Keep conceptSummary compact and under 120 words.
- sustainabilityScore must include total, energyEfficiency, waterEfficiency, climateResilience, materialSustainability, affordability, environmentalImpact.
- floorPlan must include width, height, and rooms.
- Each room must include name, x, y, width, height, floor, type.
- model3D must include floors, roofType, wallMaterial, exteriorColor, windows, doors, sustainabilityFeatures.
- windows and doors must be arrays of objects with wall, offset, width, height, floor.
- sustainabilityFeatures must include booleans for solarPanels, greenRoof, rainwaterTank, trees, permeableDriveway, crossVentilation.
- upgrades should be compact and actionable.
- materials should be concise and sustainability-focused.
- visualPrompts must include exteriorPrompt and interiorPrompt.
- sources must be an array of the grounding references you actually used.
- Each source should include title, source, and filename when available. Include page when available.
- Use realistic dimensions and simple geometry-friendly layouts.
`.trim();

  const groundingContext = guidanceSnippets.map((snippet, index) => ({
    id: index + 1,
    title: snippet.title,
    source: snippet.source,
    filename: snippet.source,
    content: snippet.content,
  }));

  const userPrompt = JSON.stringify(
    {
      input: {
        description: input.description,
        location: input.location,
        climateRegion: input.climateRegion,
        budgetLevel: input.budgetLevel,
        styleAnalysis: input.styleAnalysis ?? null,
        inspirationImages: input.inspirationImages
      },
      retrievedSustainabilityContext: groundingContext
    },
    null,
    2
  );

  return [
    {
      role: "system" as const,
      content: systemPrompt
    },
    {
      role: "user" as const,
      content: userPrompt
    }
  ];
}

export async function generateStructuredHomeConceptWithFeatherless({
  input,
  guidanceSnippets
}: {
  input: GenerateHomeRequest;
  guidanceSnippets: GuidanceSnippet[];
}): Promise<GeneratedHomeConceptPayload> {
  const { client, model } = getClient();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: {
      type: "json_object"
    },
    messages: buildMessages(input, guidanceSnippets)
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Featherless returned an empty response.");
  }

  const parsed = extractJsonObject(content);
  const normalized = normalizeHomeConceptCandidate(parsed, input, guidanceSnippets);

  return generatedHomeConceptSchema.parse({
    ...normalized,
    projectId: createProjectId(input.location),
    generatedAt: new Date().toISOString(),
    sourcePrompt: input.description,
    inspirationImages: input.inspirationImages,
    styleAnalysis: input.styleAnalysis,
    guidanceSnippets
  });
}
