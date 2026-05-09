export const climateRegionValues = [
  "hot-arid",
  "temperate",
  "cold",
  "tropical",
  "flood-prone"
] as const;

export const budgetLevelValues = ["low", "medium", "premium"] as const;

export type ClimateRegion = (typeof climateRegionValues)[number];
export type BudgetLevel = (typeof budgetLevelValues)[number];

export interface InspirationImage {
  id: string;
  name: string;
  type: string;
  size: number;
}

export interface StyleAnalysis {
  aesthetic: string;
  palette: string[];
  materials: string[];
  lighting: string[];
  layoutPatterns: string[];
  summary: string;
}

export interface DreamHomeInput {
  description: string;
  location: string;
  climateRegion: ClimateRegion;
  budgetLevel: BudgetLevel;
  inspirationImages: InspirationImage[];
  styleAnalysis?: StyleAnalysis | null;
}

export interface Recommendation {
  title: string;
  category: "Energy" | "Water" | "Materials" | "Resilience" | "Comfort";
  rationale: string;
  budgetFit: BudgetLevel | "all";
  estimatedSavings: string;
  impact: "High" | "Medium";
}

export interface SustainabilityScore {
  total: number;
  energyEfficiency: number;
  waterEfficiency: number;
  climateResilience: number;
  materialSustainability: number;
  affordability: number;
  environmentalImpact: number;
}

export interface EnvironmentalImpactSnapshot {
  energyReduction: string;
  waterReduction: string;
  embodiedCarbonReduction: string;
  resilienceGain: string;
}

export interface VisualPrompt {
  label: string;
  prompt: string;
  note: string;
}

export interface GeneratedHomeConcept {
  projectId: string;
  heroTitle: string;
  summary: string;
  architecturalStyle: string;
  roomLayoutIdeas: string[];
  exteriorConcepts: string[];
  interiorConcepts: string[];
  sustainabilityUpgrades: Recommendation[];
  floorPlanIdeas: string[];
  sustainabilityScore: SustainabilityScore;
  environmentalImpact: EnvironmentalImpactSnapshot;
  climateNarrative: string;
  budgetNarrative: string;
  visualPrompts: VisualPrompt[];
  designPrinciples: string[];
  styleAnalysis?: StyleAnalysis | null;
  location: string;
  climateRegion: ClimateRegion;
  budgetLevel: BudgetLevel;
  generatedAt: string;
}
