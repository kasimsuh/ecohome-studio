import { budgetLabels, climateLabels } from "@/lib/domain/constants";
import type {
  BudgetLevel,
  ClimateRegion,
  DreamHomeInput,
  GeneratedHomeConcept,
  InspirationImage,
  Recommendation,
  StyleAnalysis,
  SustainabilityScore
} from "@/lib/domain/types";

const climateSpecificContent: Record<
  ClimateRegion,
  {
    narrative: string;
    floorPlanIdeas: string[];
    exteriorConcepts: string[];
    resilienceUpgrade: Recommendation;
    energyUpgrade: Recommendation;
    scoreBias: Omit<SustainabilityScore, "total" | "affordability">;
    impact: GeneratedHomeConcept["environmentalImpact"];
  }
> = {
  "hot-arid": {
    narrative:
      "The concept prioritizes shaded outdoor living, thermal mass, and natural airflow so the home stays comfortable with less mechanical cooling.",
    floorPlanIdeas: [
      "Use a breezeway entry and shaded courtyard to cool shared living zones.",
      "Group bedrooms on the quieter east edge to reduce late-day heat gain.",
      "Pull kitchens and utility zones toward the insulated west wall."
    ],
    exteriorConcepts: [
      "Deep roof overhangs with pale mineral finishes and screened terraces.",
      "Landscape with drought-tolerant planting, gravel swales, and shaded seating."
    ],
    resilienceUpgrade: {
      title: "Layered solar shading",
      category: "Comfort",
      rationale: "External louvers and pergolas cut heat gain before it reaches the glazing.",
      budgetFit: "all",
      estimatedSavings: "Lower cooling demand by 12 to 18%",
      impact: "High"
    },
    energyUpgrade: {
      title: "Reflective roof and attic venting",
      category: "Energy",
      rationale: "A cool roof reduces peak indoor temperatures and protects the envelope.",
      budgetFit: "all",
      estimatedSavings: "Reduce summer cooling load by up to 15%",
      impact: "High"
    },
    scoreBias: {
      energyEfficiency: 88,
      waterEfficiency: 79,
      climateResilience: 84,
      materialSustainability: 80,
      environmentalImpact: 85
    },
    impact: {
      energyReduction: "Up to 31%",
      waterReduction: "Up to 24%",
      embodiedCarbonReduction: "About 18%",
      resilienceGain: "Improved heat wave comfort"
    }
  },
  temperate: {
    narrative:
      "The concept balances four-season comfort with flexible glazing, daylight, and insulation choices that prevent overdesign.",
    floorPlanIdeas: [
      "Center living spaces around a sunny south-facing family room.",
      "Place flex rooms near the entry so the home adapts to work or guests.",
      "Use a compact plumbing core to keep systems efficient and cost-conscious."
    ],
    exteriorConcepts: [
      "Warm contemporary facades with balanced glazing and covered entries.",
      "Permeable walkways and native planting that handle changing seasonal rainfall."
    ],
    resilienceUpgrade: {
      title: "Balanced ventilation with smart zoning",
      category: "Comfort",
      rationale: "Fresh-air delivery stays aligned with occupancy and shoulder-season weather swings.",
      budgetFit: "medium",
      estimatedSavings: "Improve comfort while trimming HVAC runtime",
      impact: "Medium"
    },
    energyUpgrade: {
      title: "High-performance insulation package",
      category: "Energy",
      rationale: "A tighter envelope cuts both winter heat loss and summer peak loads.",
      budgetFit: "all",
      estimatedSavings: "Reduce annual energy use by 18 to 24%",
      impact: "High"
    },
    scoreBias: {
      energyEfficiency: 83,
      waterEfficiency: 78,
      climateResilience: 80,
      materialSustainability: 82,
      environmentalImpact: 81
    },
    impact: {
      energyReduction: "Up to 27%",
      waterReduction: "Up to 18%",
      embodiedCarbonReduction: "About 16%",
      resilienceGain: "Better seasonal comfort swing handling"
    }
  },
  cold: {
    narrative:
      "The concept favors passive solar gain, airtight detailing, and high-performance insulation to hold warmth and reduce operating costs.",
    floorPlanIdeas: [
      "Pull living and dining areas to the south edge for winter daylight and heat gain.",
      "Create a mudroom and storage buffer on the coldest exposure.",
      "Consolidate bedrooms around a compact circulation spine to reduce heat loss."
    ],
    exteriorConcepts: [
      "Sharper rooflines with snow-shedding geometry and durable cladding.",
      "Protected entries, vestibules, and warmer material palettes for winter comfort."
    ],
    resilienceUpgrade: {
      title: "Enhanced airtightness and heat-recovery ventilation",
      category: "Resilience",
      rationale: "Tighter construction preserves comfort during severe cold snaps and outages.",
      budgetFit: "medium",
      estimatedSavings: "Lower heating losses by up to 20%",
      impact: "High"
    },
    energyUpgrade: {
      title: "Passive solar glazing strategy",
      category: "Energy",
      rationale: "Winter sun is captured strategically while summer glare stays controlled.",
      budgetFit: "all",
      estimatedSavings: "Improve winter heat retention and daylight autonomy",
      impact: "High"
    },
    scoreBias: {
      energyEfficiency: 90,
      waterEfficiency: 74,
      climateResilience: 88,
      materialSustainability: 79,
      environmentalImpact: 86
    },
    impact: {
      energyReduction: "Up to 34%",
      waterReduction: "Up to 14%",
      embodiedCarbonReduction: "About 17%",
      resilienceGain: "Stronger cold-weather performance"
    }
  },
  tropical: {
    narrative:
      "The concept emphasizes breathable interiors, raised airflow, and moisture-aware materials to stay bright and comfortable in humid conditions.",
    floorPlanIdeas: [
      "Stretch the plan to maximize cross-breezes through common spaces.",
      "Use semi-open transition zones like verandas to manage humidity.",
      "Separate wet rooms from bedrooms with ventilated service strips."
    ],
    exteriorConcepts: [
      "Large roof canopies, screened openings, and rain-ready detailing.",
      "Lush planted edges paired with raised decks and breezy outdoor rooms."
    ],
    resilienceUpgrade: {
      title: "Moisture-resistant wall and ventilation package",
      category: "Resilience",
      rationale: "Humidity control protects indoor air quality and long-term material durability.",
      budgetFit: "all",
      estimatedSavings: "Reduce mold risk and maintenance loads",
      impact: "High"
    },
    energyUpgrade: {
      title: "Ceiling fans plus mixed-mode cooling",
      category: "Energy",
      rationale: "Fans and ventilation allow higher thermostat settings without sacrificing comfort.",
      budgetFit: "low",
      estimatedSavings: "Cut cooling energy by 8 to 14%",
      impact: "Medium"
    },
    scoreBias: {
      energyEfficiency: 82,
      waterEfficiency: 81,
      climateResilience: 86,
      materialSustainability: 78,
      environmentalImpact: 80
    },
    impact: {
      energyReduction: "Up to 22%",
      waterReduction: "Up to 20%",
      embodiedCarbonReduction: "About 15%",
      resilienceGain: "Reduced humidity and storm exposure risk"
    }
  },
  "flood-prone": {
    narrative:
      "The concept treats resilience as a design feature, with water-aware siting, durable materials, and service locations chosen for recovery speed.",
    floorPlanIdeas: [
      "Lift primary living spaces above grade or protect them with floodable lower zones.",
      "Keep mechanical systems and storage off the most exposed floor level.",
      "Route circulation to support easy cleanup and durable surface transitions."
    ],
    exteriorConcepts: [
      "Elevated plinths, permeable surfaces, and drainage-focused landscape design.",
      "Moisture-tolerant cladding, screened porches, and protected utility access."
    ],
    resilienceUpgrade: {
      title: "Elevated foundation and site drainage strategy",
      category: "Resilience",
      rationale: "Water is directed away from the home while critical areas stay protected.",
      budgetFit: "medium",
      estimatedSavings: "Reduce flood recovery costs and downtime",
      impact: "High"
    },
    energyUpgrade: {
      title: "Moisture-smart insulation and assemblies",
      category: "Materials",
      rationale: "Durable assemblies preserve performance after extreme weather events.",
      budgetFit: "all",
      estimatedSavings: "Protect thermal performance and reduce replacement cycles",
      impact: "High"
    },
    scoreBias: {
      energyEfficiency: 80,
      waterEfficiency: 85,
      climateResilience: 92,
      materialSustainability: 81,
      environmentalImpact: 82
    },
    impact: {
      energyReduction: "Up to 21%",
      waterReduction: "Up to 28%",
      embodiedCarbonReduction: "About 14%",
      resilienceGain: "Faster recovery after heavy rainfall"
    }
  }
};

