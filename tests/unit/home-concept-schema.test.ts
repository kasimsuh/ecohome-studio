import {
  generateHomeRequestSchema,
  generatedHomeConceptSchema,
  homeConceptSchema
} from "@/lib/domain/home-concept-schema";
import { sampleStructuredHomeConcept } from "@/lib/domain/sample-structured-home";

describe("home concept schema", () => {
  it("accepts the structured sample payload", () => {
    expect(() =>
      generatedHomeConceptSchema.parse(sampleStructuredHomeConcept)
    ).not.toThrow();
  });

  it("accepts the AI-facing concept payload without metadata", () => {
    const { projectId, generatedAt, sourcePrompt, inspirationImages, styleAnalysis, guidanceSnippets, ...homeConcept } =
      sampleStructuredHomeConcept;

    expect(() => homeConceptSchema.parse(homeConcept)).not.toThrow();
    expect(projectId).toBe("structured-demo");
    expect(sourcePrompt).toContain("Toronto");
    expect(inspirationImages).toHaveLength(1);
    expect(styleAnalysis?.aesthetic).toBeTruthy();
    expect(guidanceSnippets).toHaveLength(3);
    expect(generatedAt).toBeTruthy();
  });

  it("rejects a request payload without a real description", () => {
    const result = generateHomeRequestSchema.safeParse({
      description: "too short",
      location: "Toronto, Canada",
      climateRegion: "cold",
      budgetLevel: "medium",
      inspirationImages: []
    });

    expect(result.success).toBe(false);
  });
});
