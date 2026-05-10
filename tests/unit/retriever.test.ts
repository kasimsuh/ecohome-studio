import { Document } from "@langchain/core/documents";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  GenerateHomeRequest,
  GuidanceSnippet,
} from "@/lib/domain/home-concept-schema";

const {
  mockCreateEmbeddingModel,
  mockFromExistingIndex,
  mockGetSupabaseVectorStoreConfig,
  mockRetrieveLocalGuidance,
  mockSimilaritySearchWithScore,
} = vi.hoisted(() => ({
  mockCreateEmbeddingModel: vi.fn(),
  mockFromExistingIndex: vi.fn(),
  mockGetSupabaseVectorStoreConfig: vi.fn(),
  mockRetrieveLocalGuidance: vi.fn(),
  mockSimilaritySearchWithScore: vi.fn(),
}));

vi.mock("@langchain/community/vectorstores/supabase", () => ({
  SupabaseVectorStore: {
    fromExistingIndex: mockFromExistingIndex,
  },
}));

vi.mock("@/lib/rag/embeddings", () => ({
  createEmbeddingModel: mockCreateEmbeddingModel,
}));

vi.mock("@/lib/rag/local-knowledge", () => ({
  retrieveLocalGuidance: mockRetrieveLocalGuidance,
}));

vi.mock("@/lib/rag/supabase", () => ({
  getSupabaseVectorStoreConfig: mockGetSupabaseVectorStoreConfig,
}));

import {
  buildSustainabilityRetrievalQuery,
  retrieveSustainabilityContext,
} from "@/lib/rag/retriever";

const sampleInput: GenerateHomeRequest = {
  description:
    "A tropical family home with shaded outdoor living, rainwater harvesting, durable low-impact materials, and breezy shared spaces.",
  location: "Accra, Ghana",
  climateRegion: "tropical",
  budgetLevel: "medium",
  inspirationImages: [],
  styleAnalysis: {
    aesthetic: "warm modern tropical",
    palette: ["sand", "palm", "clay"],
    materials: ["timber screens", "lime plaster"],
    lighting: ["filtered daylight", "warm evening glow"],
    layoutPatterns: ["courtyard heart", "deep verandas"],
    summary:
      "Warm tropical-modern inspiration with shaded edges, textured natural materials, and cross-breezes through shared spaces.",
  },
};

const localFallbackSnippets: GuidanceSnippet[] = [
  {
    title: "Climate resilience guidance",
    source: "climate-resilience.md",
    content: "Lift vulnerable systems, manage site runoff, and detail durable assemblies for faster recovery.",
  },
  {
    title: "Water efficiency guidance",
    source: "water-efficiency.md",
    content: "Use low-flow fixtures and rainwater capture where local maintenance can stay simple.",
  },
  {
    title: "Passive cooling guidance",
    source: "passive-cooling.md",
    content: "Use shade, airflow, and low-solar-gain openings to reduce heat build-up in humid climates.",
  },
];

