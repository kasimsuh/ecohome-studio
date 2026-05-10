import { z } from "zod";

import {
  MAX_INSPIRATION_IMAGES,
  MIN_DESCRIPTION_LENGTH
} from "@/lib/domain/constants";
import {
  budgetLevelValues,
  climateRegionValues
} from "@/lib/domain/types";

export const floorPlanRoomTypeValues = [
  "social",
  "private",
  "service",
  "work",
  "circulation",
  "outdoor"
] as const;

export const roofTypeValues = [
  "flat",
  "gable",
  "hip",
  "shed",
  "butterfly"
] as const;

export const openingWallValues = ["north", "south", "east", "west"] as const;

export const upgradeCategoryValues = [
  "Energy",
  "Water",
  "Materials",
  "Resilience",
  "Comfort"
] as const;

export const impactLevelValues = ["Low", "Medium", "High"] as const;

export const inspirationImageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  size: z.number().nonnegative()
});

export const styleAnalysisSchema = z.object({
  aesthetic: z.string().min(1),
  palette: z.array(z.string()).min(1),
  materials: z.array(z.string()).min(1),
  lighting: z.array(z.string()).min(1),
  layoutPatterns: z.array(z.string()).min(1),
  summary: z.string().min(1)
});

export const guidanceSnippetSchema = z.object({
  title: z.string().min(1).max(120),
  source: z.string().min(1).max(120),
  content: z.string().min(1).max(320)
});

export const sourceReferenceSchema = z.object({
  title: z.string().min(1).max(120),
  source: z.string().min(1).max(160),
  filename: z.string().min(1).max(160).optional(),
  page: z.number().int().positive().optional()
});

export const sustainabilityScoreSchema = z.object({
  total: z.number().min(0).max(100),
  energyEfficiency: z.number().min(0).max(100),
  waterEfficiency: z.number().min(0).max(100),
  climateResilience: z.number().min(0).max(100),
  materialSustainability: z.number().min(0).max(100),
  affordability: z.number().min(0).max(100),
  environmentalImpact: z.number().min(0).max(100)
});

export const floorPlanRoomSchema = z.object({
  name: z.string().min(1).max(80),
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  floor: z.number().int().nonnegative(),
  type: z.enum(floorPlanRoomTypeValues)
});

export const floorPlanSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  rooms: z.array(floorPlanRoomSchema).min(1).max(30)
});

export const modelOpeningSchema = z.object({
  wall: z.enum(openingWallValues),
  offset: z.number().min(0).max(1),
  width: z.number().positive(),
  height: z.number().positive(),
  floor: z.number().int().nonnegative(),
  roomName: z.string().min(1).max(80).optional()
});

export const sustainabilityFeaturesSchema = z.object({
  solarPanels: z.boolean(),
  greenRoof: z.boolean(),
  rainwaterTank: z.boolean(),
  trees: z.boolean(),
  permeableDriveway: z.boolean(),
  crossVentilation: z.boolean()
});

export const model3DSchema = z.object({
  floors: z.number().int().positive().max(4),
  roofType: z.enum(roofTypeValues),
  wallMaterial: z.string().min(1).max(160),
  exteriorColor: z.string().min(1).max(80),
  windows: z.array(modelOpeningSchema).max(40),
  doors: z.array(modelOpeningSchema).max(20),
  sustainabilityFeatures: sustainabilityFeaturesSchema,
  facadeMaterial: z.enum(["timber-board","brick","rendered-plaster","stone-veneer","metal-panel","fiber-cement"]).optional(),
  roofMaterial: z.enum(["metal-standing-seam","clay-tile","asphalt-shingle","rubber-membrane"]).optional(),
  chimneyCount: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  hasDeck: z.boolean().optional(),
  bodyStyle: z.enum(["box", "l-shape", "split-level"]).optional(),
  dormerCount: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
  roofDesign: z.enum(["craftsman", "contemporary", "traditional"]).optional(),
});

export const upgradeSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.enum(upgradeCategoryValues),
  impactLevel: z.enum(impactLevelValues),
  explanation: z.string().min(1).max(280),
  estimatedBenefit: z.string().min(1).max(140)
});

export const materialSchema = z.object({
  name: z.string().min(1).max(120),
  reason: z.string().min(1).max(220),
  sustainabilityBenefit: z.string().min(1).max(180)
});

export const visualPromptsSchema = z.object({
  exteriorPrompt: z.string().min(1).max(800),
  interiorPrompt: z.string().min(1).max(800)
});

