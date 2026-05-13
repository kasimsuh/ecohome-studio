import { ResultsClient } from "@/components/results/results-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GeneratedHomeConcept } from "@/lib/domain/types";

export default async function ResultsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  let initialProject: GeneratedHomeConcept | null = null;

  if (projectId !== "demo") {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("projects")
          .select("data")
          .eq("project_id", projectId)
          .eq("user_id", user.id)
          .single();

        if (data?.data) {
          initialProject = data.data as GeneratedHomeConcept;
        }
      }
    } catch {
      // Non-fatal — guests and DB errors fall through to sessionStorage
    }
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden">
      <ResultsClient projectId={projectId} initialProject={initialProject} />
    </div>
  );
}
