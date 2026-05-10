import { budgetLabels, climateLabels } from "@/lib/domain/constants";
import type { GeneratedHomeConcept } from "@/lib/domain/types";
import { formatDate } from "@/lib/utils";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

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

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-[color:var(--muted)]">{label}</span>
        <span className="font-semibold text-[color:var(--foreground)]">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[rgba(31,107,82,0.08)]">
        <div
          className="h-2 rounded-full bg-[color:var(--accent)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ResultsView({ project }: { project: GeneratedHomeConcept }) {
  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden rounded-[2rem] p-8">
          <div className="flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
            <span className="rounded-full bg-[color:var(--accent-soft)] px-4 py-2">
              {climateLabels[project.climateRegion]}
            </span>
            <span className="rounded-full bg-[color:var(--surface-muted)] px-4 py-2">
              {budgetLabels[project.budgetLevel]}
            </span>
            <span className="rounded-full bg-[color:var(--surface-muted)] px-4 py-2">
              Generated {formatDate(project.generatedAt)}
            </span>
          </div>
          <div className="mt-8 space-y-5">
            <h1 className="font-tech max-w-3xl text-5xl leading-[1.04] tracking-[0.03em] text-[color:var(--foreground)]">
              {project.heroTitle}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-[color:var(--muted)]">
              {project.summary}
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] bg-[color:var(--surface-muted)] p-5">
              <p className="font-tech text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Climate response
              </p>
              <p className="mt-3 leading-7 text-[color:var(--foreground)]">
                {project.climateNarrative}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[color:var(--surface-muted)] p-5">
              <p className="font-tech text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Budget strategy
              </p>
              <p className="mt-3 leading-7 text-[color:var(--foreground)]">
                {project.budgetNarrative}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] p-8">
          <p className="font-tech text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Sustainability score
          </p>
          <div className="mt-4 flex items-end gap-4">
            <p className="text-6xl font-semibold text-[color:var(--foreground)]">
              {project.sustainabilityScore.total}
            </p>
            <p className="pb-2 text-sm text-[color:var(--muted)]">out of 100</p>
          </div>
          <div className="mt-8 space-y-4">
            {scoreFields.map((field) => (
              <ScoreBar
                key={field.key}
                label={field.label}
                value={project.sustainabilityScore[field.key]}
              />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-8">
          <SectionHeading
            kicker="Design direction"
            title="Architecture, interior, and floor plan ideas"
            description="These sections are intentionally structured for a hackathon demo: easy to read, easy to swap with provider output later."
          />
          <Card className="p-6">
            <CardTitle>Architectural style</CardTitle>
            <CardDescription>{project.architecturalStyle}</CardDescription>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[color:var(--muted)]">
                  Exterior concepts
                </p>
                <ul className="mt-3 space-y-2 leading-7 text-[color:var(--foreground)]">
                  {project.exteriorConcepts.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[color:var(--muted)]">
                  Interior concepts
                </p>
                <ul className="mt-3 space-y-2 leading-7 text-[color:var(--foreground)]">
                  {project.interiorConcepts.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <CardTitle>Floor plan ideas</CardTitle>
            <ul className="mt-4 space-y-3 leading-7 text-[color:var(--foreground)]">
              {project.floorPlanIdeas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-6">
            <CardTitle>Sustainability upgrades</CardTitle>
            <div className="mt-5 grid gap-4">
              {project.sustainabilityUpgrades.map((upgrade) => (
                <div
                  key={upgrade.title}
                  className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl text-[color:var(--foreground)]">
                      {upgrade.title}
                    </h3>
                    <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-dark)]">
                      {upgrade.category}
                    </span>
                    <span className="rounded-full bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      {upgrade.impact} impact
                    </span>
                  </div>
                  <p className="mt-3 leading-7 text-[color:var(--muted)]">
                    {upgrade.rationale}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[color:var(--foreground)]">
                    {upgrade.estimatedSavings}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <CardTitle>Environmental impact snapshot</CardTitle>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Energy reduction", project.environmentalImpact.energyReduction],
                ["Water reduction", project.environmentalImpact.waterReduction],
                [
                  "Embodied carbon",
                  project.environmentalImpact.embodiedCarbonReduction
                ],
                ["Resilience gain", project.environmentalImpact.resilienceGain]
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[1.5rem] bg-[color:var(--surface-muted)] p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    {label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="p-6">
            <CardTitle>Design principles</CardTitle>
            <ul className="mt-4 space-y-3 leading-7 text-[color:var(--foreground)]">
              {project.designPrinciples.map((principle) => (
                <li key={principle}>{principle}</li>
              ))}
            </ul>
            {project.styleAnalysis ? (
              <div className="mt-6 rounded-[1.5rem] bg-[color:var(--surface-muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Inspiration analysis
                </p>
                <p className="mt-3 leading-7 text-[color:var(--foreground)]">
                  {project.styleAnalysis.summary}
                </p>
              </div>
            ) : null}
            {project.floorPlan || project.model3D ? (
              <div className="mt-6 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  3D model inputs
                </p>
                <div className="mt-3 grid gap-3 text-sm leading-6 text-[color:var(--foreground)]">
                  {project.floorPlan ? (
                    <p>
                      Floor plan: {project.floorPlan.rooms.length} rooms across{" "}
                      {project.floorPlan.width} x {project.floorPlan.height}
                    </p>
                  ) : null}
                  {project.model3D ? (
                    <>
                      <p>Floors: {project.model3D.floors}</p>
                      <p>Roof type: {project.model3D.roofType}</p>
                      <p>Wall material: {project.model3D.wallMaterial}</p>
                      <p>Exterior color: {project.model3D.exteriorColor}</p>
                      <p>
                        Openings: {project.model3D.windows.length} windows,{" "}
                        {project.model3D.doors.length} doors
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Card>

        <Card className="p-6">
          <CardTitle>Visual prompt starters</CardTitle>
          <div className="mt-5 grid gap-4">
            {project.visualPrompts.map((prompt) => (
              <div
                key={prompt.label}
                className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {prompt.label}
                </p>
                <p className="mt-3 leading-7 text-[color:var(--foreground)]">
                  {prompt.prompt}
                </p>
                <p className="mt-3 text-sm text-[color:var(--muted)]">{prompt.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
