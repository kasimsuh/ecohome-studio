import { NextResponse } from "next/server";

import { generateStructuredHomeConceptWithFeatherless } from "@/lib/ai/featherless";
import { generateHomeRequestSchema } from "@/lib/domain/home-concept-schema";
import { createFallbackStructuredHomeConcept } from "@/lib/domain/structured-home-fallback";
import { retrieveSustainabilityContext } from "@/lib/rag/retriever";

function compactHeaderValue(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = generateHomeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid home generation request.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const guidance = await retrieveSustainabilityContext(input);

  try {
    const concept = await generateStructuredHomeConceptWithFeatherless({
      input,
      guidanceSnippets: guidance.snippets
    });

    return NextResponse.json(concept, {
      headers: {
        "x-ecohome-provider": "featherless",
        "x-ecohome-guidance": guidance.source,
        "x-ecohome-rag-query-limit": String(guidance.diagnostics.requestedLimit),
        "x-ecohome-rag-supabase-attempted": String(
          guidance.diagnostics.supabaseAttempted,
        ),
        "x-ecohome-rag-supabase-match-count": String(
          guidance.diagnostics.supabaseMatchCount,
        ),
        "x-ecohome-rag-local-fallback-used": String(
          guidance.diagnostics.localFallbackUsed,
        ),
        ...(guidance.diagnostics.localFallbackReason
          ? {
              "x-ecohome-rag-fallback-reason": compactHeaderValue(
                guidance.diagnostics.localFallbackReason,
              ),
            }
          : {}),
        ...(guidance.diagnostics.supabaseError
          ? {
              "x-ecohome-rag-supabase-error": compactHeaderValue(
                guidance.diagnostics.supabaseError,
              ),
            }
          : {}),
        ...(guidance.diagnostics.localFallbackError
          ? {
              "x-ecohome-rag-local-error": compactHeaderValue(
                guidance.diagnostics.localFallbackError,
              ),
            }
          : {}),
      }
    });
  } catch (error) {
    const fallback = createFallbackStructuredHomeConcept({
      input,
      guidanceSnippets: guidance.snippets
    });

    return NextResponse.json(fallback, {
      headers: {
        "x-ecohome-provider": "fallback",
        "x-ecohome-guidance": guidance.source,
        "x-ecohome-provider-error": compactHeaderValue(getErrorMessage(error)),
        "x-ecohome-rag-query-limit": String(guidance.diagnostics.requestedLimit),
        "x-ecohome-rag-supabase-attempted": String(
          guidance.diagnostics.supabaseAttempted,
        ),
        "x-ecohome-rag-supabase-match-count": String(
          guidance.diagnostics.supabaseMatchCount,
        ),
        "x-ecohome-rag-local-fallback-used": String(
          guidance.diagnostics.localFallbackUsed,
        ),
        ...(guidance.diagnostics.localFallbackReason
          ? {
              "x-ecohome-rag-fallback-reason": compactHeaderValue(
                guidance.diagnostics.localFallbackReason,
              ),
            }
          : {}),
        ...(guidance.diagnostics.supabaseError
          ? {
              "x-ecohome-rag-supabase-error": compactHeaderValue(
                guidance.diagnostics.supabaseError,
              ),
            }
          : {}),
        ...(guidance.diagnostics.localFallbackError
          ? {
              "x-ecohome-rag-local-error": compactHeaderValue(
                guidance.diagnostics.localFallbackError,
              ),
            }
          : {}),
      }
    });
  }
}
