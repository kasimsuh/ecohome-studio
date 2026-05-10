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
  mockIsWatsonxVectorIndexConfigured,
  mockRetrieveLocalGuidance,
  mockSimilaritySearchWithScore,
  mockRetrieveWatsonxGuidance,
} = vi.hoisted(() => ({
  mockCreateEmbeddingModel: vi.fn(),
  mockFromExistingIndex: vi.fn(),
  mockGetSupabaseVectorStoreConfig: vi.fn(),
  mockIsWatsonxVectorIndexConfigured: vi.fn(),
  mockRetrieveLocalGuidance: vi.fn(),
  mockSimilaritySearchWithScore: vi.fn(),
  mockRetrieveWatsonxGuidance: vi.fn(),
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

vi.mock("@/lib/rag/watsonx", () => ({
  isWatsonxVectorIndexConfigured: mockIsWatsonxVectorIndexConfigured,
  retrieveWatsonxGuidance: mockRetrieveWatsonxGuidance,
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
    mockIsWatsonxVectorIndexConfigured.mockReturnValue(false);
    mockRetrieveLocalGuidance.mockResolvedValue(localFallbackSnippets);
    mockRetrieveWatsonxGuidance.mockResolvedValue({
      snippets: [],
      matchCount: 0,
    });
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
    expect(result.diagnostics.watsonxAttempted).toBe(false);
    expect(result.diagnostics.watsonxUsed).toBe(false);
    expect(result.diagnostics.localFallbackUsed).toBe(false);
  });

  it("falls back to watsonx when Supabase returns too few matches", async () => {
    mockIsWatsonxVectorIndexConfigured.mockReturnValue(true);
    mockRetrieveWatsonxGuidance.mockResolvedValue({
      snippets: [
        {
          title: "Passive cooling guidance",
          source: "watsonx.ai vector index",
          content:
            "Use shaded verandas, aligned openings, and protected breezeways to keep shared rooms comfortable in humid climates.",
        },
        {
          title: "Water efficiency guidance",
          source: "watsonx.ai vector index",
          content:
            "Pair rainwater harvesting with low-maintenance storage and simple graywater reuse where regulations allow.",
        },
        {
          title: "Materials guidance",
          source: "watsonx.ai vector index",
          content:
            "Specify durable low-impact finishes that tolerate heat, moisture, and regular cleaning without early replacement.",
        },
      ],
      matchCount: 3,
    });

    const result = await retrieveSustainabilityContext(sampleInput, 4);

    expect(mockRetrieveWatsonxGuidance).toHaveBeenCalledWith(
      expect.stringContaining("Climate: tropical."),
      4,
    );
    expect(result.source).toBe("watsonx-vector-index");
    expect(result.snippets).toHaveLength(3);
    expect(result.diagnostics.supabaseAttempted).toBe(true);
    expect(result.diagnostics.supabaseMatchCount).toBe(0);
    expect(result.diagnostics.watsonxAttempted).toBe(true);
    expect(result.diagnostics.watsonxMatchCount).toBe(3);
    expect(result.diagnostics.watsonxUsed).toBe(true);
    expect(result.diagnostics.localFallbackUsed).toBe(false);
    expect(result.diagnostics.fallbackReason).toBe(
      "supabase-returned-no-matches",
    );
  });

  it("falls back to local seed docs when Supabase and watsonx both fail", async () => {
    mockFromExistingIndex.mockRejectedValue(new Error("Missing SUPABASE_URL"));
    mockIsWatsonxVectorIndexConfigured.mockReturnValue(true);
    mockRetrieveWatsonxGuidance.mockRejectedValue(
      new Error("watsonx RAGQuery failed: Unauthorized"),
    );

    const result = await retrieveSustainabilityContext(sampleInput);

    expect(result.source).toBe("local-seed-docs");
    expect(result.snippets).toEqual(localFallbackSnippets);
    expect(result.contextText).toContain("climate-resilience.md");
    expect(result.diagnostics.supabaseAttempted).toBe(true);
    expect(result.diagnostics.watsonxAttempted).toBe(true);
    expect(result.diagnostics.watsonxUsed).toBe(false);
    expect(result.diagnostics.localFallbackUsed).toBe(true);
    expect(result.diagnostics.fallbackReason).toBe(
      "supabase-query-failed,watsonx-query-failed",
    );
    expect(result.diagnostics.supabaseError).toContain("Missing SUPABASE_URL");
    expect(result.diagnostics.watsonxError).toContain("Unauthorized");
  });
});
