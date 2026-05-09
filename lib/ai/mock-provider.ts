import type { SustainableHomeAiProvider } from "@/lib/ai/contracts";
import {
  createGeneratedHomeConcept,
  createStyleAnalysis
} from "@/lib/domain/mock-data";
import type { DreamHomeInput, InspirationImage } from "@/lib/domain/types";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockSustainableHomeAiProvider: SustainableHomeAiProvider = {
  async analyzeInspirationImages(images: InspirationImage[]) {
    await wait(200);
    return createStyleAnalysis(images);
  },
  async generateHomeConcept(input: DreamHomeInput) {
    await wait(400);
    return createGeneratedHomeConcept(input);
  }
};
