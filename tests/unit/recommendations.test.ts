import { createGeneratedHomeConcept } from "@/lib/domain/mock-data";
import type { DreamHomeInput } from "@/lib/domain/types";

function createInput(overrides: Partial<DreamHomeInput>): DreamHomeInput {
  return {
    description:
      "A modern home with open living, durable finishes, and a strong sustainability focus.",
    location: "Accra, Ghana",
    climateRegion: "hot-arid",
    budgetLevel: "low",
    inspirationImages: [],
    ...overrides
  };
}

describe("climate and budget mapping", () => {
  it("uses cold-climate narratives and upgrades", () => {
    const concept = createGeneratedHomeConcept(
      createInput({
        location: "Toronto, Canada",
        climateRegion: "cold",
        budgetLevel: "medium"
      }),
      "cold-demo"
    );

    expect(concept.climateNarrative).toContain("passive solar gain");
    expect(
      concept.sustainabilityUpgrades.some((upgrade) =>
        upgrade.title.includes("airtightness")
      )
    ).toBe(true);
  });

  it("uses flood-prone resilience moves and stronger water scores", () => {
    const concept = createGeneratedHomeConcept(
      createInput({
        location: "Jakarta, Indonesia",
        climateRegion: "flood-prone",
        budgetLevel: "premium"
      }),
      "flood-demo"
    );

    expect(concept.floorPlanIdeas[0]).toContain("above grade");
    expect(concept.sustainabilityScore.waterEfficiency).toBeGreaterThan(80);
    expect(concept.sustainabilityUpgrades[1].category).toBe("Resilience");
  });
});
