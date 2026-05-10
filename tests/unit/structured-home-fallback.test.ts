import { generatedHomeConceptSchema } from "@/lib/domain/home-concept-schema";
import { createFallbackStructuredHomeConcept } from "@/lib/domain/structured-home-fallback";

describe("createFallbackStructuredHomeConcept", () => {
  it("creates a valid structured concept from request input", () => {
    const concept = createFallbackStructuredHomeConcept({
      input: {
        description:
          "A compact sustainable family home in Toronto with a flexible office, warm wood tones, and strong daylighting.",
        location: "Toronto, Canada",
        climateRegion: "cold",
        budgetLevel: "medium",
        inspirationImages: [],
        styleAnalysis: null
      },
      guidanceSnippets: [
        {
          title: "Cold climate envelope",
          source: "climate-resilience.md",
          content:
            "Use airtight detailing, continuous insulation, and heat recovery before oversizing mechanical systems."
        }
      ]
    });

    expect(() => generatedHomeConceptSchema.parse(concept)).not.toThrow();
    expect(concept.location).toBe("Toronto, Canada");
    expect(concept.climateType).toBe("cold");
    expect(concept.guidanceSnippets).toHaveLength(1);
    expect(concept.floorPlan.rooms.length).toBeGreaterThan(0);
    expect(concept.model3D.windows.length).toBeGreaterThan(0);
  });
});
