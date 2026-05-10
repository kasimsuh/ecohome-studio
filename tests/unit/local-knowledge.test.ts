import { retrieveLocalGuidance } from "@/lib/rag/local-knowledge";

describe("retrieveLocalGuidance", () => {
  it("returns focused guidance snippets for flood-prone requests", async () => {
    const snippets = await retrieveLocalGuidance({
      description:
        "A flood-resilient coastal family home with durable materials, water-smart landscaping, and flexible shared living spaces.",
      location: "Lagos, Nigeria",
      climateRegion: "flood-prone",
      budgetLevel: "medium",
      inspirationImages: [],
      styleAnalysis: null
    });

    expect(snippets.length).toBeGreaterThanOrEqual(3);
    expect(snippets.length).toBeLessThanOrEqual(6);
    expect(
      snippets.some((snippet) =>
        /flood|drainage|recovery|water/i.test(snippet.content)
      )
    ).toBe(true);
  });
});
