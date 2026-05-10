import { generatedHomeConceptSchema } from "@/lib/domain/home-concept-schema";

export const sampleStructuredHomeConcept = generatedHomeConceptSchema.parse({
  projectId: "structured-demo",
  generatedAt: "2026-05-09T16:45:00.000Z",
  sourcePrompt:
    "A compact modern sustainable home in Toronto with warm natural materials, flexible work space, and strong daylight in the shared living areas.",
  conceptSummary:
    "A compact warm-modern home shaped for Toronto's cold climate, using a simple two-level layout, strong south-facing daylight, and a restrained envelope-first sustainability strategy. The concept keeps the plan efficient, makes room for flexible work, and concentrates the highest-impact upgrades around insulation, solar readiness, and water-smart landscaping.",
  location: "Toronto, Canada",
  climateType: "cold",
  budgetLevel: "medium",
  architecturalStyle: "Compact warm modern",
  sustainabilityScore: {
    total: 84,
    energyEfficiency: 89,
    waterEfficiency: 74,
    climateResilience: 88,
    materialSustainability: 81,
    affordability: 79,
    environmentalImpact: 85
  },
  floorPlan: {
    width: 18,
    height: 12,
    rooms: [
      {
        name: "Living Room",
        x: 0,
        y: 0,
        width: 8,
        height: 5,
        floor: 0,
        type: "social"
      },
      {
        name: "Kitchen + Dining",
        x: 8,
        y: 0,
        width: 10,
        height: 5,
        floor: 0,
        type: "social"
      },
      {
        name: "Flex Office",
        x: 0,
        y: 5,
        width: 5,
        height: 3.5,
        floor: 0,
        type: "work"
      },
      {
        name: "Bath",
        x: 5,
        y: 5,
        width: 3,
        height: 3.5,
        floor: 0,
        type: "service"
      },
      {
        name: "Entry + Mudroom",
        x: 8,
        y: 5,
        width: 4,
        height: 3.5,
        floor: 0,
        type: "circulation"
      },
      {
        name: "Utility",
        x: 12,
        y: 5,
        width: 6,
        height: 3.5,
        floor: 0,
        type: "service"
      },
      {
        name: "Covered Terrace",
        x: 0,
        y: 8.5,
        width: 18,
        height: 3.5,
        floor: 0,
        type: "outdoor"
      },
      {
        name: "Primary Suite",
        x: 0,
        y: 0,
        width: 8,
        height: 5,
        floor: 1,
        type: "private"
      },
      {
        name: "Bedroom 2",
        x: 8,
        y: 0,
        width: 5,
        height: 5,
        floor: 1,
        type: "private"
      },
      {
        name: "Bedroom 3",
        x: 13,
        y: 0,
        width: 5,
        height: 5,
        floor: 1,
        type: "private"
      },
      {
        name: "Family Loft",
        x: 0,
        y: 5,
        width: 8,
        height: 3.5,
        floor: 1,
        type: "social"
      },
      {
        name: "Shared Bath",
        x: 8,
        y: 5,
        width: 4,
        height: 3.5,
        floor: 1,
        type: "service"
      },
      {
        name: "Laundry",
        x: 12,
        y: 5,
        width: 3,
        height: 3.5,
        floor: 1,
        type: "service"
      },
      {
        name: "Landing",
        x: 15,
        y: 5,
        width: 3,
        height: 3.5,
        floor: 1,
        type: "circulation"
      }
    ]
  },
  model3D: {
    floors: 2,
    roofType: "gable",
    wallMaterial: "Timber-framed wall assembly with cellulose insulation",
    exteriorColor: "sandstone-beige",
    windows: [
      { wall: "south", offset: 0.28, width: 1.8, height: 1.5, floor: 0 },
      { wall: "south", offset: 0.48, width: 2.2, height: 1.6, floor: 0 },
      { wall: "south", offset: 0.68, width: 1.8, height: 1.5, floor: 0 },
      { wall: "north", offset: 0.3, width: 1.4, height: 1.3, floor: 0 },
      { wall: "north", offset: 0.68, width: 1.4, height: 1.3, floor: 0 },
      { wall: "east", offset: 0.25, width: 1.2, height: 1.2, floor: 0 },
      { wall: "west", offset: 0.25, width: 1.2, height: 1.2, floor: 0 },
      { wall: "south", offset: 0.23, width: 1.5, height: 1.3, floor: 1 },
      { wall: "south", offset: 0.50, width: 1.5, height: 1.3, floor: 1 },
      { wall: "south", offset: 0.77, width: 1.4, height: 1.3, floor: 1 },
      { wall: "north", offset: 0.46, width: 1.3, height: 1.2, floor: 1 }
    ],
    doors: [
      { wall: "south", offset: 0.11, width: 1.1, height: 2.2, floor: 0 },
      { wall: "south", offset: 0.87, width: 1.8, height: 2.3, floor: 0 }
    ],
    sustainabilityFeatures: {
      solarPanels: true,
      greenRoof: false,
      rainwaterTank: true,
      trees: true,
      permeableDriveway: true,
      crossVentilation: true
    }
  },
  upgrades: [
    {
      title: "Passive solar glazing strategy",
      category: "Energy",
      impactLevel: "High",
      explanation:
        "Shared rooms are opened toward winter sun while overhangs keep late-summer glare in check.",
      estimatedBenefit: "Lower winter heating demand by 12 to 18%"
    },
    {
      title: "Airtight envelope and heat recovery",
      category: "Resilience",
      impactLevel: "High",
      explanation:
        "A tighter shell paired with balanced ventilation protects comfort during deep cold snaps.",
      estimatedBenefit: "Reduce heat loss and improve indoor air stability"
    },
    {
      title: "Low-flow fixtures and capture tank",
      category: "Water",
      impactLevel: "Medium",
      explanation:
        "Bathroom fixtures and landscape irrigation are paired with a compact rainwater tank.",
      estimatedBenefit: "Cut potable water demand by 15 to 25%"
    },
    {
      title: "Solar-ready electrical backbone",
      category: "Energy",
      impactLevel: "Medium",
      explanation:
        "The roof and panel layout are planned now so solar can be added later without rework.",
      estimatedBenefit: "Avoid future retrofit cost and downtime"
    }
  ],
  materials: [
    {
      name: "Cellulose-insulated timber walls",
      reason:
        "Keeps the structure light and warm while fitting the calm natural material language.",
      sustainabilityBenefit:
        "Lower embodied carbon than conventional high-cement wall assemblies"
    },
    {
      name: "Durable aluminum-clad windows",
      reason:
        "Supports a high-performance envelope without adding constant maintenance pressure.",
      sustainabilityBenefit:
        "Improves thermal performance and reduces long-term replacement cycles"
    },
    {
      name: "Reclaimed oak interior finishes",
      reason:
        "Adds warmth to the compact plan and helps the shared spaces feel grounded rather than sparse.",
      sustainabilityBenefit:
        "Extends the life of existing material stock while reducing virgin timber demand"
    }
  ],
  visualPrompts: {
    exteriorPrompt:
      "Editorial exterior rendering of a compact warm modern sustainable home in Toronto with pale beige cladding, dark solar panels, snow-ready gable rooflines, restrained landscaping, and soft evening light.",
    interiorPrompt:
      "Interior rendering of a sustainable Toronto home with reclaimed oak, warm daylight, compact built-in storage, calm neutral textiles, and energy-smart detailing around windows and insulation depth."
  },
  inspirationImages: [
    {
      id: "sample-1",
      name: "warm-wood-modern-home.jpg",
      type: "image/jpeg",
      size: 240000
    }
  ],
  styleAnalysis: {
    aesthetic: "warm organic contemporary",
    palette: ["oak", "linen", "sage", "charcoal"],
    materials: ["light timber", "textured tile", "brushed metal"],
    lighting: ["daylit living spaces", "ambient evening layers"],
    layoutPatterns: [
      "open kitchen-living connection",
      "garden-facing family zone"
    ],
    summary:
      "The inspiration leans toward warm organic contemporary design with layered natural textures."
  },
  guidanceSnippets: [
    {
      title: "Cold-climate envelope first",
      source: "climate-resilience.md",
      content:
        "Prioritize airtight detailing, continuous insulation, and a compact plan before sizing mechanical systems."
    },
    {
      title: "Water-smart site strategy",
      source: "water-efficiency.md",
      content:
        "Use permeable paving, rain capture, and drought-tolerant planting to cut outdoor water demand."
    },
    {
      title: "Budget-aware solar readiness",
      source: "budget-tradeoffs.md",
      content:
        "Prewire for solar and protect roof access now even if full PV installation comes later."
    }
  ]
});