describe("retrieveSustainabilityContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateEmbeddingModel.mockReturnValue({ embedQuery: vi.fn() });
    mockGetSupabaseVectorStoreConfig.mockReturnValue({
      client: {},
      tableName: "documents",
      queryName: "match_documents",
    });
    mockFromExistingIndex.mockResolvedValue({
      similaritySearchWithScore: mockSimilaritySearchWithScore,
    });
    mockRetrieveLocalGuidance.mockResolvedValue(localFallbackSnippets);
    mockSimilaritySearchWithScore.mockResolvedValue([]);
  });

  it("builds a focused retrieval query from the home brief", () => {
    const query = buildSustainabilityRetrievalQuery(sampleInput);

    expect(query).toContain("Location: Accra, Ghana.");
    expect(query).toContain("Climate: tropical.");
    expect(query).toContain("Budget: medium.");
    expect(query).toContain(
      "Architectural direction: warm modern tropical.",
    );
    expect(query).toContain("Style cues:");
    expect(query).toContain("User brief:");
  });

  it("returns Supabase-backed snippets when vector search succeeds", async () => {
    mockSimilaritySearchWithScore.mockResolvedValue([
      [
        new Document({
          pageContent:
            "Prioritize deep roof overhangs, cross ventilation, and shaded openings to reduce heat gain in humid climates.",
          metadata: {
            source: "passive-cooling.pdf",
            filename: "passive-cooling.pdf",
            category: "passive-cooling",
            page: 2,
          },
        }),
        0.94,
      ],
      [
        new Document({
          pageContent:
            "Capture rainwater for irrigation and toilet flushing, and cluster wet rooms to simplify plumbing runs.",
          metadata: {
            source: "water-efficiency.pdf",
            filename: "water-efficiency.pdf",
            category: "water-efficiency",
            page: 5,
          },
        }),
        0.91,
      ],
      [
        new Document({
          pageContent:
            "Choose durable low-embodied-carbon finishes that can tolerate humidity and frequent cleaning.",
          metadata: {
            source: "sustainable-materials.pdf",
            filename: "sustainable-materials.pdf",
            category: "sustainable-materials",
            page: 3,
          },
        }),
        0.89,
      ],
    ]);

    const result = await retrieveSustainabilityContext(sampleInput, 5);

    expect(mockFromExistingIndex).toHaveBeenCalledTimes(1);
    expect(mockSimilaritySearchWithScore).toHaveBeenCalledWith(
      expect.stringContaining("Climate: tropical."),
      5,
    );
    expect(result.source).toBe("supabase-pgvector");
    expect(result.snippets).toHaveLength(3);
    expect(result.snippets[0].title).toContain("Passive Cooling");
    expect(result.snippets[0].source).toBe("passive-cooling.pdf (p. 2)");
    expect(result.contextText).toContain("[1]");
    expect(result.diagnostics.supabaseAttempted).toBe(true);
    expect(result.diagnostics.supabaseMatchCount).toBe(3);
    expect(result.diagnostics.localFallbackUsed).toBe(false);
  });

  it("pads sparse vector results with local fallback guidance", async () => {
    mockSimilaritySearchWithScore.mockResolvedValue([
      [
        new Document({
          pageContent:
            "Orient shared spaces for prevailing breezes and use protected outdoor circulation to reduce cooling demand.",
          metadata: {
            source: "passive-cooling.pdf",
            filename: "passive-cooling.pdf",
            category: "passive-cooling",
            page: 1,
          },
        }),
        0.93,
      ],
    ]);

    const result = await retrieveSustainabilityContext(sampleInput, 4);

    expect(mockRetrieveLocalGuidance).toHaveBeenCalledWith(sampleInput, 4);
    expect(result.source).toBe("supabase-pgvector");
    expect(result.snippets.length).toBeGreaterThanOrEqual(3);
    expect(result.diagnostics.supabaseAttempted).toBe(true);
    expect(result.diagnostics.supabaseMatchCount).toBe(1);
    expect(result.diagnostics.localFallbackUsed).toBe(true);
    expect(result.diagnostics.localFallbackReason).toBe(
      "supabase-results-padded-with-local-seed-docs",
    );
  });

  it("falls back to local seed docs when Supabase retrieval fails", async () => {
    mockFromExistingIndex.mockRejectedValue(new Error("Missing SUPABASE_URL"));

    const result = await retrieveSustainabilityContext(sampleInput);

    expect(result.source).toBe("local-seed-docs");
    expect(result.snippets).toEqual(localFallbackSnippets);
    expect(result.contextText).toContain("climate-resilience.md");
    expect(result.diagnostics.supabaseAttempted).toBe(true);
    expect(result.diagnostics.localFallbackUsed).toBe(true);
    expect(result.diagnostics.localFallbackReason).toBe("supabase-query-failed");
    expect(result.diagnostics.supabaseError).toContain("Missing SUPABASE_URL");
  });
});
