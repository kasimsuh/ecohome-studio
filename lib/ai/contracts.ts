import type {
  DreamHomeInput,
  GeneratedHomeConcept,
  InspirationImage,
  StyleAnalysis
} from "@/lib/domain/types";

export interface SustainableHomeAiProvider {
  analyzeInspirationImages(images: InspirationImage[]): Promise<StyleAnalysis>;
  generateHomeConcept(input: DreamHomeInput): Promise<GeneratedHomeConcept>;
}
