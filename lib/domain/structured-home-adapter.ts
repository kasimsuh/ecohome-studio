import { budgetLabels, climateLabels } from "@/lib/domain/constants";
import type { GeneratedHomeConceptPayload } from "@/lib/domain/home-concept-schema";
import type {
  BudgetLevel,
  ClimateRegion,
  GeneratedHomeConcept,
  Recommendation,
  SustainabilityScore,
  VisualPrompt
} from "@/lib/domain/types";

function listToSentence(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function clampPercent(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function formatRoofType(roofType: GeneratedHomeConceptPayload["model3D"]["roofType"]) {
  return roofType.charAt(0).toUpperCase() + roofType.slice(1);
}

function getUniqueRoomNames(
  project: GeneratedHomeConceptPayload,
  type: GeneratedHomeConceptPayload["floorPlan"]["rooms"][number]["type"]
) {
  return Array.from(
    new Set(
      project.floorPlan.rooms
        .filter((room) => room.type === type)
        .map((room) => room.name)
    )
  );
}

function createRoomLayoutIdeas(project: GeneratedHomeConceptPayload) {
  const socialRooms = getUniqueRoomNames(project, "social").slice(0, 2);
  const privateRooms = getUniqueRoomNames(project, "private").slice(0, 2);
  const serviceRooms = getUniqueRoomNames(project, "service").slice(0, 2);

  const ideas = [
    socialRooms.length
      ? `Anchor the plan around ${listToSentence(socialRooms)} so the shared spaces stay bright and connected.`
      : "Anchor the plan around a compact shared living spine with daylight on the most active rooms.",
    privateRooms.length
      ? `Pull quieter rooms like ${listToSentence(privateRooms)} away from the busiest social zones for better acoustic separation.`
      : "Separate quieter retreat spaces from the busiest social areas so the layout feels calmer to live in.",
    serviceRooms.length
      ? `Keep support spaces such as ${listToSentence(serviceRooms)} tight and efficient so more area stays usable.`
      : "Keep circulation and service zones compact so the home spends more square footage on active living."
  ];

  return ideas;
}

function createExteriorConcepts(project: GeneratedHomeConceptPayload) {
  const features: string[] = [];

  if (project.model3D.sustainabilityFeatures.solarPanels) {
    features.push("roof-integrated solar panels");
  }

  if (project.model3D.sustainabilityFeatures.greenRoof) {
    features.push("green roof zones");
  }

  if (project.model3D.sustainabilityFeatures.rainwaterTank) {
    features.push("rainwater capture");
  }

  if (project.model3D.sustainabilityFeatures.permeableDriveway) {
    features.push("permeable hardscape");
  }

  if (project.model3D.sustainabilityFeatures.trees) {
    features.push("planted shade buffers");
  }

  return [
    `${formatRoofType(project.model3D.roofType)} rooflines, ${project.model3D.exteriorColor} exterior tones, and ${project.model3D.wallMaterial.toLowerCase()} set the main architectural language.`,
    features.length
      ? `Carry the sustainability story outside with ${listToSentence(features)}.`
      : "Keep the exterior calm, durable, and weather-aware with simple low-maintenance detailing."
  ];
}

function createInteriorConcepts(project: GeneratedHomeConceptPayload) {
  const firstMaterial = project.materials[0]?.name.toLowerCase();
  const secondMaterial = project.materials[1]?.name.toLowerCase();
  const socialRooms = getUniqueRoomNames(project, "social").slice(0, 2);

  return [
    socialRooms.length
      ? `Shape interiors around ${listToSentence(socialRooms)} so daylight, family life, and flexible use stay at the center of the plan.`
      : "Shape interiors around flexible, light-filled shared rooms so the home feels open without oversizing.",
    firstMaterial
      ? `Use ${listToSentence([firstMaterial, secondMaterial].filter(Boolean) as string[])} to keep the interior warm, durable, and materially grounded.`
      : "Use durable lower-impact finishes that keep the interior warm and easy to maintain over time."
  ];
}

function createFloorPlanIdeas(project: GeneratedHomeConceptPayload) {
  const floors = Array.from(
    new Set(project.floorPlan.rooms.map((room) => room.floor))
  ).sort((left, right) => left - right);
  const outdoorRooms = getUniqueRoomNames(project, "outdoor");

  const ideas = floors.slice(0, 2).map((floor) => {
    const roomsOnFloor = project.floorPlan.rooms
      .filter((room) => room.floor === floor)
      .slice(0, 4)
      .map((room) => room.name);

    return `Use floor ${floor + 1} for ${listToSentence(roomsOnFloor)} so the layout stays legible and compact.`;
  });

  if (outdoorRooms.length) {
    ideas.push(
      `Treat ${listToSentence(outdoorRooms.slice(0, 2))} as an extension of the interior for seasonal comfort and passive living.`
    );
  }

  return ideas.slice(0, 3);
}

function createEnvironmentalImpact(score: SustainabilityScore, climateRegion: ClimateRegion) {
  const climateReadiness =
    climateRegion === "flood-prone"
      ? "Better flood-readiness and recovery planning"
      : climateRegion === "cold"
        ? "Stronger cold-weather comfort and envelope resilience"
        : climateRegion === "tropical"
          ? "Better moisture control and storm-ready comfort"
          : climateRegion === "hot-arid"
            ? "Better heat protection and passive cooling performance"
            : "Better year-round resilience and comfort stability";

  return {
    energyReduction: `About ${clampPercent(score.energyEfficiency * 0.35, 18, 36)}% lower annual energy demand`,
    waterReduction: `About ${clampPercent(score.waterEfficiency * 0.3, 12, 30)}% lower potable water use`,
    embodiedCarbonReduction: `About ${clampPercent(score.materialSustainability * 0.22, 10, 24)}% lower embodied carbon`,
    resilienceGain: climateReadiness
  };
}

function createClimateNarrative(project: GeneratedHomeConceptPayload) {
  const climateNarratives: Record<ClimateRegion, string> = {
    cold:
      "The concept leans on passive solar gain, a tighter envelope, and winter-ready detailing so comfort holds while heating demand drops.",
    temperate:
      "The concept balances daylight, insulation, and natural ventilation so the home can stay comfortable across changing seasons without overcomplication.",
    "hot-arid":
      "The concept prioritizes shading, thermal moderation, and airflow so interior comfort depends less on constant mechanical cooling.",
    tropical:
      "The concept emphasizes airflow, humidity-aware material choices, and shaded transition zones so the home stays lighter and more breathable.",
    "flood-prone":
      "The concept treats resilience as part of the architecture, pairing water-aware siting moves with durable assemblies and easier recovery planning."
  };

  const featureAdditions: string[] = [];

  if (project.model3D.sustainabilityFeatures.crossVentilation) {
    featureAdditions.push("cross-ventilation");
  }

  if (project.model3D.sustainabilityFeatures.rainwaterTank) {
    featureAdditions.push("rainwater capture");
  }

  if (project.model3D.sustainabilityFeatures.solarPanels) {
    featureAdditions.push("solar readiness");
  }

  const additions =
    featureAdditions.length > 0
      ? ` The concept reinforces that with ${listToSentence(featureAdditions)}.`
      : "";

  return `${climateNarratives[project.climateType]}${additions}`;
}

function createBudgetNarrative(budgetLevel: BudgetLevel) {
  const budgetNarratives: Record<BudgetLevel, string> = {
    low: "The budget strategy focuses on passive wins, durable basics, and upgrades that can be phased without losing the core concept.",
    medium:
      "The budget strategy balances visible design quality with envelope and systems decisions that improve comfort and utility performance.",
    premium:
      "The budget strategy supports deeper investment in resilience, lower-impact materials, and long-life building performance systems."
  };

  return budgetNarratives[budgetLevel];
}

function createVisualPrompts(project: GeneratedHomeConceptPayload): VisualPrompt[] {
  return [
    {
      label: "Exterior concept",
      prompt: project.visualPrompts.exteriorPrompt,
      note: "Grounded in the structured sustainability concept and retrieved source context."
    },
    {
      label: "Interior concept",
      prompt: project.visualPrompts.interiorPrompt,
      note: "Useful for room moodboards or calmer interior visualization passes."
    },
    {
      label: "Floor plan sketch",
      prompt: `Generate a clean 2D floor plan for a ${project.architecturalStyle.toLowerCase()} home in ${project.location}, featuring ${listToSentence(project.floorPlan.rooms.slice(0, 4).map((room) => room.name))}, compact circulation, and ${climateLabels[project.climateType].toLowerCase()} strategies.`,
      note: "A lightweight prompt starter for diagrammatic plan exploration."
    }
  ];
}

function createDesignPrinciples(project: GeneratedHomeConceptPayload) {
  const principles = [
    "Let passive performance decisions shape the plan before adding heavier mechanical complexity.",
    `Use ${budgetLabels[project.budgetLevel].toLowerCase()} choices to keep the concept buildable without losing its sustainability priorities.`
  ];

  if (project.model3D.sustainabilityFeatures.crossVentilation) {
    principles.push("Make natural airflow part of the spatial identity, not just a hidden engineering layer.");
  }

  if (project.materials[0]) {
    principles.push(
      `Favor durable lower-impact materials such as ${project.materials[0].name.toLowerCase()} where they are seen and touched most.`
    );
  }

  if (project.sources[0]) {
    principles.push(
      `Keep major sustainability choices grounded in documented guidance such as ${project.sources[0].title.toLowerCase()}.`
    );
  }

  return principles.slice(0, 5);
}

function toLegacyRecommendation(
  project: GeneratedHomeConceptPayload,
  upgrade: GeneratedHomeConceptPayload["upgrades"][number]
): Recommendation {
  return {
    title: upgrade.title,
    category: upgrade.category,
    rationale: upgrade.explanation,
    budgetFit: project.budgetLevel,
    estimatedSavings: upgrade.estimatedBenefit,
    impact: upgrade.impactLevel === "High" ? "High" : "Medium"
  };
}

export function isStructuredGeneratedHomeConceptPayload(
  value: unknown
): value is GeneratedHomeConceptPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const floorPlan = candidate.floorPlan as { rooms?: unknown[] } | undefined;

  return (
    typeof candidate.projectId === "string" &&
    typeof candidate.conceptSummary === "string" &&
    typeof candidate.location === "string" &&
    typeof candidate.architecturalStyle === "string" &&
    Array.isArray(candidate.upgrades) &&
    Array.isArray(candidate.materials) &&
    !!candidate.visualPrompts &&
    typeof candidate.visualPrompts === "object" &&
    !!candidate.model3D &&
    typeof candidate.model3D === "object" &&
    !!candidate.sustainabilityScore &&
    typeof candidate.sustainabilityScore === "object" &&
    !!floorPlan &&
    Array.isArray(floorPlan.rooms)
  );
}

export function adaptStructuredConceptToGeneratedHomeConcept(
  project: GeneratedHomeConceptPayload
): GeneratedHomeConcept {
  return {
    projectId: project.projectId,
    heroTitle: `${project.architecturalStyle} for ${project.location}`,
    summary: project.conceptSummary,
    architecturalStyle: project.architecturalStyle,
    roomLayoutIdeas: createRoomLayoutIdeas(project),
    exteriorConcepts: createExteriorConcepts(project),
    interiorConcepts: createInteriorConcepts(project),
    sustainabilityUpgrades: project.upgrades.map((upgrade) =>
      toLegacyRecommendation(project, upgrade)
    ),
    floorPlanIdeas: createFloorPlanIdeas(project),
    sustainabilityScore: project.sustainabilityScore,
    environmentalImpact: createEnvironmentalImpact(
      project.sustainabilityScore,
      project.climateType
    ),
    climateNarrative: createClimateNarrative(project),
    budgetNarrative: createBudgetNarrative(project.budgetLevel),
    visualPrompts: createVisualPrompts(project),
    designPrinciples: createDesignPrinciples(project),
    styleAnalysis: project.styleAnalysis,
    floorPlan: project.floorPlan,
    model3D: project.model3D,
    materials: project.materials,
    upgrades: project.upgrades,
    location: project.location,
    climateRegion: project.climateType,
    budgetLevel: project.budgetLevel,
    generatedAt: project.generatedAt
  };
}
