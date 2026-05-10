import type {
  GenerateHomeRequest,
  GeneratedHomeConceptPayload,
  GuidanceSnippet,
  SourceReference
} from "@/lib/domain/home-concept-schema";
import { generatedHomeConceptSchema } from "@/lib/domain/home-concept-schema";
import { sampleStructuredHomeConcept } from "@/lib/domain/sample-structured-home";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function createProjectId(location: string) {
  const base = slugify(location) || "concept";
  return `eco-${base}-${Math.random().toString(36).slice(2, 6)}`;
}

function inferArchitecturalStyle(input: GenerateHomeRequest) {
  const source = `${input.description} ${input.styleAnalysis?.aesthetic ?? ""}`.toLowerCase();

  if (source.includes("coastal")) {
    return "Resilient coastal modern";
  }
  if (source.includes("compact") || source.includes("urban")) {
    return "Compact eco-modern";
  }
  if (source.includes("family")) {
    return "Warm family contemporary";
  }
  if (source.includes("tropical")) {
    return "Climate-smart tropical modern";
  }

  return sampleStructuredHomeConcept.architecturalStyle;
}

function createSummary(
  input: GenerateHomeRequest,
  style: string,
  guidanceSnippets: GuidanceSnippet[]
) {
  const firstGuidance = guidanceSnippets[0]?.content;

  return [
    `A ${style.toLowerCase()} home concept for ${input.location} shaped around ${input.climateRegion} climate needs and a ${input.budgetLevel} budget.`,
    "The fallback concept keeps the plan compact, prioritizes the highest-impact sustainability moves first, and leaves room for future visual-generation work.",
    firstGuidance ?? "Envelope performance, water efficiency, and durable materials stay at the center of the concept."
  ].join(" ");
}

function createScores(input: GenerateHomeRequest) {
  const byClimate = {
    "hot-arid": {
      energyEfficiency: 87,
      waterEfficiency: 82,
      climateResilience: 84,
      materialSustainability: 79,
      environmentalImpact: 83
    },
    temperate: {
      energyEfficiency: 83,
      waterEfficiency: 77,
      climateResilience: 79,
      materialSustainability: 82,
      environmentalImpact: 81
    },
    cold: {
      energyEfficiency: 90,
      waterEfficiency: 74,
      climateResilience: 88,
      materialSustainability: 81,
      environmentalImpact: 85
    },
    tropical: {
      energyEfficiency: 81,
      waterEfficiency: 80,
      climateResilience: 85,
      materialSustainability: 78,
      environmentalImpact: 80
    },
    "flood-prone": {
      energyEfficiency: 79,
      waterEfficiency: 84,
      climateResilience: 92,
      materialSustainability: 80,
      environmentalImpact: 82
    }
  } as const;

  const affordability =
    input.budgetLevel === "low" ? 90 : input.budgetLevel === "medium" ? 82 : 73;
  const climateScores = byClimate[input.climateRegion];
  const total = Math.round(
    (
      climateScores.energyEfficiency +
      climateScores.waterEfficiency +
      climateScores.climateResilience +
      climateScores.materialSustainability +
      affordability +
      climateScores.environmentalImpact
    ) / 6
  );

  return {
    total,
    affordability,
    ...climateScores
  };
}

function createVisualPrompts(input: GenerateHomeRequest, style: string) {
  return {
    exteriorPrompt:
      `Architectural exterior render of a ${style.toLowerCase()} home in ${input.location}, designed for a ${input.climateRegion} climate with low-impact materials, layered landscaping, and sustainability features visible in a calm editorial composition.`,
    interiorPrompt:
      `Interior render of a ${style.toLowerCase()} sustainable home with durable materials, daylight-led planning, flexible living zones, and refined eco-conscious detailing suited to a ${input.budgetLevel} budget.`
  };
}

function createSourceReferences(
  guidanceSnippets: GuidanceSnippet[],
): SourceReference[] {
  return guidanceSnippets
    .map((snippet) => ({
      title: snippet.title,
      source: snippet.source,
      filename: snippet.source,
    }))
    .filter(
      (reference, index, references) =>
        references.findIndex(
          (candidate) =>
            candidate.title === reference.title &&
            candidate.source === reference.source &&
            candidate.filename === reference.filename,
        ) === index,
    )
    .slice(0, 8);
}

export function createFallbackStructuredHomeConcept({
  input,
  guidanceSnippets
}: {
  input: GenerateHomeRequest;
  guidanceSnippets: GuidanceSnippet[];
}): GeneratedHomeConceptPayload {
  const style = inferArchitecturalStyle(input);
  const summary = createSummary(input, style, guidanceSnippets);
  const scores = createScores(input);

  return generatedHomeConceptSchema.parse({
    ...sampleStructuredHomeConcept,
    projectId: createProjectId(input.location),
    generatedAt: new Date().toISOString(),
    sourcePrompt: input.description,
    conceptSummary: summary,
    location: input.location,
    climateType: input.climateRegion,
    budgetLevel: input.budgetLevel,
    architecturalStyle: style,
    sustainabilityScore: scores,
    visualPrompts: createVisualPrompts(input, style),
    sources: createSourceReferences(guidanceSnippets),
    inspirationImages: input.inspirationImages,
    styleAnalysis: input.styleAnalysis,
    guidanceSnippets
  });
}
