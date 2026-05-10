import OpenAI from "openai-v6";

import {
  floorPlanRoomTypeValues,
  generatedHomeConceptSchema,
  homeConceptSchema,
  impactLevelValues,
  openingWallValues,
  roofTypeValues,
  type GenerateHomeRequest,
  type GeneratedHomeConceptPayload,
  type GuidanceSnippet,
  type HomeConcept,
  type SourceReference,
  upgradeCategoryValues,
} from "@/lib/domain/home-concept-schema";
import { sanitizeHomeGeometry } from "@/lib/domain/home-geometry";
import {
  budgetLevelValues,
  climateRegionValues,
} from "@/lib/domain/types";

const FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1";

type FloorPlanRoomType = HomeConcept["floorPlan"]["rooms"][number]["type"];
type RoofType = HomeConcept["model3D"]["roofType"];
type OpeningWall = HomeConcept["model3D"]["windows"][number]["wall"];
type UpgradeCategory = HomeConcept["upgrades"][number]["category"];
type ImpactLevel = HomeConcept["upgrades"][number]["impactLevel"];

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numeric) ? numeric : null;
}

function clampInteger(value: unknown, minimum: number, maximum: number, fallback: number) {
  const numeric = getNumber(value);

  if (numeric === null) {
    return fallback;
  }

  return Math.max(minimum, Math.min(maximum, Math.round(numeric)));
}

function positiveNumber(value: unknown, fallback: number) {
  const numeric = getNumber(value);

  if (numeric === null || numeric <= 0) {
    return fallback;
  }

  return numeric;
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sentenceCase(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const token = normalizeToken(value);

    if (
      token === "true" ||
      token === "yes" ||
      token === "y" ||
      token === "enabled" ||
      token === "present" ||
      token === "included" ||
      token === "1"
    ) {
      return true;
    }

    if (
      token === "false" ||
      token === "no" ||
      token === "n" ||
      token === "disabled" ||
      token === "absent" ||
      token === "none" ||
      token === "0"
    ) {
      return false;
    }
  }

  return Boolean(value);
}

function normalizeClimateType(value: unknown, fallback: GenerateHomeRequest["climateRegion"]) {
  const candidate = getString(value);

  if (!candidate) {
    return fallback;
  }

  const token = normalizeToken(candidate);

  if ((climateRegionValues as readonly string[]).includes(token)) {
    return token as GenerateHomeRequest["climateRegion"];
  }

  if (token.includes("flood") || token.includes("coastal")) {
    return "flood-prone";
  }

  if (token.includes("tropic") || token.includes("humid")) {
    return "tropical";
  }

  if (token.includes("temperate") || token.includes("mild")) {
    return "temperate";
  }

  if (token.includes("cold") || token.includes("snow") || token.includes("winter")) {
    return "cold";
  }

  if (token.includes("arid") || token.includes("desert") || token.includes("dry")) {
    return "hot-arid";
  }

  return fallback;
}

function normalizeBudgetLevel(value: unknown, fallback: GenerateHomeRequest["budgetLevel"]) {
  const candidate = getString(value);

  if (!candidate) {
    return fallback;
  }

  const token = normalizeToken(candidate);

  if ((budgetLevelValues as readonly string[]).includes(token)) {
    return token as GenerateHomeRequest["budgetLevel"];
  }

  if (
    token.includes("premium") ||
    token.includes("luxury") ||
    token.includes("high end") ||
    token.includes("high-end")
  ) {
    return "premium";
  }

  if (
    token.includes("medium") ||
    token.includes("mid") ||
    token.includes("moderate") ||
    token.includes("standard")
  ) {
    return "medium";
  }

  if (
    token.includes("low") ||
    token.includes("budget") ||
    token.includes("affordable") ||
    token.includes("economy")
  ) {
    return "low";
  }

  return fallback;
}

function createProjectId(location: string) {
  const slug = location
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return `eco-${slug || "concept"}-${Math.random().toString(36).slice(2, 6)}`;
}

function getClient() {
  const apiKey = process.env.FEATHERLESS_API_KEY;
  const model = process.env.FEATHERLESS_MODEL;
  const baseURL = process.env.FEATHERLESS_BASE_URL || FEATHERLESS_BASE_URL;

  if (!apiKey || !model) {
    throw new Error(
      "Featherless credentials are not configured. Set FEATHERLESS_API_KEY and FEATHERLESS_MODEL."
    );
  }

  return {
    model,
    client: new OpenAI({
      apiKey,
      baseURL
    })
  };
}