const budgetSpecificUpgrade: Record<BudgetLevel, Recommendation> = {
  low: {
    title: "Seal leaks and phase upgrades over time",
    category: "Energy",
    rationale: "A staged plan captures the biggest savings first without forcing a full premium build.",
    budgetFit: "low",
    estimatedSavings: "Deliver strong payback in the first retrofit phases",
    impact: "High"
  },
  medium: {
    title: "Targeted solar-ready electrical planning",
    category: "Energy",
    rationale: "Prewiring and panel sizing keep near-term costs reasonable while preserving future expansion.",
    budgetFit: "medium",
    estimatedSavings: "Avoid costly retrofit work later",
    impact: "Medium"
  },
  premium: {
    title: "Net-zero leaning energy stack",
    category: "Energy",
    rationale: "High-performance glazing, solar, storage, and smart controls can be designed as one system.",
    budgetFit: "premium",
    estimatedSavings: "Substantially lower operational emissions over time",
    impact: "High"
  }
};

const budgetNarratives: Record<BudgetLevel, string> = {
  low: "The budget strategy emphasizes passive comfort, right-sized systems, and local materials so the concept remains credible and buildable.",
  medium:
    "The budget strategy balances visible design quality with envelope and systems upgrades that pay off in comfort and utility savings.",
  premium:
    "The budget strategy allows deeper investment in resilience, low-carbon materials, and long-life performance systems without losing the original design ambition."
};

