import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateCompletion, mockOpenAI } = vi.hoisted(() => ({
  mockCreateCompletion: vi.fn(),
  mockOpenAI: vi.fn(),
}));

vi.mock("openai-v6", () => ({
  default: mockOpenAI.mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreateCompletion,
      },
    },
  })),
}));

import { generateStructuredHomeConceptWithFeatherless } from "@/lib/ai/featherless";
import { sampleStructuredHomeConcept } from "@/lib/domain/sample-structured-home";

const originalApiKey = process.env.FEATHERLESS_API_KEY;
const originalModel = process.env.FEATHERLESS_MODEL;
const originalBaseUrl = process.env.FEATHERLESS_BASE_URL;

const input = {
  description:
    "A compact sustainable home in Toronto with strong daylight, flexible work space, and durable low-impact materials.",
  location: "Toronto, Canada",
  climateRegion: "cold" as const,
  budgetLevel: "medium" as const,
  inspirationImages: [],
  styleAnalysis: null,
};

const guidanceSnippets = [
  {
    title: "Cold-climate envelope first",
    source: "climate-resilience.md",
    content:
      "Prioritize airtight detailing, continuous insulation, and a compact plan before sizing mechanical systems.",
  },
  {
    title: "Water-smart site strategy",
    source: "water-efficiency.md",
    content:
      "Use permeable paving, rain capture, and drought-tolerant planting to cut outdoor water demand.",
  },
];

describe("generateStructuredHomeConceptWithFeatherless", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FEATHERLESS_API_KEY = "test-featherless-key";
    process.env.FEATHERLESS_MODEL = "test-featherless-model";
    process.env.FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1";
  });

  afterAll(() => {
    process.env.FEATHERLESS_API_KEY = originalApiKey;
    process.env.FEATHERLESS_MODEL = originalModel;
    process.env.FEATHERLESS_BASE_URL = originalBaseUrl;
  });

  it("passes retrieved sustainability context into the model prompt", async () => {
    const {
      projectId,
      generatedAt,
      sourcePrompt,
      inspirationImages,
      styleAnalysis,
      guidanceSnippets: sampleGuidanceSnippets,
      ...modelPayload
    } = sampleStructuredHomeConcept;

    void projectId;
    void generatedAt;
    void sourcePrompt;
    void inspirationImages;
    void styleAnalysis;
    void sampleGuidanceSnippets;

    mockCreateCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(modelPayload),
          },
        },
      ],
    });

    await generateStructuredHomeConceptWithFeatherless({
      input,
      guidanceSnippets,
    });

    expect(mockOpenAI).toHaveBeenCalledTimes(1);
    expect(mockCreateCompletion).toHaveBeenCalledTimes(1);

    const request = mockCreateCompletion.mock.calls[0][0];
    const userMessage = request.messages[1]?.content;

    expect(typeof userMessage).toBe("string");
    expect(userMessage).toContain("retrievedSustainabilityContext");
    expect(userMessage).toContain("Cold-climate envelope first");
    expect(userMessage).toContain("climate-resilience.md");
    expect(request.messages[0]?.content).toContain("- sources");
  });

  it("derives source references from guidance snippets when the model omits sources", async () => {
    const {
      projectId,
      generatedAt,
      sourcePrompt,
      inspirationImages,
      styleAnalysis,
      guidanceSnippets: sampleGuidanceSnippets,
      sources,
      ...modelPayload
    } = sampleStructuredHomeConcept;

    void projectId;
    void generatedAt;
    void sourcePrompt;
    void inspirationImages;
    void styleAnalysis;
    void sampleGuidanceSnippets;
    void sources;

    mockCreateCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(modelPayload),
          },
        },
      ],
    });

    const concept = await generateStructuredHomeConceptWithFeatherless({
      input,
      guidanceSnippets,
    });

    expect(concept.guidanceSnippets).toEqual(guidanceSnippets);
    expect(concept.sources).toEqual([
      {
        title: "Cold-climate envelope first",
        source: "climate-resilience.md",
        filename: "climate-resilience.md",
      },
      {
        title: "Water-smart site strategy",
        source: "water-efficiency.md",
        filename: "water-efficiency.md",
      },
    ]);
  });
});
