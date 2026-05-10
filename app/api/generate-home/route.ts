import { NextResponse } from "next/server";

import { generateStructuredHomeConceptWithFeatherless } from "@/lib/ai/featherless";
import { buildGenerateHomeResponseHeaders } from "@/lib/api/generate-home-response";
import { generateHomeRequestSchema } from "@/lib/domain/home-concept-schema";
import { createFallbackStructuredHomeConcept } from "@/lib/domain/structured-home-fallback";
import { retrieveSustainabilityContext } from "@/lib/rag/retriever";

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
        "x-ecohome-rag-watsonx-attempted": String(
          guidance.diagnostics.watsonxAttempted,
        ),
        "x-ecohome-rag-watsonx-match-count": String(
          guidance.diagnostics.watsonxMatchCount,
        ),
        "x-ecohome-rag-watsonx-used": String(
          guidance.diagnostics.watsonxUsed,
        ),
        "x-ecohome-rag-local-fallback-used": String(
          guidance.diagnostics.localFallbackUsed,
        ),
        ...(guidance.diagnostics.fallbackReason
          ? {
              "x-ecohome-rag-fallback-reason": compactHeaderValue(
                guidance.diagnostics.fallbackReason,
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
        ...(guidance.diagnostics.watsonxError
          ? {
              "x-ecohome-rag-watsonx-error": compactHeaderValue(
                guidance.diagnostics.watsonxError,
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
      headers: buildGenerateHomeResponseHeaders({
        provider: "featherless",
        guidanceSource: guidance.source,
        diagnostics: guidance.diagnostics
      })
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
        "x-ecohome-rag-watsonx-attempted": String(
          guidance.diagnostics.watsonxAttempted,
        ),
        "x-ecohome-rag-watsonx-match-count": String(
          guidance.diagnostics.watsonxMatchCount,
        ),
        "x-ecohome-rag-watsonx-used": String(
          guidance.diagnostics.watsonxUsed,
        ),
        "x-ecohome-rag-local-fallback-used": String(
          guidance.diagnostics.localFallbackUsed,
        ),
        ...(guidance.diagnostics.fallbackReason
          ? {
              "x-ecohome-rag-fallback-reason": compactHeaderValue(
                guidance.diagnostics.fallbackReason,
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
        ...(guidance.diagnostics.watsonxError
          ? {
              "x-ecohome-rag-watsonx-error": compactHeaderValue(
                guidance.diagnostics.watsonxError,
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
      headers: buildGenerateHomeResponseHeaders({
        provider: "fallback",
        guidanceSource: guidance.source,
        diagnostics: guidance.diagnostics,
        providerError: getErrorMessage(error)
      })
    });
  }
}