function clampScore(value: number) {
  return Math.max(60, Math.min(96, Math.round(value)));
}

function createScore(climateRegion: ClimateRegion, budgetLevel: BudgetLevel): SustainabilityScore {
  const bias = climateSpecificContent[climateRegion].scoreBias;
  const affordabilityBase = budgetLevel === "low" ? 91 : budgetLevel === "medium" ? 84 : 74;

  const score: SustainabilityScore = {
    energyEfficiency: clampScore(bias.energyEfficiency + (budgetLevel === "premium" ? 2 : 0)),
    waterEfficiency: clampScore(bias.waterEfficiency + (budgetLevel === "premium" ? 2 : 0)),
    climateResilience: clampScore(bias.climateResilience + (budgetLevel !== "low" ? 2 : 0)),
    materialSustainability: clampScore(bias.materialSustainability + (budgetLevel === "medium" ? 2 : 4)),
    affordability: affordabilityBase,
    environmentalImpact: clampScore(
      bias.environmentalImpact + (budgetLevel === "premium" ? 2 : 0)
    ),
    total: 0
  };

  score.total = Math.round(
    (
      score.energyEfficiency +
      score.waterEfficiency +
      score.climateResilience +
      score.materialSustainability +
      score.affordability +
      score.environmentalImpact
    ) / 6
  );

  return score;
}

function includesAny(source: string, keywords: string[]) {
  return keywords.some((keyword) => source.includes(keyword));
}

function inferArchitecturalStyle(description: string, styleAnalysis?: StyleAnalysis | null) {
  const source = `${description} ${styleAnalysis?.aesthetic ?? ""}`.toLowerCase();

  if (includesAny(source, ["minimal", "clean", "simple"])) {
    return "Minimal contemporary";
  }
  if (includesAny(source, ["coastal", "breezy", "beach"])) {
    return "Climate-smart coastal modern";
  }
  if (includesAny(source, ["scandinavian", "light wood", "nordic"])) {
    return "Scandinavian warm modern";
  }
  if (includesAny(source, ["industrial", "concrete", "steel"])) {
    return "Soft industrial sustainable";
  }
  if (includesAny(source, ["farmhouse", "rustic", "natural"])) {
    return "Modern organic farmhouse";
  }

  return "Warm contemporary eco-modern";
}

