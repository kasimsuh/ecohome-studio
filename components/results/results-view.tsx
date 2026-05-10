import { budgetLabels, climateLabels } from "@/lib/domain/constants";
import type { GeneratedHomeConcept } from "@/lib/domain/types";
import { formatDate } from "@/lib/utils";
import { Home3DPreview } from "@/components/results/home-3d-preview";

const scoreFields: Array<{
  key: keyof GeneratedHomeConcept["sustainabilityScore"];
  label: string;
}> = [
  { key: "energyEfficiency", label: "Energy efficiency" },
  { key: "waterEfficiency", label: "Water efficiency" },
  { key: "climateResilience", label: "Climate resilience" },
  { key: "materialSustainability", label: "Material sustainability" },
  { key: "affordability", label: "Affordability" },
  { key: "environmentalImpact", label: "Environmental impact" }
];

function ReportSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[rgba(61,93,72,0.16)] py-6 first:border-t-0 first:pt-0">
      <h2 className="font-tech text-lg tracking-[0.03em] text-[color:var(--foreground)]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[0.95rem] leading-7 text-[color:var(--muted)]">
        {children}
      </div>
    </section>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="text-[color:var(--muted)]">{label}</span>
        <span className="font-semibold text-[color:var(--foreground)]">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[rgba(31,107,82,0.09)]">
        <div
          className="h-2 rounded-full bg-[color:var(--accent)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ReportRail({ project }: { project: GeneratedHomeConcept }) {
  return (
    <aside className="bg-[linear-gradient(180deg,rgba(255,250,242,0.78),rgba(232,221,202,0.66))] backdrop-blur-2xl lg:h-screen lg:overflow-y-auto lg:border-r lg:border-[rgba(61,93,72,0.16)]">
      <div className="mx-auto w-full max-w-[46rem] px-5 py-6 lg:max-w-none lg:px-6 lg:py-7">
        <div className="mb-6 flex flex-wrap gap-2 text-xs font-semibold text-[color:var(--muted)]">
          <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1.5">
            {climateLabels[project.climateRegion]}
          </span>
          <span className="rounded-full bg-[rgba(255,248,239,0.8)] px-3 py-1.5">
            {budgetLabels[project.budgetLevel]}
          </span>
          <span className="rounded-full bg-[rgba(255,248,239,0.8)] px-3 py-1.5">
            {formatDate(project.generatedAt)}
          </span>
        </div>

        <section className="pb-7">
          <p className="font-tech text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
            EcoHome report
          </p>
          <h1 className="font-tech mt-3 text-3xl leading-[1.05] tracking-[0.03em] text-[color:var(--foreground)]">
            {project.heroTitle}
          </h1>
          <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">
            {project.summary}
          </p>
        </section>

        <ReportSection title="Sustainability Score">
          <div className="flex items-end gap-3">
            <p className="text-5xl font-semibold text-[color:var(--foreground)]">
              {project.sustainabilityScore.total}
            </p>
            <p className="pb-2 text-sm text-[color:var(--muted)]">out of 100</p>
          </div>
          <div className="space-y-4">
            {scoreFields.map((field) => (
              <ScoreBar
                key={field.key}
                label={field.label}
                value={project.sustainabilityScore[field.key]}
              />
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Climate And Budget">
          <div>
            <p className="font-tech text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Climate response
            </p>
            <p className="mt-2 text-[color:var(--foreground)]">
              {project.climateNarrative}
            </p>
          </div>
          <div>
            <p className="font-tech text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Budget strategy
            </p>
            <p className="mt-2 text-[color:var(--foreground)]">
              {project.budgetNarrative}
            </p>
          </div>
        </ReportSection>

        <ReportSection title="Design Direction">
          <div>
            <p className="font-semibold text-[color:var(--foreground)]">
              {project.architecturalStyle}
            </p>
          </div>
          <div>
            <p className="font-tech text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Exterior
            </p>
            <ul className="mt-2 space-y-2">
              {project.exteriorConcepts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-tech text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Interior
            </p>
            <ul className="mt-2 space-y-2">
              {project.interiorConcepts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </ReportSection>

        <ReportSection title="Floor Plan Ideas">
          <ul className="space-y-2">
            {project.floorPlanIdeas.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ReportSection>

        <ReportSection title="Sustainability Upgrades">
          <div className="space-y-4">
            {project.sustainabilityUpgrades.map((upgrade) => (
              <article key={upgrade.title}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-[color:var(--foreground)]">
                    {upgrade.title}
                  </h3>
                  <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-dark)]">
                    {upgrade.category}
                  </span>
                  <span className="rounded-full bg-[rgba(255,248,239,0.8)] px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    {upgrade.impact} impact
                  </span>
                </div>
                <p className="mt-2">{upgrade.rationale}</p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
                  {upgrade.estimatedSavings}
                </p>
              </article>
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Environmental Impact">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {[
              ["Energy reduction", project.environmentalImpact.energyReduction],
              ["Water reduction", project.environmentalImpact.waterReduction],
              ["Embodied carbon", project.environmentalImpact.embodiedCarbonReduction],
              ["Resilience gain", project.environmentalImpact.resilienceGain]
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1rem] bg-[rgba(255,248,239,0.72)] p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {label}
                </p>
                <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Design Principles">
          <ul className="space-y-2">
            {project.designPrinciples.map((principle) => (
              <li key={principle}>{principle}</li>
            ))}
          </ul>
          {project.styleAnalysis ? (
            <p className="rounded-[1rem] bg-[rgba(255,248,239,0.72)] p-3 text-[color:var(--foreground)]">
              {project.styleAnalysis.summary}
            </p>
          ) : null}
        </ReportSection>

        <ReportSection title="Visual Prompt Starters">
          <div className="space-y-4">
            {project.visualPrompts.map((prompt) => (
              <article key={prompt.label}>
                <p className="font-tech text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {prompt.label}
                </p>
                <p className="mt-2 text-[color:var(--foreground)]">{prompt.prompt}</p>
                <p className="mt-1 text-sm">{prompt.note}</p>
              </article>
            ))}
          </div>
        </ReportSection>
      </div>
    </aside>
  );
}

export function ResultsView({ project }: { project: GeneratedHomeConcept }) {
  const hasInteractiveModel = Boolean(project.floorPlan && project.model3D);

  if (!hasInteractiveModel || !project.floorPlan || !project.model3D) {
    return <ReportRail project={project} />;
  }

  return (
    <div className="min-h-screen lg:grid lg:h-screen lg:grid-cols-[420px_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[460px_minmax(0,1fr)]">
      <ReportRail project={project} />
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