function clampScore(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeRoomType(rawType: unknown, roomName: unknown): FloorPlanRoomType {
  const directType = getString(rawType);
  const directToken = normalizeToken(directType);

  if ((floorPlanRoomTypeValues as readonly string[]).includes(directToken)) {
    return directToken as FloorPlanRoomType;
  }

  const hint = `${directType} ${getString(roomName)}`.trim();
  const token = normalizeToken(hint);

  if (
    token.includes("outdoor") ||
    token.includes("terrace") ||
    token.includes("patio") ||
    token.includes("deck") ||
    token.includes("balcony") ||
    token.includes("porch") ||
    token.includes("courtyard") ||
    token.includes("garden")
  ) {
    return "outdoor";
  }

  if (
    token.includes("office") ||
    token.includes("study") ||
    token.includes("studio") ||
    token.includes("library") ||
    token.includes("workspace") ||
    token.includes("work")
  ) {
    return "work";
  }

  if (
    token.includes("bath") ||
    token.includes("powder") ||
    token.includes("toilet") ||
    token.includes("laundry") ||
    token.includes("utility") ||
    token.includes("mechanical") ||
    token.includes("storage") ||
    token.includes("pantry") ||
    token.includes("service")
  ) {
    return "service";
  }

  if (
    token.includes("bed") ||
    token.includes("suite") ||
    token.includes("nursery") ||
    token.includes("guest")
  ) {
    return "private";
  }

  if (
    token.includes("hall") ||
    token.includes("corridor") ||
    token.includes("entry") ||
    token.includes("foyer") ||
    token.includes("mudroom") ||
    token.includes("stair") ||
    token.includes("landing") ||
    token.includes("circulation")
  ) {
    return "circulation";
  }

  if (
    token.includes("living") ||
    token.includes("dining") ||
    token.includes("kitchen") ||
    token.includes("family") ||
    token.includes("great room") ||
    token.includes("greatroom") ||
    token.includes("lounge") ||
    token.includes("open plan") ||
    token.includes("open-plan")
  ) {
    return "social";
  }

  return "social";
}

function normalizeRoofType(value: unknown): RoofType {
  const candidate = getString(value);
  const token = normalizeToken(candidate);

  if ((roofTypeValues as readonly string[]).includes(token)) {
    return token as RoofType;
  }

  if (token.includes("butterfly")) {
    return "butterfly";
  }

  if (token.includes("gable") || token.includes("pitched")) {
    return "gable";
  }

  if (token.includes("hip")) {
    return "hip";
  }

  if (token.includes("shed") || token.includes("mono")) {
    return "shed";
  }

  if (token.includes("flat") || token.includes("parapet")) {
    return "flat";
  }

  return "flat";
}

function normalizeOpeningWall(value: unknown): OpeningWall | null {
  const candidate = getString(value);
  const token = normalizeToken(candidate);

  if ((openingWallValues as readonly string[]).includes(token)) {
    return token as OpeningWall;
  }

  if (token === "n") {
    return "north";
  }

  if (token === "s") {
    return "south";
  }

  if (token === "e") {
    return "east";
  }

  if (token === "w") {
    return "west";
  }

  if (token.includes("north")) {
    return "north";
  }

  if (token.includes("south")) {
    return "south";
  }

  if (token.includes("east")) {
    return "east";
  }

  if (token.includes("west")) {
    return "west";
  }

  return null;
}

function normalizeOffset(value: unknown) {
  const numeric = getNumber(value);

  if (numeric === null) {
    return 0.5;
  }

  if (numeric >= 0 && numeric <= 1) {
    return numeric;
  }

  if (Number.isInteger(numeric) && numeric > 1 && numeric <= 100) {
    return Math.max(0, Math.min(1, numeric / 100));
  }

  return Math.max(0, Math.min(1, numeric));
}

function normalizeUpgradeCategory(value: unknown, hint: string): UpgradeCategory {
  const candidate = getString(value);

  if ((upgradeCategoryValues as readonly string[]).includes(candidate)) {
    return candidate as UpgradeCategory;
  }

  const token = normalizeToken(`${candidate} ${hint}`);

  if (
    token.includes("water") ||
    token.includes("rain") ||
    token.includes("greywater") ||
    token.includes("stormwater") ||
    token.includes("irrigation")
  ) {
    return "Water";
  }

  if (
    token.includes("material") ||
    token.includes("timber") ||
    token.includes("wood") ||
    token.includes("brick") ||
    token.includes("insulation") ||
    token.includes("low carbon") ||
    token.includes("cellulose")
  ) {
    return "Materials";
  }

  if (
    token.includes("resilien") ||
    token.includes("flood") ||
    token.includes("storm") ||
    token.includes("airtight") ||
    token.includes("durable")
  ) {
    return "Resilience";
  }

  if (
    token.includes("comfort") ||
    token.includes("air quality") ||
    token.includes("daylight") ||
    token.includes("ventilation") ||
    token.includes("acoustic")
  ) {
    return "Comfort";
  }

  return "Energy";
}

function normalizeImpactLevel(value: unknown, hint: string): ImpactLevel {
  const candidate = getString(value);

  if ((impactLevelValues as readonly string[]).includes(candidate)) {
    return candidate as ImpactLevel;
  }

  const token = normalizeToken(`${candidate} ${hint}`);

  if (
    token.includes("high") ||
    token.includes("major") ||
    token.includes("significant") ||
    token.includes("strong")
  ) {
    return "High";
  }

  if (token.includes("low") || token.includes("minor") || token.includes("small")) {
    return "Low";
  }

  return "Medium";
}

function buildFallbackSummary(
  input: GenerateHomeRequest,
  architecturalStyle: string,
  floorCount: number,
) {
  return [
    `A ${architecturalStyle.toLowerCase()} home concept for ${input.location}`,
    `shaped for ${input.climateRegion} conditions`,
    `with a ${floorCount}-floor layout and ${input.budgetLevel} budget priorities.`,
  ].join(" ");
}

function buildFallbackVisualPrompts(
  input: GenerateHomeRequest,
  architecturalStyle: string,
  wallMaterial: string,
  exteriorColor: string,
) {
  return {
    exteriorPrompt: [
      `Exterior perspective of a ${architecturalStyle.toLowerCase()} sustainable home in ${input.location}.`,
      `Climate: ${input.climateRegion}.`,
      `Material palette: ${wallMaterial}.`,
      `Exterior finish: ${exteriorColor}.`,
      "Show practical sustainability features and clean geometry.",
    ].join(" "),
    interiorPrompt: [
      `Interior view of a ${architecturalStyle.toLowerCase()} sustainable home in ${input.location}.`,
      "Emphasize daylight, durable low-impact materials, and compact efficient planning.",
      `Reflect ${input.budgetLevel} budget choices without losing warmth or usability.`,
    ].join(" "),
  };
}

function normalizeMaterials(
  rawMaterials: unknown,
  rawModel3D: Record<string, unknown>,
  input: GenerateHomeRequest,
) {
  const normalized = (
    Array.isArray(rawMaterials)
      ? rawMaterials
      : typeof rawMaterials === "string"
        ? rawMaterials.split(/\n|;|,/g)
        : []
  )
    .map((material): HomeConcept["materials"][number] | null => {
      if (typeof material === "string") {
        const name = titleCase(material);

        if (!name) {
          return null;
        }

        return {
          name,
          reason: "Chosen for durability, climate fit, and straightforward maintenance.",
          sustainabilityBenefit: "Supports a lower-impact, longer-lasting material palette.",
        };
      }

      const entry = asRecord(material);
      const name = getString(entry.name) || getString(entry.title) || getString(entry.material);

      if (!name) {
        return null;
      }

      return {
        name: titleCase(name),
        reason:
          getString(entry.reason) ||
          getString(entry.why) ||
          getString(entry.description) ||
          "Chosen for durability, climate fit, and straightforward maintenance.",
        sustainabilityBenefit:
          getString(entry.sustainabilityBenefit) ||
          getString(entry.benefit) ||
          getString(entry.impact) ||
          "Supports a lower-impact, longer-lasting material palette.",
      };
    })
    .filter((material): material is HomeConcept["materials"][number] => material !== null);

  if (normalized.length) {
    return normalized.slice(0, 8);
  }

  const wallMaterial = getString(rawModel3D.wallMaterial);
  const fallbackNames = [
    wallMaterial,
    ...(input.styleAnalysis?.materials ?? []),
  ]
    .map((name) => titleCase(name))
    .filter(Boolean);

  if (fallbackNames.length) {
    return fallbackNames.slice(0, 3).map((name) => ({
      name,
      reason: "Selected to balance warmth, durability, and climate-aware performance.",
      sustainabilityBenefit: "Helps lower embodied impact while supporting long-term resilience.",
    }));
  }

  return [
    {
      name: "Cellulose Insulation",
      reason: "A practical envelope-first choice for comfort and energy stability.",
      sustainabilityBenefit: "Improves thermal performance with lower embodied impact than many alternatives.",
    },
  ];
}

function normalizeUpgrades(
  rawUpgrades: unknown,
  guidanceSnippets: GuidanceSnippet[],
) {
  const candidateUpgrades = Array.isArray(rawUpgrades) ? rawUpgrades : [];

  const normalized = candidateUpgrades
    .map((upgrade): HomeConcept["upgrades"][number] | null => {
      if (typeof upgrade === "string") {
        const explanation = sentenceCase(upgrade);

        if (!explanation) {
          return null;
        }

        return {
          title: explanation.slice(0, 120),
          category: normalizeUpgradeCategory("", explanation),
          impactLevel: normalizeImpactLevel("", explanation),
          explanation,
          estimatedBenefit: "Improves overall sustainability performance.",
        };
      }

      const entry = asRecord(upgrade);
      const title =
        getString(entry.title) ||
        getString(entry.name) ||
        getString(entry.recommendation) ||
        getString(entry.measure);
      const explanation =
        getString(entry.explanation) ||
        getString(entry.rationale) ||
        getString(entry.description);
      const estimatedBenefit =
        getString(entry.estimatedBenefit) ||
        getString(entry.estimatedSavings) ||
        getString(entry.benefit) ||
        getString(entry.outcome) ||
        "Improves sustainability performance.";
      const hint = `${title} ${explanation} ${estimatedBenefit}`.trim();

      if (!title || !explanation) {
        return null;
      }

      return {
        title: sentenceCase(title).slice(0, 120),
        category: normalizeUpgradeCategory(entry.category, hint),
        impactLevel: normalizeImpactLevel(entry.impactLevel ?? entry.impact, hint),
        explanation: sentenceCase(explanation).slice(0, 280),
        estimatedBenefit: sentenceCase(estimatedBenefit).slice(0, 140),
      };
    })
    .filter((upgrade): upgrade is HomeConcept["upgrades"][number] => upgrade !== null);

  if (normalized.length) {
    return normalized.slice(0, 10);
  }

  return guidanceSnippets.slice(0, 3).map((snippet) => ({
    title: snippet.title,
    category: normalizeUpgradeCategory("", snippet.content),
    impactLevel: normalizeImpactLevel("", snippet.content),
    explanation: sentenceCase(snippet.content).slice(0, 280),
    estimatedBenefit: "Grounded in the retrieved sustainability guidance.",
  }));
}

function normalizeOpenings(rawOpenings: unknown, fallbackHeight: number) {
  if (!Array.isArray(rawOpenings)) {
    return [];
  }

  return rawOpenings
    .map((opening): HomeConcept["model3D"]["windows"][number] | null => {
      const entry = asRecord(opening);
      const wall = normalizeOpeningWall(
        entry.wall ?? entry.side ?? entry.orientation ?? entry.face,
      );

      if (!wall) {
        return null;
      }

      const roomName =
        getString(entry.roomName) ||
        getString(entry.room) ||
        getString(entry.room_name) ||
        undefined;

      return {
        wall,
        offset: normalizeOffset(
          entry.offset ?? entry.position ?? entry.center ?? entry.location,
        ),
        width: positiveNumber(entry.width ?? entry.w, 1.4),
        height: positiveNumber(entry.height ?? entry.h, fallbackHeight),
        floor: clampInteger(entry.floor ?? entry.level ?? entry.story, 0, 3, 0),
        roomName,
      };
    })
    .filter((opening): opening is HomeConcept["model3D"]["windows"][number] => opening !== null);
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Model output did not contain a valid JSON object.");
    }

    return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
  }
}

