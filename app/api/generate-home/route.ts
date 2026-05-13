import { NextResponse } from "next/server";

import { buildGenerateHomeResponseHeaders } from "@/lib/api/generate-home-response";
import { generateStructuredHomeConceptWithFeatherless } from "@/lib/ai/featherless";
import { generateHomeRequestSchema } from "@/lib/domain/home-concept-schema";
import { createFallbackStructuredHomeConcept } from "@/lib/domain/structured-home-fallback";
import { retrieveSustainabilityContext } from "@/lib/rag/retriever";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GeneratedHomeConcept } from "@/lib/domain/types";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function trySaveProject(concept: GeneratedHomeConcept) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("projects").upsert(
      {
        user_id: user.id,
        name: concept.heroTitle,
        project_id: concept.projectId,
        data: concept,
      },
      { onConflict: "project_id" },
    );
  } catch {
    // Non-fatal — guest users and DB errors should not block the response
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = generateHomeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid home generation request.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const guidance = await retrieveSustainabilityContext(input);

  try {
    const concept = await generateStructuredHomeConceptWithFeatherless({
      input,
      guidanceSnippets: guidance.snippets,
    });

    await trySaveProject(concept);

    return NextResponse.json(concept, {
      headers: buildGenerateHomeResponseHeaders({
        provider: "featherless",
        guidanceSource: guidance.source,
        diagnostics: guidance.diagnostics,
      }),
    });
  } catch (error) {
    const fallback = createFallbackStructuredHomeConcept({
      input,
      guidanceSnippets: guidance.snippets,
    });

    await trySaveProject(fallback);

    return NextResponse.json(fallback, {
      headers: buildGenerateHomeResponseHeaders({
        provider: "fallback",
        guidanceSource: guidance.source,
        diagnostics: guidance.diagnostics,
        providerError: getErrorMessage(error),
      }),
    });
  }
}
