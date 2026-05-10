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
      headers: buildGenerateHomeResponseHeaders({
        provider: "fallback",
        guidanceSource: guidance.source,
        diagnostics: guidance.diagnostics,
        providerError: getErrorMessage(error)
      })
    });
  }
}