function createDesignPrinciples(
  climateRegion: ClimateRegion,
  budgetLevel: BudgetLevel,
  styleAnalysis?: StyleAnalysis | null
) {
  const principles = [
    "Use passive design before adding mechanical complexity.",
    "Favor durable low-maintenance materials with local sourcing potential.",
    "Make natural light and ventilation part of the spatial identity."
  ];

  if (budgetLevel !== "low") {
    principles.push("Reserve roof and service zones for future clean-energy upgrades.");
  }

  if (styleAnalysis?.materials.length) {
    principles.push(`Translate inspiration materials like ${styleAnalysis.materials[0]} into lower-impact alternatives.`);
  }

  if (climateRegion === "flood-prone") {
    principles.push("Treat drainage, elevation, and recovery speed as first-class design moves.");
  }

  return principles;
}

function createRoomLayoutIdeas(style: string, description: string, climateRegion: ClimateRegion) {
  const source = description.toLowerCase();
  const familyFlex =
    includesAny(source, ["family", "kids", "guests", "office", "work"]) ||
    climateRegion === "temperate"
      ? "Add one flexible room that can switch between office, guest, or study use."
      : "Keep circulation compact so more floor area stays in active living zones.";

  return [
    `${style} layout anchored by a social kitchen, dining, and lounge spine.`,
    climateSpecificContent[climateRegion].floorPlanIdeas[0],
    familyFlex
  ];
}

function createRecommendations(
  climateRegion: ClimateRegion,
  budgetLevel: BudgetLevel,
  styleAnalysis?: StyleAnalysis | null
) {
  const climateContent = climateSpecificContent[climateRegion];
  const materialRecommendation: Recommendation = {
    title: "Lower-impact finish palette",
    category: "Materials",
    rationale: styleAnalysis?.materials.length
      ? `Preserve the feel of ${styleAnalysis.materials[0]} while prioritizing recycled, reclaimed, or certified sources.`
      : "Prioritize recycled, reclaimed, or certified materials for finishes and built-ins.",
    budgetFit: "all",
    estimatedSavings: "Reduce embodied carbon in visible material packages",
    impact: "Medium"
  };
  const waterRecommendation: Recommendation = {
    title: "Rain and water efficiency package",
    category: "Water",
    rationale: "Low-flow fixtures, smart irrigation, and rain capture reduce utility use without changing the look of the home.",
    budgetFit: "all",
    estimatedSavings: "Lower water demand by 15 to 30%",
    impact: "High"
  };

  return [
    climateContent.energyUpgrade,
    climateContent.resilienceUpgrade,
    waterRecommendation,
    budgetSpecificUpgrade[budgetLevel],
    materialRecommendation
  ];
}

function createVisualPrompts(
  style: string,
  input: DreamHomeInput,
  styleAnalysis?: StyleAnalysis | null
) {
  const palette = styleAnalysis?.palette.join(", ") ?? "sand, moss, stone, and warm wood";
  const materialFocus = styleAnalysis?.materials.join(", ") ?? "timber, limewash, recycled stone";

  return [
    {
      label: "Exterior concept",
      prompt: `Design a ${style} home in ${input.location} for a ${climateLabels[input.climateRegion].toLowerCase()} context, with ${materialFocus}, passive shading, layered landscaping, and a polished editorial architecture render.`,
      note: "Use this with your preferred image model for hero exterior renders."
    },
    {
      label: "Interior concept",
      prompt: `Create a sustainable interior concept for a ${style} home with ${palette} tones, natural daylight, efficient storage, and calm premium detailing suited to a ${budgetLabels[input.budgetLevel].toLowerCase()} brief.`,
      note: "Useful for moodboard generation or room-by-room visualization."
    },
    {
      label: "Floor plan sketch",
      prompt: `Generate a clean 2D schematic floor plan for a ${style} sustainable home emphasizing ${input.climateRegion} climate strategies, compact circulation, and adaptable family spaces.`,
      note: "Best used as a prompt starter for lightweight plan ideation."
    }
  ];
}

