import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GeneratedHomeConcept } from "@/lib/domain/types";

const saveProjectSchema = z.object({
  name: z.string().min(1).max(120),
  project_id: z.string().min(1),
  data: z.record(z.unknown()),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, project_id, created_at, updated_at, data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = saveProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, project_id, data } = parsed.data;
  const concept = data as GeneratedHomeConcept;

  const { data: row, error } = await supabase
    .from("projects")
    .upsert(
      { user_id: user.id, name, project_id, data: concept },
      { onConflict: "project_id" },
    )
    .select("id, name, project_id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(row, { status: 201 });
}
