import { Home3DPreview } from "@/components/results/home-3d-preview";
import { ResultsRail } from "@/components/results/results-rail";
import type { GeneratedHomeConcept } from "@/lib/domain/types";

export function ResultsView({ project }: { project: GeneratedHomeConcept }) {
  const hasInteractiveModel = Boolean(project.floorPlan && project.model3D);

  if (!hasInteractiveModel || !project.floorPlan || !project.model3D) {
    return <ResultsRail project={project} />;
  }

  return (
    <div className="min-h-screen lg:grid lg:h-screen lg:grid-cols-[420px_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[460px_minmax(0,1fr)]">
      <ResultsRail project={project} />
      <main className="min-h-[72vh] lg:h-screen lg:min-h-0">
        <Home3DPreview
          floorPlan={project.floorPlan}
          model3D={project.model3D}
          upgrades={project.upgrades}
          materials={project.materials}
          variant="workspace"
        />
      </main>
    </div>
  );
}