function validateRenderableGeometry(
  concept: {
    floorPlan: z.infer<typeof floorPlanSchema>;
    model3D: z.infer<typeof model3DSchema>;
  },
  context: z.RefinementCtx
) {
  const highestRoomFloor = Math.max(
    0,
    ...concept.floorPlan.rooms.map((room) => room.floor)
  );

  if (concept.model3D.floors <= highestRoomFloor) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["model3D", "floors"],
      message: "Building floors must include every floor used by the floor plan."
    });
  }

  concept.floorPlan.rooms.forEach((room, index) => {
    if (
      room.x + room.width > concept.floorPlan.width ||
      room.y + room.height > concept.floorPlan.height
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["floorPlan", "rooms", index],
        message: "Room must stay inside the floor plan bounds."
      });
    }
  });

  const openingFitsWall = (
    opening: z.infer<typeof modelOpeningSchema>
  ) => {
    const wallLength =
      opening.wall === "north" || opening.wall === "south"
        ? concept.floorPlan.width
        : concept.floorPlan.height;
    const halfWidthRatio = opening.width / wallLength / 2;

    return opening.offset >= halfWidthRatio && opening.offset <= 1 - halfWidthRatio;
  };

  concept.model3D.windows.forEach((window, index) => {
    if (
      window.width < 0.6 ||
      window.width > 3.2 ||
      window.height < 0.6 ||
      window.height > 2
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["model3D", "windows", index],
        message: "Window dimensions must stay within renderable house-like bounds."
      });
    }

    if (window.floor >= concept.model3D.floors) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["model3D", "windows", index, "floor"],
        message: "Window floor must exist in the building."
      });
    }

    if (!openingFitsWall(window)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["model3D", "windows", index, "offset"],
        message: "Window must fit fully on its wall."
      });
    }
  });

  concept.model3D.doors.forEach((door, index) => {
    if (
      door.width < 0.8 ||
      door.width > 2.4 ||
      door.height < 2 ||
      door.height > 2.5
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["model3D", "doors", index],
        message: "Door dimensions must stay within renderable house-like bounds."
      });
    }

    if (door.floor !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["model3D", "doors", index, "floor"],
        message: "Doors must be ground-level openings."
      });
    }

    if (!openingFitsWall(door)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["model3D", "doors", index, "offset"],
        message: "Door must fit fully on its wall."
      });
    }
  });
}

const baseHomeConceptSchema = z.object({
  conceptSummary: z.string().min(1).max(600),
  location: z.string().trim().min(2).max(120),
  climateType: z.enum(climateRegionValues),
  budgetLevel: z.enum(budgetLevelValues),
  architecturalStyle: z.string().min(1).max(120),
  sustainabilityScore: sustainabilityScoreSchema,
  floorPlan: floorPlanSchema,
  model3D: model3DSchema,
  upgrades: z.array(upgradeSchema).min(1).max(10),
  materials: z.array(materialSchema).min(1).max(8),
  visualPrompts: visualPromptsSchema,
  sources: z.array(sourceReferenceSchema).max(8).default([])
});

export const homeConceptSchema = baseHomeConceptSchema.superRefine(
  validateRenderableGeometry
);

export const generatedHomeConceptSchema = baseHomeConceptSchema.extend({
  projectId: z.string().min(1).max(80),
  generatedAt: z.string().datetime(),
  sourcePrompt: z.string().trim().min(1).max(1500),
  inspirationImages: z.array(inspirationImageSchema).default([]),
  styleAnalysis: styleAnalysisSchema.nullish(),
  guidanceSnippets: z.array(guidanceSnippetSchema).default([])
}).superRefine(validateRenderableGeometry);

export const generateHomeRequestSchema = z.object({
  description: z.string().trim().min(MIN_DESCRIPTION_LENGTH).max(1500),
  location: z.string().trim().min(2).max(120),
  climateRegion: z.enum(climateRegionValues),
  budgetLevel: z.enum(budgetLevelValues),
  inspirationImages: z.array(inspirationImageSchema).max(MAX_INSPIRATION_IMAGES),
  styleAnalysis: styleAnalysisSchema.nullish()
});

export type HomeConcept = z.infer<typeof homeConceptSchema>;
export type GeneratedHomeConceptPayload = z.infer<typeof generatedHomeConceptSchema>;
export type GenerateHomeRequest = z.infer<typeof generateHomeRequestSchema>;
export type GuidanceSnippet = z.infer<typeof guidanceSnippetSchema>;
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
