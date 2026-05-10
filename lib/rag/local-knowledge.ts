import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  GenerateHomeRequest,
  GuidanceSnippet
} from "@/lib/domain/home-concept-schema";

const knowledgeFiles = [
  "passive-cooling.md",
  "water-efficiency.md",
  "sustainable-materials.md",
  "climate-resilience.md",
  "budget-tradeoffs.md"
] as const;

interface KnowledgeEntry {
  title: string;
  source: string;
  content: string;
}

let cachedEntries: KnowledgeEntry[] | null = null;

function scoreEntry(entry: KnowledgeEntry, input: GenerateHomeRequest) {
  const source = `${entry.title} ${entry.content}`.toLowerCase();
  const query = `${input.description} ${input.location} ${input.climateRegion} ${input.budgetLevel}`.toLowerCase();

  let score = 0;

  for (const term of query.split(/[^a-z0-9-]+/).filter(Boolean)) {
    if (term.length > 3 && source.includes(term)) {
      score += 2;
    }
  }

  if (input.climateRegion === "cold" && /cold|airtight|insulation|heat/.test(source)) {
    score += 5;
  }
  if (
    input.climateRegion === "hot-arid" &&
    /shade|cooling|ventilation|thermal/.test(source)
  ) {
    score += 5;
  }
  if (
    input.climateRegion === "tropical" &&
    /humid|moisture|ventilation|shaded/.test(source)
  ) {
    score += 5;
  }
  if (
    input.climateRegion === "flood-prone" &&
    /flood|drainage|elevate|recovery/.test(source)
  ) {
    score += 6;
  }
  if (input.budgetLevel === "low" && /budget|compact|phased|efficient/.test(source)) {
    score += 4;
  }
  if (/water/.test(input.description.toLowerCase()) && /water|rain|plumbing/.test(source)) {
    score += 4;
  }
  if (
    /material|timber|wood|finish|stone/.test(input.description.toLowerCase()) &&
    /material|embodied|reclaimed|recycled/.test(source)
  ) {
    score += 4;
  }

  return score;
}

function parseMarkdownFile(filename: string, content: string) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const heading = lines.find((line) => line.startsWith("# ")) ?? "# Guidance";
  const title = heading.replace(/^# /, "");
  const source = filename;

  const bulletEntries = lines
    .filter((line) => line.startsWith("- "))
    .map((line) => ({
      title,
      source,
      content: line.replace(/^- /, "").trim()
    }));

  return bulletEntries.length
    ? bulletEntries
    : [
        {
          title,
          source,
          content: lines.filter((line) => !line.startsWith("# ")).join(" ")
        }
      ];
}

async function loadKnowledgeEntries() {
  if (cachedEntries) {
    return cachedEntries;
  }

  const directory = path.join(process.cwd(), "lib", "rag", "knowledge");
  const fileContents = await Promise.all(
    knowledgeFiles.map(async (filename) => {
      const fullPath = path.join(directory, filename);
      const markdown = await fs.readFile(fullPath, "utf8");
      return parseMarkdownFile(filename, markdown);
    })
  );

  cachedEntries = fileContents.flat();
  return cachedEntries;
}

export async function retrieveLocalGuidance(
  input: GenerateHomeRequest,
  limit = 4
): Promise<GuidanceSnippet[]> {
  const entries = await loadKnowledgeEntries();

  return entries
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, input)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(3, Math.min(limit, 6)))
    .map(({ entry }) => ({
      title: entry.title,
      source: entry.source,
      content: entry.content
    }));
}
