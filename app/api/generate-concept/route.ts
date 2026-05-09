import { NextResponse } from "next/server";

import { ecoHomeAi } from "@/lib/ai";
import { generateConceptSchema } from "@/lib/domain/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = generateConceptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid concept request.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const concept = await ecoHomeAi.generateHomeConcept(parsed.data);

  return NextResponse.json(concept);
}