function normalizeHomeConceptCandidate(
  candidate: unknown,
  input: GenerateHomeRequest,
  guidanceSnippets: GuidanceSnippet[],
): HomeConcept {
  if (!candidate || typeof candidate !== "object") {
    throw new Error("Model output was not an object.");
  }

  const raw = candidate as Record<string, unknown>;
  const rawScore =
    raw.sustainabilityScore && typeof raw.sustainabilityScore === "object"
      ? (raw.sustainabilityScore as Record<string, unknown>)
      : {};
  const rawFloorPlan = asRecord(raw.floorPlan ?? raw.floorplan);
  const rawRooms = Array.isArray(rawFloorPlan.rooms)
    ? rawFloorPlan.rooms
    : Array.isArray(raw.rooms)
      ? raw.rooms
      : [];
  const normalizedRooms = rawRooms
    .map((room): HomeConcept["floorPlan"]["rooms"][number] | null => {
      const entry = asRecord(room);
      const name =
        getString(entry.name) ||
        getString(entry.label) ||
        getString(entry.roomName) ||
        getString(entry.room);

      if (!name) {
        return null;
      }

      return {
        name: sentenceCase(name).slice(0, 80),
        x: Math.max(0, positiveNumber(entry.x, 0)),
        y: Math.max(0, positiveNumber(entry.y, 0)),
        width: positiveNumber(entry.width ?? entry.w, 3),
        height: positiveNumber(entry.height ?? entry.h, 3),
        floor: clampInteger(entry.floor ?? entry.level ?? entry.story, 0, 3, 0),
        type: normalizeRoomType(entry.type ?? entry.roomType, name),
      };
    })
    .filter((room): room is HomeConcept["floorPlan"]["rooms"][number] => room !== null)
    .slice(0, 30);
  const inferredFloorPlanWidth =
    normalizedRooms.length > 0
      ? Math.max(...normalizedRooms.map((room) => room.x + room.width))
      : 12;
  const inferredFloorPlanHeight =
    normalizedRooms.length > 0
      ? Math.max(...normalizedRooms.map((room) => room.y + room.height))
      : 9;
  const rawModel3D = asRecord(raw.model3D);
  const floorsFromRooms =
    normalizedRooms.length > 0
      ? Math.max(...normalizedRooms.map((room) => room.floor)) + 1
      : 1;
  const normalizedScore = {
    energyEfficiency: clampScore(rawScore.energyEfficiency),
    waterEfficiency: clampScore(rawScore.waterEfficiency),
    climateResilience: clampScore(rawScore.climateResilience),
    materialSustainability: clampScore(rawScore.materialSustainability),
    affordability: clampScore(rawScore.affordability),
    environmentalImpact: clampScore(rawScore.environmentalImpact)
  };
  const total = Math.round(
    (
      normalizedScore.energyEfficiency +
      normalizedScore.waterEfficiency +
      normalizedScore.climateResilience +
      normalizedScore.materialSustainability +
      normalizedScore.affordability +
      normalizedScore.environmentalImpact
    ) / 6
  );

  const visualPrompts =
    raw.visualPrompts && typeof raw.visualPrompts === "object"
      ? (raw.visualPrompts as Record<string, unknown>)
      : {};
  const rawSources = Array.isArray(raw.sources) ? raw.sources : [];

  const normalizedSources = rawSources
    .map((entry): SourceReference | null => {
      const sourceEntry =
        entry && typeof entry === "object"
          ? (entry as Record<string, unknown>)
          : {};
      const source =
        typeof sourceEntry.source === "string"
          ? sourceEntry.source
          : typeof sourceEntry.filename === "string"
            ? sourceEntry.filename
            : "";
      const filename =
        typeof sourceEntry.filename === "string"
          ? sourceEntry.filename
          : typeof sourceEntry.source === "string"
            ? sourceEntry.source
            : undefined;
      const page =
        typeof sourceEntry.page === "number" && Number.isInteger(sourceEntry.page)
          ? sourceEntry.page
          : undefined;
      const title =
        typeof sourceEntry.title === "string"
          ? sourceEntry.title
          : typeof sourceEntry.label === "string"
            ? sourceEntry.label
            : source
              ? `${source} guidance`
              : "";

      if (!title.trim() || !source.trim()) {
        return null;
      }

      return {
        title,
        source,
        filename,
        page,
      };
    })
    .filter((source): source is SourceReference => source !== null);

  const fallbackSources = guidanceSnippets
    .map((snippet) => ({
      title: snippet.title,
      source: snippet.source,
      filename: snippet.source,
    }))
    .filter(
      (source, index, sources) =>
        sources.findIndex(
          (candidate) =>
            candidate.title === source.title &&
            candidate.source === source.source &&
            candidate.filename === source.filename,
        ) === index,
    )
    .slice(0, 8);

  const normalized = {
    ...raw,
    conceptSummary:
      typeof raw.conceptSummary === "string"
        ? raw.conceptSummary
        : typeof raw.summary === "string"
          ? raw.summary
          : "",
    location:
      typeof raw.location === "string" && raw.location.trim()
        ? raw.location
        : input.location,
    climateType: normalizeClimateType(raw.climateType ?? raw.climateRegion, input.climateRegion),
    budgetLevel: normalizeBudgetLevel(raw.budgetLevel, input.budgetLevel),
    architecturalStyle:
      getString(raw.architecturalStyle) ||
      getString(input.styleAnalysis?.aesthetic) ||
      "Climate-responsive sustainable home",
    sustainabilityScore: {
      ...normalizedScore,
      total
    },
    floorPlan: {
      width: positiveNumber(rawFloorPlan.width ?? rawFloorPlan.w, inferredFloorPlanWidth),
      height: positiveNumber(rawFloorPlan.height ?? rawFloorPlan.h, inferredFloorPlanHeight),
      rooms: normalizedRooms,
    },
    upgrades: normalizeUpgrades(raw.upgrades ?? raw.recommendations, guidanceSnippets),
    materials: normalizeMaterials(raw.materials, rawModel3D, input),
    visualPrompts: {
      exteriorPrompt:
        typeof visualPrompts.exteriorPrompt === "string"
          ? visualPrompts.exteriorPrompt
          : "",
      interiorPrompt:
        typeof visualPrompts.interiorPrompt === "string"
          ? visualPrompts.interiorPrompt
          : ""
    },
    sources: normalizedSources.length ? normalizedSources.slice(0, 8) : fallbackSources,
    model3D: {
      ...rawModel3D,
      floors: clampInteger(rawModel3D.floors, 1, 4, floorsFromRooms),
      roofType: normalizeRoofType(rawModel3D.roofType),
      wallMaterial:
        getString(rawModel3D.wallMaterial) ||
        "Timber-framed wall assembly with climate-appropriate insulation",
      exteriorColor: getString(rawModel3D.exteriorColor) || "soft sage beige",
      windows: normalizeOpenings(rawModel3D.windows, 1.3),
      doors: normalizeOpenings(rawModel3D.doors, 2.2),
      sustainabilityFeatures: {
        solarPanels: normalizeBoolean(asRecord(rawModel3D.sustainabilityFeatures).solarPanels),
        greenRoof: normalizeBoolean(asRecord(rawModel3D.sustainabilityFeatures).greenRoof),
        rainwaterTank: normalizeBoolean(
          asRecord(rawModel3D.sustainabilityFeatures).rainwaterTank,
        ),
        trees: normalizeBoolean(asRecord(rawModel3D.sustainabilityFeatures).trees),
        permeableDriveway: normalizeBoolean(
          asRecord(rawModel3D.sustainabilityFeatures).permeableDriveway,
        ),
        crossVentilation: normalizeBoolean(
          asRecord(rawModel3D.sustainabilityFeatures).crossVentilation,
        )
      }
    }
  };

  if (!normalized.conceptSummary) {
    normalized.conceptSummary = buildFallbackSummary(
      input,
      normalized.architecturalStyle,
      normalized.model3D.floors,
    );
  }

  if (!normalized.visualPrompts.exteriorPrompt || !normalized.visualPrompts.interiorPrompt) {
    normalized.visualPrompts = buildFallbackVisualPrompts(
      input,
      normalized.architecturalStyle,
      normalized.model3D.wallMaterial,
      normalized.model3D.exteriorColor,
    );
  }

  return homeConceptSchema.parse(sanitizeHomeGeometry(normalized));
}

