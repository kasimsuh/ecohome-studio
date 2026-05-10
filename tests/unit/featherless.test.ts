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

  it("normalizes DeepSeek-style freeform output into the strict home concept schema", async () => {
    mockCreateCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              conceptSummary:
                "A compact eco-modern farmhouse concept for Toronto that prioritizes durability, daylight, and efficient envelope performance.",
              location: "Toronto, Canada",
              climateType: "cold climate",
              budgetLevel: "mid-range",
              architecturalStyle: "Eco-modern farmhouse",
              sustainabilityScore: {
                energyEfficiency: "88",
                waterEfficiency: 72,
                climateResilience: "90",
                materialSustainability: 81,
                affordability: "78",
                environmentalImpact: "85",
              },
              floorPlan: {
                width: "18",
                height: "12",
                rooms: [
                  {
                    name: "Open Plan Living / Dining / Kitchen",
                    x: 0,
                    y: 0,
                    width: 10,
                    height: 5,
                    floor: 0,
                    type: "open-plan",
                  },
                  {
                    name: "Office",
                    x: 10,
                    y: 0,
                    width: 4,
                    height: 5,
                    floor: 0,
                    type: "office",
                  },
                  {
                    name: "Bathroom",
                    x: 14,
                    y: 0,
                    width: 4,
                    height: 3,
                    floor: 0,
                    type: "bathroom",
                  },
                  {
                    name: "Primary Bedroom",
                    x: 0,
                    y: 5,
                    width: 8,
                    height: 4,
                    floor: 1,
                    type: "bedroom",
                  },
                ],
              },
              model3D: {
                floors: "2",
                roofType: "flat with parapet",
                wallMaterial: "Cellulose-insulated timber frame",
                exteriorColor: "soft beige-green",
                windows: [
                  {
                    side: "south",
                    position: 28,
                    width: "1.8",
                    height: "1.5",
                    level: 0,
                  },
                  {
                    wall: "north",
                    offset: 1.4,
                    width: 1.3,
                    height: 1.2,
                    floor: 1,
                  },
                ],
                doors: [
                  {
                    orientation: "east",
                    offset: 87,
                    width: "1.1",
                    height: "2.2",
                    floor: 2,
                  },
                ],
                sustainabilityFeatures: {
                  solarPanels: "yes",
                  greenRoof: "no",
                  rainwaterTank: "true",
                  trees: 1,
                  permeableDriveway: "enabled",
                  crossVentilation: "true",
                },
              },
              upgrades: [
                {
                  recommendation: "Cross-ventilation layout",
                  impact: "high",
                  description:
                    "Align openings to support passive cooling and better indoor air quality.",
                  benefit: "Improve summer comfort with less mechanical cooling.",
                },
                "Add a rainwater harvesting tank for garden irrigation.",
              ],
              materials: "Mass timber, cellulose insulation, recycled brick",
              visualPrompts: {
                exteriorPrompt: "Exterior perspective of a compact eco-modern farmhouse.",
                interiorPrompt: "Interior view with daylight, timber, and simple low-impact finishes.",
              },
            }),
          },
        },
      ],
    });

    const concept = await generateStructuredHomeConceptWithFeatherless({
      input,
      guidanceSnippets,
    });

    expect(concept.climateType).toBe("cold");
    expect(concept.budgetLevel).toBe("medium");
    expect(concept.floorPlan.rooms.map((room) => room.type)).toEqual([
      "social",
      "work",
      "service",
      "private",
    ]);
    expect(concept.model3D.roofType).toBe("flat");
    expect(concept.model3D.windows[0]?.offset).toBe(0.28);
    expect(concept.model3D.windows[1]?.offset).toBe(0.92);
    expect(concept.model3D.doors[0]?.offset).toBe(0.87);
    expect(concept.model3D.doors[0]?.floor).toBe(0);
    expect(concept.model3D.sustainabilityFeatures).toEqual({
      solarPanels: true,
      greenRoof: false,
      rainwaterTank: true,
      trees: true,
      permeableDriveway: true,
      crossVentilation: true,
    });
    expect(concept.upgrades).toEqual([
      expect.objectContaining({
        title: "Cross-ventilation layout",
        category: "Comfort",
        impactLevel: "High",
      }),
      expect.objectContaining({
        title: "Add a rainwater harvesting tank for garden irrigation.",
        category: "Water",
        impactLevel: "Medium",
      }),
    ]);
    expect(concept.materials).toEqual([
      expect.objectContaining({ name: "Mass Timber" }),
      expect.objectContaining({ name: "Cellulose Insulation" }),
      expect.objectContaining({ name: "Recycled Brick" }),
    ]);
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
