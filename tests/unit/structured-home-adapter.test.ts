import {
  adaptStructuredConceptToGeneratedHomeConcept,
  isStructuredGeneratedHomeConceptPayload
} from "@/lib/domain/structured-home-adapter";
import { sampleStructuredHomeConcept } from "@/lib/domain/sample-structured-home";

describe("structured-home-adapter", () => {
  it("recognizes the structured home payload shape", () => {
    expect(
      isStructuredGeneratedHomeConceptPayload(sampleStructuredHomeConcept)
    ).toBe(true);
    expect(isStructuredGeneratedHomeConceptPayload({ projectId: "demo" })).toBe(false);
  });

  it("adapts a structured concept into the legacy results shape", () => {
    const concept = adaptStructuredConceptToGeneratedHomeConcept(
      sampleStructuredHomeConcept
    );

    expect(concept.projectId).toBe(sampleStructuredHomeConcept.projectId);
    expect(concept.heroTitle).toBe("Compact warm modern for Toronto, Canada");
    expect(concept.summary).toBe(sampleStructuredHomeConcept.conceptSummary);
    expect(concept.climateRegion).toBe(sampleStructuredHomeConcept.climateType);
    expect(concept.sustainabilityUpgrades[0]?.rationale).toBe(
      sampleStructuredHomeConcept.upgrades[0]?.explanation
    );
    expect(concept.visualPrompts).toHaveLength(3);
    expect(concept.environmentalImpact.energyReduction).toContain("%");
    expect(concept.designPrinciples.length).toBeGreaterThan(2);
  });
});
