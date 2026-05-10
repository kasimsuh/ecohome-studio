import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

import type {
  GenerateHomeRequest,
  GuidanceSnippet,
} from "@/lib/domain/home-concept-schema";
import { createEmbeddingModel } from "@/lib/rag/embeddings";
import { retrieveLocalGuidance } from "@/lib/rag/local-knowledge";
import { getSupabaseVectorStoreConfig } from "@/lib/rag/supabase";

export interface RetrievedSustainabilityContext {
  snippets: GuidanceSnippet[];
  contextText: string;
  source: "supabase-pgvector" | "local-seed-docs" | "none";
  diagnostics: {
    query: string;
    requestedLimit: number;
    supabaseAttempted: boolean;
    supabaseMatchCount: number;
    localFallbackUsed: boolean;
    localFallbackReason?: string;
    supabaseError?: string;
    localFallbackError?: string;
  };
}

interface RetrievedDocumentLike {
  pageContent: string;
  metadata?: {
    source?: unknown;
    filename?: unknown;
    category?: unknown;
    page?: unknown;
  };
}

const minimumRetrievedSnippetCount = 3;
const maximumRetrievedSnippetCount = 6;
const defaultRetrievedSnippetCount = 4;
const maxSnippetTitleLength = 120;
const maxSnippetSourceLength = 120;
const maxSnippetContentLength = 320;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.replace(/\s+/g, " ").trim();
  }

  return String(error).replace(/\s+/g, " ").trim();
}

function normalizeRetrievedSnippetLimit(limit = defaultRetrievedSnippetCount) {
  if (!Number.isFinite(limit)) {
    return defaultRetrievedSnippetCount;
  }

  return Math.max(
    minimumRetrievedSnippetCount,
    Math.min(Math.round(limit), maximumRetrievedSnippetCount),
  );
}

