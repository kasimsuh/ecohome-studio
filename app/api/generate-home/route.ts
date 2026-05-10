import { NextResponse } from "next/server";

import { generateStructuredHomeConceptWithFeatherless } from "@/lib/ai/featherless";
import { generateHomeRequestSchema } from "@/lib/domain/home-concept-schema";
import { createFallbackStructuredHomeConcept } from "@/lib/domain/structured-home-fallback";
import { retrieveSustainabilityContext } from "@/lib/rag/retriever";

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
        "x-ecohome-guidance": guidance.source
      }
    });
  } catch {
    const fallback = createFallbackStructuredHomeConcept({
      input,
      guidanceSnippets: guidance.snippets
    });

    return NextResponse.json(fallback, {
      headers: {
        "x-ecohome-provider": "fallback",
        "x-ecohome-guidance": guidance.source
      }
    });
  }
}
