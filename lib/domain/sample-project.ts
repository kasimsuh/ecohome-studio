import { createGeneratedHomeConcept } from "@/lib/domain/mock-data";
import { sampleStructuredHomeConcept } from "@/lib/domain/sample-structured-home";
import type { DreamHomeInput, GeneratedHomeConcept } from "@/lib/domain/types";

export const sampleDreamHomeInput: DreamHomeInput = {
  description:
    "A light-filled family home with a modern exterior, warm natural materials, flexible work space, and strong connection to the garden.",
  location: "Toronto, Canada",
  climateRegion: "cold",
  budgetLevel: "medium",
  inspirationImages: [
    {
      id: "sample-1",
      name: "warm-wood-modern-home.jpg",
      type: "image/jpeg",
      size: 240_000
    }
  ],
  styleAnalysis: {
    aesthetic: "warm organic contemporary",
    palette: ["oak", "linen", "sage", "charcoal"],
    materials: ["light timber", "textured tile", "brushed metal"],
    lighting: ["daylit living spaces", "ambient evening layers"],
    layoutPatterns: ["open kitchen-living connection", "garden-facing family zone"],
    summary:
      "The inspiration leans toward warm organic contemporary design with layered natural textures."
  }
};

export const sampleGeneratedHomeConcept: GeneratedHomeConcept = {
  ...createGeneratedHomeConcept(sampleDreamHomeInput, "demo"),
  floorPlan: sampleStructuredHomeConcept.floorPlan,
  model3D: sampleStructuredHomeConcept.model3D,
  materials: sampleStructuredHomeConcept.materials,
  upgrades: sampleStructuredHomeConcept.upgrades
};
