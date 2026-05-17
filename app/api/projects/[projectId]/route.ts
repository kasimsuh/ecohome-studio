import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const patchSchema = z
  .object({
    thumbnail: z.string().min(1).optional(),
    data: z.record(z.unknown()).optional(),
  })
  .refine((v) => v.thumbnail !== undefined || v.data !== undefined, {
    message: "Nothing to update",
  });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.thumbnail) update.thumbnail = parsed.data.thumbnail;
  if (parsed.data.data) update.data = parsed.data.data;

  const { error } = await supabase
    .from("projects")
    .update(update)
    .eq("project_id", projectId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
