import type {
  BudgetLevel,
  ClimateRegion,
  EnvironmentalImpactSnapshot,
  GeneratedHomeConcept,
  Model3D,
  SustainabilityScore,
} from "@/lib/domain/types";

type SubScoreKey = Exclude<keyof SustainabilityScore, "total">;
type FeatureKey = keyof Model3D["sustainabilityFeatures"];

// "All features on, single floor" ceiling per climate. Mirrors the curated
// baselines in lib/domain/mock-data.ts so the demo's pre-edit metrics match.
const climateBaseline: Record<
  ClimateRegion,
  Omit<SustainabilityScore, "total" | "affordability">
> = {
  "hot-arid": {
    energyEfficiency: 88,
    waterEfficiency: 79,
    climateResilience: 84,
    materialSustainability: 80,
    environmentalImpact: 85,
  },
  temperate: {
    energyEfficiency: 83,
    waterEfficiency: 78,
    climateResilience: 80,
    materialSustainability: 82,
    environmentalImpact: 81,
  },
  cold: {
    energyEfficiency: 90,
    waterEfficiency: 74,
    climateResilience: 88,
    materialSustainability: 79,
    environmentalImpact: 86,
  },
  tropical: {
    energyEfficiency: 82,
    waterEfficiency: 81,
    climateResilience: 86,
    materialSustainability: 78,
    environmentalImpact: 80,
  },
  "flood-prone": {
    energyEfficiency: 80,
    waterEfficiency: 85,
    climateResilience: 92,
    materialSustainability: 81,
    environmentalImpact: 82,
  },
};

const budgetAffordability: Record<BudgetLevel, number> = {
  low: 91,
  medium: 84,
  premium: 74,
};

// Each feature's contribution to the climate baseline when ON. When OFF, the
// same weights are subtracted — so disabling solar costs 5 from energy + 5
// from environmental impact, etc.
const featureContributions: Record<
  FeatureKey,
  Partial<Record<SubScoreKey, number>>
> = {
  solarPanels: { energyEfficiency: 5, environmentalImpact: 5 },
  greenRoof: {
    energyEfficiency: 2,
    climateResilience: 3,
    materialSustainability: 3,
    environmentalImpact: 3,
  },
  rainwaterTank: { waterEfficiency: 8, environmentalImpact: 3 },
  trees: { climateResilience: 4, environmentalImpact: 3 },
  permeableDriveway: { waterEfficiency: 4, environmentalImpact: 2 },
  crossVentilation: {
    energyEfficiency: 3,
    climateResilience: 3,
    environmentalImpact: 2,
  },
};

const FLOOR_PENALTY = {
  materialSustainability: 2,
  affordability: 3,
};

const SCORE_FLOOR = 30;
const SCORE_CEILING = 99;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clampPercent(value: number, minimum: number, maximum: number) {
  return clamp(Math.round(value), minimum, maximum);
}

function listToSentence(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

export function computeSustainabilityScore(
  model3D: Model3D,
  climateRegion: ClimateRegion,
  budgetLevel: BudgetLevel,
): SustainabilityScore {
  const base = climateBaseline[climateRegion];
  const features = model3D.sustainabilityFeatures;

  const penalties: Record<SubScoreKey, number> = {
    energyEfficiency: 0,
    waterEfficiency: 0,
    climateResilience: 0,
    materialSustainability: 0,
    affordability: 0,
    environmentalImpact: 0,
  };

  (Object.keys(featureContributions) as FeatureKey[]).forEach((feature) => {
    if (features[feature]) return;
    const contributions = featureContributions[feature];
    (Object.entries(contributions) as Array<[SubScoreKey, number]>).forEach(
      ([subKey, weight]) => {
        penalties[subKey] += weight;
      },
    );
  });

  const extraFloors = Math.max(0, model3D.floors - 1);
  penalties.materialSustainability +=
    extraFloors * FLOOR_PENALTY.materialSustainability;
  const affordabilityPenalty = extraFloors * FLOOR_PENALTY.affordability;

  const energyEfficiency = clamp(
    base.energyEfficiency - penalties.energyEfficiency,
    SCORE_FLOOR,
    SCORE_CEILING,
  );
  const waterEfficiency = clamp(
    base.waterEfficiency - penalties.waterEfficiency,
    SCORE_FLOOR,
    SCORE_CEILING,
  );
  const climateResilience = clamp(
    base.climateResilience - penalties.climateResilience,
    SCORE_FLOOR,
    SCORE_CEILING,
  );
  const materialSustainability = clamp(
    base.materialSustainability - penalties.materialSustainability,
    SCORE_FLOOR,
    SCORE_CEILING,
  );
  const affordability = clamp(
    budgetAffordability[budgetLevel] - affordabilityPenalty,
    SCORE_FLOOR,
    SCORE_CEILING,
  );
  const environmentalImpact = clamp(
    base.environmentalImpact - penalties.environmentalImpact,
    SCORE_FLOOR,
    SCORE_CEILING,
  );

  const total = Math.round(
    (energyEfficiency +
      waterEfficiency +
      climateResilience +
      materialSustainability +
      affordability +
      environmentalImpact) /
      6,
  );

  return {
    energyEfficiency,
    waterEfficiency,
    climateResilience,
    materialSustainability,
    affordability,
    environmentalImpact,
    total,
  };
}

export function computeEnvironmentalImpact(
  score: SustainabilityScore,
  climateRegion: ClimateRegion,
): EnvironmentalImpactSnapshot {
  const resilienceGain =
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
    resilienceGain,
  };
}

const climateNarratives: Record<ClimateRegion, string> = {
  cold: "The concept leans on passive solar gain, a tighter envelope, and winter-ready detailing so comfort holds while heating demand drops.",
  temperate:
    "The concept balances daylight, insulation, and natural ventilation so the home can stay comfortable across changing seasons without overcomplication.",
  "hot-arid":
    "The concept prioritizes shading, thermal moderation, and airflow so interior comfort depends less on constant mechanical cooling.",
  tropical:
    "The concept emphasizes airflow, humidity-aware material choices, and shaded transition zones so the home stays lighter and more breathable.",
  "flood-prone":
    "The concept treats resilience as part of the architecture, pairing water-aware siting moves with durable assemblies and easier recovery planning.",
};

export function composeClimateNarrative(
  features: Model3D["sustainabilityFeatures"],
  climateRegion: ClimateRegion,
): string {
  const featureAdditions: string[] = [];
  if (features.crossVentilation) featureAdditions.push("cross-ventilation");
  if (features.rainwaterTank) featureAdditions.push("rainwater capture");
  if (features.solarPanels) featureAdditions.push("solar readiness");

  const additions =
    featureAdditions.length > 0
      ? ` The concept reinforces that with ${listToSentence(featureAdditions)}.`
      : "";

  return `${climateNarratives[climateRegion]}${additions}`;
}

export function deriveReportMetrics<T extends GeneratedHomeConcept>(
  project: T,
): T {
  if (!project.model3D) return project;

  const sustainabilityScore = computeSustainabilityScore(
    project.model3D,
    project.climateRegion,
    project.budgetLevel,
  );
  const environmentalImpact = computeEnvironmentalImpact(
    sustainabilityScore,
    project.climateRegion,
  );
  const climateNarrative = composeClimateNarrative(
    project.model3D.sustainabilityFeatures,
    project.climateRegion,
  );

  return {
    ...project,
    sustainabilityScore,
    environmentalImpact,
    climateNarrative,
  };
}
