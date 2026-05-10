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

export const floorPlanRoomTypeValues = [
  "social",
  "private",
  "service",
  "work",
  "circulation",
  "outdoor"
] as const;

export const roofTypeValues = ["flat", "gable", "hip", "shed", "butterfly"] as const;

export const openingWallValues = ["north", "south", "east", "west"] as const;

export type FloorPlanRoomType = (typeof floorPlanRoomTypeValues)[number];
export type RoofType = (typeof roofTypeValues)[number];
export type OpeningWall = (typeof openingWallValues)[number];

export interface FloorPlanRoom {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
  type: FloorPlanRoomType;
}

export interface FloorPlan {
  width: number;
  height: number;
  rooms: FloorPlanRoom[];
}

export interface ModelOpening {
  wall: OpeningWall;
  offset: number;
  width: number;
  height: number;
  floor: number;
  roomName?: string;
}

export interface SustainabilityFeatures {
  solarPanels: boolean;
  greenRoof: boolean;
  rainwaterTank: boolean;
  trees: boolean;
  permeableDriveway: boolean;
  crossVentilation: boolean;
}

export interface Model3D {
  floors: number;
  roofType: RoofType;
  wallMaterial: string;
  exteriorColor: string;
  windows: ModelOpening[];
  doors: ModelOpening[];
  sustainabilityFeatures: SustainabilityFeatures;
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
  floorPlan?: FloorPlan;
  model3D?: Model3D;
  materials?: Array<{
    name: string;
    reason: string;
    sustainabilityBenefit: string;
  }>;
  upgrades?: Array<{
    title: string;
    category: "Energy" | "Water" | "Materials" | "Resilience" | "Comfort";
    impactLevel: "Low" | "Medium" | "High";
    explanation: string;
    estimatedBenefit: string;
  }>;
  location: string;
  climateRegion: ClimateRegion;
  budgetLevel: BudgetLevel;
  generatedAt: string;
}
