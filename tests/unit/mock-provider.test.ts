import { mockSustainableHomeAiProvider } from "@/lib/ai/mock-provider";
import type { DreamHomeInput } from "@/lib/domain/types";

const input: DreamHomeInput = {
  description:
    "A light-filled modern family home with warm timber accents, flexible work space, and strong garden connection.",
  location: "Toronto, Canada",
  climateRegion: "cold",
  budgetLevel: "medium",
  inspirationImages: [
    {
      id: "img-1",
      name: "warm-wood-modern-home.jpg",
      type: "image/jpeg",
      size: 1000
    }
  ],
  styleAnalysis: {
    aesthetic: "warm organic contemporary",
    palette: ["oak", "sage", "linen"],
    materials: ["light timber", "textured tile"],
    lighting: ["daylit shared spaces"],
    layoutPatterns: ["garden-facing living area"],
    summary: "Warm organic contemporary inspiration with natural textures."
  }
};

describe("mockSustainableHomeAiProvider", () => {
  it("creates a generated concept with stable core sections", async () => {
    const concept = await mockSustainableHomeAiProvider.generateHomeConcept(input);

    expect(concept.projectId).toMatch(/^eco-/);
    expect(concept.sustainabilityUpgrades).toHaveLength(5);
    expect(concept.visualPrompts).toHaveLength(3);
    expect(concept.sustainabilityScore.total).toBeGreaterThan(70);
  });

  it("analyzes inspiration images into a style summary", async () => {
    const analysis = await mockSustainableHomeAiProvider.analyzeInspirationImages(
      input.inspirationImages
    );

    expect(analysis.aesthetic).toBeTruthy();
    expect(analysis.palette.length).toBeGreaterThan(0);
    expect(analysis.summary).toContain("inspiration");
  });
});
