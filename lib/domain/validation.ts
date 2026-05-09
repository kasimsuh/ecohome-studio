import { z } from "zod";

import {
  MAX_INSPIRATION_IMAGES,
  MIN_DESCRIPTION_LENGTH
} from "@/lib/domain/constants";
import {
  budgetLevelValues,
  climateRegionValues
} from "@/lib/domain/types";

const inspirationImageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  size: z.number().nonnegative()
});

const styleAnalysisSchema = z.object({
  aesthetic: z.string().min(1),
  palette: z.array(z.string()).min(1),
  materials: z.array(z.string()).min(1),
  lighting: z.array(z.string()).min(1),
  layoutPatterns: z.array(z.string()).min(1),
  summary: z.string().min(1)
});

export const generateConceptSchema = z.object({
  description: z.string().trim().min(MIN_DESCRIPTION_LENGTH).max(1500),
  location: z.string().trim().min(2).max(120),
  climateRegion: z.enum(climateRegionValues),
  budgetLevel: z.enum(budgetLevelValues),
  inspirationImages: z.array(inspirationImageSchema).max(MAX_INSPIRATION_IMAGES),
  styleAnalysis: styleAnalysisSchema.nullish()
});