function compactText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function humanizeIdentifier(value: string) {
  const withoutExtension = value.replace(/\.[a-z0-9]+$/i, "");

  return withoutExtension
    .split(/[\\/_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function dedupeSnippets(snippets: GuidanceSnippet[], limit: number) {
  const seen = new Set<string>();

  return snippets.filter((snippet) => {
    const key = `${snippet.title}::${snippet.source}::${snippet.content}`;

    if (seen.has(key) || seen.size >= limit) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function buildSustainabilityRetrievalQuery(input: GenerateHomeRequest) {
  const styleDescriptor = input.styleAnalysis?.aesthetic?.trim();
  const styleSummary = input.styleAnalysis?.summary?.trim();
  const inspirationSummary = styleDescriptor
    ? ` Architectural direction: ${styleDescriptor}.`
    : "";
  const styleContext = styleSummary ? ` Style cues: ${styleSummary}.` : "";

  return [
    "Sustainable residential design recommendations for a home concept.",
    `Location: ${input.location}.`,
    `Climate: ${input.climateRegion}.`,
    `Budget: ${input.budgetLevel}.`,
    `User brief: ${input.description}.`,
    inspirationSummary,
    styleContext,
    "Focus on passive design, water efficiency, climate resilience, durable low-impact materials, and practical home-planning recommendations that can inform room layout, sustainability features, and compact upgrade advice.",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatRetrievedContext(snippets: GuidanceSnippet[]) {
  return snippets
    .map(
      (snippet, index) =>
        `[${index + 1}] ${snippet.title} (${snippet.source})\n${snippet.content}`,
    )
    .join("\n\n");
}

function createSnippetTitle(document: RetrievedDocumentLike) {
  const category =
    typeof document.metadata?.category === "string"
      ? document.metadata.category
      : undefined;
  const filename =
    typeof document.metadata?.filename === "string"
      ? document.metadata.filename
      : undefined;

  if (category) {
    return compactText(
      `${humanizeIdentifier(category)} guidance`,
      maxSnippetTitleLength,
    );
  }

  if (filename) {
    return compactText(
      `${humanizeIdentifier(filename)} guidance`,
      maxSnippetTitleLength,
    );
  }

  return "Retrieved sustainability guidance";
}

function createSnippetSource(document: RetrievedDocumentLike) {
  const source =
    typeof document.metadata?.source === "string"
      ? document.metadata.source
      : typeof document.metadata?.filename === "string"
        ? document.metadata.filename
        : "Supabase document";
  const page =
    typeof document.metadata?.page === "number" &&
    Number.isFinite(document.metadata.page)
      ? document.metadata.page
      : undefined;
  const label = page ? `${source} (p. ${page})` : source;

  return compactText(label, maxSnippetSourceLength);
}

function createSnippetContent(document: RetrievedDocumentLike) {
  return compactText(document.pageContent, maxSnippetContentLength);
}

function mapRetrievedDocumentsToSnippets(
  matches: Array<[RetrievedDocumentLike, number]>,
) {
  return matches
    .map(([document]) => ({
      title: createSnippetTitle(document),
      source: createSnippetSource(document),
      content: createSnippetContent(document),
    }))
    .filter((snippet) => snippet.content.length > 0);
}

async function retrieveSupabaseGuidance(
  input: GenerateHomeRequest,
  limit: number,
) {
  const query = buildSustainabilityRetrievalQuery(input);
  const vectorStore = await SupabaseVectorStore.fromExistingIndex(
    createEmbeddingModel(),
    getSupabaseVectorStoreConfig(),
  );
  const matches = await vectorStore.similaritySearchWithScore(
    query,
    limit,
  );

  const snippets = mapRetrievedDocumentsToSnippets(
    matches as Array<[RetrievedDocumentLike, number]>,
  );

  return {
    query,
    snippets,
    matchCount: matches.length,
  };
}

async function retrieveLocalFallback(
  input: GenerateHomeRequest,
  limit: number,
  diagnostics: RetrievedSustainabilityContext["diagnostics"],
): Promise<RetrievedSustainabilityContext> {
  try {
    const snippets = await retrieveLocalGuidance(input, limit);

    return {
      snippets,
      contextText: formatRetrievedContext(snippets),
      source: snippets.length ? "local-seed-docs" : "none",
      diagnostics: {
        ...diagnostics,
        localFallbackUsed: true,
      },
    };
  } catch (error) {
    return {
      snippets: [],
      contextText: "",
      source: "none",
      diagnostics: {
        ...diagnostics,
        localFallbackUsed: true,
        localFallbackError: getErrorMessage(error),
      },
    };
  }
}

export async function retrieveSustainabilityContext(
  input: GenerateHomeRequest,
  limit = 4,
): Promise<RetrievedSustainabilityContext> {
  const normalizedLimit = normalizeRetrievedSnippetLimit(limit);
  const query = buildSustainabilityRetrievalQuery(input);
  const baseDiagnostics: RetrievedSustainabilityContext["diagnostics"] = {
    query,
    requestedLimit: normalizedLimit,
    supabaseAttempted: false,
    supabaseMatchCount: 0,
    localFallbackUsed: false,
  };

  try {
    const supabaseResult = await retrieveSupabaseGuidance(
      input,
      normalizedLimit,
    );
    const supabaseSnippets = supabaseResult.snippets;
    const supabaseDiagnostics = {
      ...baseDiagnostics,
      supabaseAttempted: true,
      supabaseMatchCount: supabaseResult.matchCount,
    };

    if (!supabaseSnippets.length) {
      return retrieveLocalFallback(input, normalizedLimit, {
        ...supabaseDiagnostics,
        localFallbackReason: "supabase-returned-no-matches",
      });
    }

    const localSnippets =
      supabaseSnippets.length < minimumRetrievedSnippetCount
        ? await retrieveLocalGuidance(input, normalizedLimit)
        : [];
    const snippets = dedupeSnippets(
      [...supabaseSnippets, ...localSnippets],
      normalizedLimit,
    );

    return {
      snippets,
      contextText: formatRetrievedContext(snippets),
      source: snippets.length ? "supabase-pgvector" : "none",
      diagnostics: {
        ...supabaseDiagnostics,
        localFallbackUsed: localSnippets.length > 0,
        ...(localSnippets.length > 0
          ? { localFallbackReason: "supabase-results-padded-with-local-seed-docs" }
          : {}),
      },
    };
  } catch (error) {
    return retrieveLocalFallback(input, normalizedLimit, {
      ...baseDiagnostics,
      supabaseAttempted: true,
      supabaseError: getErrorMessage(error),
      localFallbackReason: "supabase-query-failed",
    });
  }
}
