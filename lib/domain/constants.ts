import type { BudgetLevel, ClimateRegion } from "@/lib/domain/types";

export const MAX_INSPIRATION_IMAGES = 4;
export const MIN_DESCRIPTION_LENGTH = 24;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const climateOptions: Array<{
  value: ClimateRegion;
  label: string;
  hint: string;
}> = [
  {
    value: "temperate",
    label: "Temperate",
    hint: "Balanced seasonal design with adaptable comfort strategies."
  },
  {
    value: "cold",
    label: "Cold climate",
    hint: "Favors insulation, passive solar gain, and heat retention."
  },
  {
    value: "hot-arid",
    label: "Hot and arid",
    hint: "Favors shading, cross ventilation, and reflective surfaces."
  },
  {
    value: "tropical",
    label: "Tropical",
    hint: "Favors humidity control, airflow, and rain-ready materials."
  },
  {
    value: "flood-prone",
    label: "Flood-prone",
    hint: "Favors resilient siting, drainage, and moisture resistance."
  }
];

export const budgetOptions: Array<{
  value: BudgetLevel;
  label: string;
  hint: string;
}> = [
  {
    value: "low",
    label: "Low budget",
    hint: "Prioritize passive wins, local materials, and phased upgrades."
  },
  {
    value: "medium",
    label: "Medium budget",
    hint: "Blend passive design with targeted systems and material upgrades."
  },
  {
    value: "premium",
    label: "Premium",
    hint: "Support deeper envelope, energy, and resilience investments."
  }
];

export const climateLabels: Record<ClimateRegion, string> = Object.fromEntries(
  climateOptions.map((option) => [option.value, option.label])
) as Record<ClimateRegion, string>;

export const budgetLabels: Record<BudgetLevel, string> = Object.fromEntries(
  budgetOptions.map((option) => [option.value, option.label])
) as Record<BudgetLevel, string>;