export function createInspirationImageRecord(file: Pick<File, "name" | "type" | "size">): InspirationImage {
  return {
    id: `${file.name}-${file.size}`,
    name: file.name,
    type: file.type,
    size: file.size
  };
}

export function createStyleAnalysis(images: InspirationImage[]): StyleAnalysis {
  const joinedNames = images.map((image) => image.name.toLowerCase()).join(" ");

  const aesthetic = includesAny(joinedNames, ["minimal", "scandi", "clean"])
    ? "minimal bright modernism"
    : includesAny(joinedNames, ["wood", "earth", "organic"])
      ? "warm organic contemporary"
      : includesAny(joinedNames, ["lux", "premium", "stone"])
        ? "quiet premium modernism"
        : "climate-smart contemporary";

  const palette = includesAny(joinedNames, ["green", "sage"])
    ? ["sage", "linen", "charcoal", "oak"]
    : includesAny(joinedNames, ["blue", "coast"])
      ? ["sea glass", "sand", "shell white", "driftwood"]
      : ["terracotta", "stone", "moss", "warm white"];

  const materials = includesAny(joinedNames, ["stone"])
    ? ["textured stone", "reclaimed timber", "matte metal"]
    : includesAny(joinedNames, ["wood"])
      ? ["light timber", "natural plaster", "woven accents"]
      : ["limewash", "recycled timber", "porcelain tile"];

  return {
    aesthetic,
    palette,
    materials,
    lighting: ["daylit shared spaces", "soft ambient evening lighting"],
    layoutPatterns: ["open kitchen-living flow", "indoor-outdoor transition zones"],
    summary: `The inspiration points toward ${aesthetic} with ${palette.join(", ")} tones and a focus on ${materials[0]}.`
  };
}

export function createGeneratedHomeConcept(
  input: DreamHomeInput,
  projectId = `eco-${Math.random().toString(36).slice(2, 8)}`
): GeneratedHomeConcept {
  const climateContent = climateSpecificContent[input.climateRegion];
  const style = inferArchitecturalStyle(input.description, input.styleAnalysis);
  const summary = `This concept translates the user's brief into a ${style.toLowerCase()} home for ${input.location}, combining ${climateLabels[input.climateRegion].toLowerCase()} strategies with ${budgetLabels[input.budgetLevel].toLowerCase()} decision-making.`;

  return {
    projectId,
    heroTitle: `${style} for ${input.location}`,
    summary,
    architecturalStyle: style,
    roomLayoutIdeas: createRoomLayoutIdeas(style, input.description, input.climateRegion),
    exteriorConcepts: climateContent.exteriorConcepts,
    interiorConcepts: [
      "Layer natural materials, washable finishes, and daylight-friendly layouts to keep the interior calm and durable.",
      "Use built-in storage, cross-ventilated rooms, and adaptable furniture zones so the home stays efficient as needs change."
    ],
    sustainabilityUpgrades: createRecommendations(
      input.climateRegion,
      input.budgetLevel,
      input.styleAnalysis
    ),
    floorPlanIdeas: climateContent.floorPlanIdeas,
    sustainabilityScore: createScore(input.climateRegion, input.budgetLevel),
    environmentalImpact: climateContent.impact,
    climateNarrative: climateContent.narrative,
    budgetNarrative: budgetNarratives[input.budgetLevel],
    visualPrompts: createVisualPrompts(style, input, input.styleAnalysis),
    designPrinciples: createDesignPrinciples(
      input.climateRegion,
      input.budgetLevel,
      input.styleAnalysis
    ),
    styleAnalysis: input.styleAnalysis,
    location: input.location,
    climateRegion: input.climateRegion,
    budgetLevel: input.budgetLevel,
    generatedAt: new Date().toISOString()
  };
}
