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
        styleAnalysis: null,
      },
      guidanceSnippets: [
        {
          title: "Cold climate envelope",
          source: "climate-resilience.md",
          content:
            "Use airtight detailing, continuous insulation, and heat recovery before oversizing mechanical systems.",
        },
      ],
    });

    expect(() => generatedHomeConceptSchema.parse(concept)).not.toThrow();
    expect(concept.location).toBe("Toronto, Canada");
    expect(concept.climateType).toBe("cold");
    expect(concept.model3D.doors.some((door) => door.floor === 0)).toBe(true);
    expect(concept.model3D.windows.length).toBeGreaterThan(0);
    expect(
      concept.model3D.windows.every((window) => window.floor < concept.model3D.floors),
    ).toBe(true);
    expect(concept.guidanceSnippets).toHaveLength(1);
    expect(concept.sources).toEqual([
      {
        title: "Cold climate envelope",
        source: "climate-resilience.md",
        filename: "climate-resilience.md",
      },
    ]);
  });
});