function buildMessages(input: GenerateHomeRequest, guidanceSnippets: GuidanceSnippet[]) {
  const systemPrompt = `
You are generating a compact sustainable home concept for EcoHome Studio.
Return JSON only. Do not include markdown, explanations, or code fences.
Never say that you cannot create 3D assets. Instead, describe a renderable structured concept.

Required top-level keys:
- conceptSummary
- location
- climateType
- budgetLevel
- architecturalStyle
- sustainabilityScore
- floorPlan
- model3D
- upgrades
- materials
- visualPrompts
- sources

Requirements:
- Keep conceptSummary compact and under 120 words.
- climateType must be exactly one of: hot-arid, temperate, cold, tropical, flood-prone.
- budgetLevel must be exactly one of: low, medium, premium.
- sustainabilityScore must include total, energyEfficiency, waterEfficiency, climateResilience, materialSustainability, affordability, environmentalImpact.
- floorPlan must include width, height, and rooms.
- Each room must include name, x, y, width, height, floor, type.
- room type must be exactly one of: social, private, service, work, circulation, outdoor.
- model3D must include floors, roofType, wallMaterial, exteriorColor, windows, doors, sustainabilityFeatures.
- roofType must be exactly one of: flat, gable, hip, shed, butterfly.
- windows and doors must be arrays of objects with wall, offset, width, height, floor.
- wall must be exactly one of: north, south, east, west.
- offset must be a decimal between 0 and 1, for example 0.25.
- Openings must fit fully on the named exterior wall and must not hang past wall edges.
- Doors must be on floor 0 only and should be ground-level exterior entries.
- Window and door dimensions must be realistic renderable meter values.
- Windows must be fully visible and must not be hidden behind wall surfaces, roof fascia, floor bands, doors, entry canopies, or other windows.
- Keep windows below the top of each floor with clear wall space above them.
- Do not place ground-floor windows so close to doors that their frames overlap.
- Room x/y/width/height values must stay fully inside floorPlan width and height.
- Use simple rectangular, house-like massing that can be rendered without floating pieces.
- sustainabilityFeatures must include booleans for solarPanels, greenRoof, rainwaterTank, trees, permeableDriveway, crossVentilation.
- upgrades must be an array of objects with title, category, impactLevel, explanation, estimatedBenefit.
- upgrade category must be exactly one of: Energy, Water, Materials, Resilience, Comfort.
- impactLevel must be exactly one of: Low, Medium, High.
- materials must be an array of objects with name, reason, sustainabilityBenefit.
- visualPrompts must include exteriorPrompt and interiorPrompt.
- sources must be an array of the grounding references you actually used.
- Each source should include title, source, and filename when available. Include page when available.
- Use realistic dimensions and simple geometry-friendly layouts.
`.trim();

  const groundingContext = guidanceSnippets.map((snippet, index) => ({
    id: index + 1,
    title: snippet.title,
    source: snippet.source,
    filename: snippet.source,
    content: snippet.content,
  }));

  const userPrompt = JSON.stringify(
    {
      input: {
        description: input.description,
        location: input.location,
        climateRegion: input.climateRegion,
        budgetLevel: input.budgetLevel,
        styleAnalysis: input.styleAnalysis ?? null,
        inspirationImages: input.inspirationImages
      },
      retrievedSustainabilityContext: groundingContext
    },
    null,
    2
  );

  return [
    {
      role: "system" as const,
      content: systemPrompt
    },
    {
      role: "user" as const,
      content: userPrompt
    }
  ];
}

export async function generateStructuredHomeConceptWithFeatherless({
  input,
  guidanceSnippets
}: {
  input: GenerateHomeRequest;
  guidanceSnippets: GuidanceSnippet[];
}): Promise<GeneratedHomeConceptPayload> {
  const { client, model } = getClient();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: {
      type: "json_object"
    },
    messages: buildMessages(input, guidanceSnippets)
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Featherless returned an empty response.");
  }

  const parsed = extractJsonObject(content);
  const normalized = normalizeHomeConceptCandidate(parsed, input, guidanceSnippets);

  return generatedHomeConceptSchema.parse({
    ...normalized,
    projectId: createProjectId(input.location),
    generatedAt: new Date().toISOString(),
    sourcePrompt: input.description,
    inspirationImages: input.inspirationImages,
    styleAnalysis: input.styleAnalysis,
    guidanceSnippets
  });
}
