import Link from "next/link";

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
  { key: "environmentalImpact", label: "Environmental impact" },
];

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function IconChart() {
  return (
    <Svg>
      <path d="M4 20h16M4 14h4v6H4zM10 9h4v11h-4zM16 4h4v16h-4z" />
    </Svg>
  );
}

function IconSun() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Svg>
  );
}

function IconPencil() {
  return (
    <Svg>
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </Svg>
  );
}

function IconGrid() {
  return (
    <Svg>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Svg>
  );
}

function IconZap() {
  return (
    <Svg>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  );
}

function IconLeaf() {
  return (
    <Svg>
      <path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 0 0 4.64 21c7.12-.8 12.42-5.49 13.13-12.44A1 1 0 0 0 17 8z" />
      <path d="M3 21l5-5" />
    </Svg>
  );
}

function IconStar() {
  return (
    <Svg>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function IconSparkles() {
  return (
    <Svg>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
    </Svg>
  );
}

function ReportSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[rgba(61,93,72,0.16)] py-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="text-[color:var(--accent)]">{icon}</span>
        <h2 className="font-tech text-lg tracking-[0.03em] text-[color:var(--foreground)]">
          {title}
        </h2>
      </div>
      <div className="space-y-4 text-[0.95rem] leading-7 text-[color:var(--muted)]">
        {children}
      </div>
    </section>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
        <span className="text-[color:var(--muted)]">{label}</span>
        <span className="font-semibold tabular-nums text-[color:var(--foreground)]">
          {value}
          <span className="ml-0.5 text-xs font-normal text-[color:var(--muted)]">
            /100
          </span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(31,107,82,0.09)]">
        <div
          className="h-1.5 rounded-full bg-[color:var(--accent)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function AccentList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span
            className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ReportRail({ project }: { project: GeneratedHomeConcept }) {
  return (
    <aside className="bg-[linear-gradient(180deg,rgba(255,250,242,0.78),rgba(232,221,202,0.66))] backdrop-blur-2xl lg:h-screen lg:overflow-y-auto lg:border-r lg:border-[rgba(61,93,72,0.16)]">
      <div className="mx-auto w-full max-w-[46rem] px-5 py-6 lg:max-w-none lg:px-6 lg:py-7">
        <div className="mb-7">
          <Link href="/" className="block">
            <p className="font-tech text-lg font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              EcoHome Studio
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Sustainable home concept lab
            </p>
          </Link>
        </div>

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

        <ReportSection title="Sustainability Score" icon={<IconChart />}>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-semibold tabular-nums text-[color:var(--foreground)]">
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

        <ReportSection title="Climate And Budget" icon={<IconSun />}>
          <div className="rounded-xl bg-[rgba(255,248,239,0.6)] p-4">
            <p className="font-tech text-xs uppercase tracking-[0.16em] text-[color:var(--accent-dark)]">
              Climate response
            </p>
            <p className="mt-2 text-[color:var(--foreground)]">
              {project.climateNarrative}
            </p>
          </div>
          <div className="rounded-xl bg-[rgba(255,248,239,0.6)] p-4">
            <p className="font-tech text-xs uppercase tracking-[0.16em] text-[color:var(--accent-dark)]">
              Budget strategy
            </p>
            <p className="mt-2 text-[color:var(--foreground)]">
              {project.budgetNarrative}
            </p>
          </div>
        </ReportSection>

        <ReportSection title="Design Direction" icon={<IconPencil />}>
          <p className="font-semibold text-[color:var(--foreground)]">
            {project.architecturalStyle}
          </p>
          <div>
            <p className="font-tech text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Exterior
            </p>
            <div className="mt-2">
              <AccentList items={project.exteriorConcepts} />
            </div>
          </div>
          <div>
            <p className="font-tech text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Interior
            </p>
            <div className="mt-2">
              <AccentList items={project.interiorConcepts} />
            </div>
          </div>
        </ReportSection>

        <ReportSection title="Floor Plan Ideas" icon={<IconGrid />}>
          <AccentList items={project.floorPlanIdeas} />
        </ReportSection>

        <ReportSection title="Sustainability Upgrades" icon={<IconZap />}>
          <div className="space-y-3">
            {project.sustainabilityUpgrades.map((upgrade) => (
              <article
                key={upgrade.title}
                className="rounded-xl border border-[rgba(61,93,72,0.14)] bg-[rgba(255,248,239,0.55)] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-[color:var(--foreground)]">
                    {upgrade.title}
                  </h3>
                  <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-dark)]">
                    {upgrade.category}
                  </span>
                  <span className="rounded-full bg-[rgba(255,248,239,0.8)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    {upgrade.impact} impact
                  </span>
                </div>
                <p className="mt-2 text-sm">{upgrade.rationale}</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                  {upgrade.estimatedSavings}
                </p>
              </article>
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Environmental Impact" icon={<IconLeaf />}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {(
              [
                [
                  "Energy reduction",
                  project.environmentalImpact.energyReduction,
                ],
                [
                  "Water reduction",
                  project.environmentalImpact.waterReduction,
                ],
                [
                  "Embodied carbon",
                  project.environmentalImpact.embodiedCarbonReduction,
                ],
                [
                  "Resilience gain",
                  project.environmentalImpact.resilienceGain,
                ],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-[rgba(61,93,72,0.1)] bg-[rgba(255,248,239,0.72)] p-3"
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

        <ReportSection title="Design Principles" icon={<IconStar />}>
          <AccentList items={project.designPrinciples} />
          {project.styleAnalysis ? (
            <p className="rounded-xl bg-[rgba(255,248,239,0.72)] p-4 text-[color:var(--foreground)]">
              {project.styleAnalysis.summary}
            </p>
          ) : null}
        </ReportSection>

        <ReportSection title="Visual Prompt Starters" icon={<IconSparkles />}>
          <div className="space-y-3">
            {project.visualPrompts.map((prompt) => (
              <article
                key={prompt.label}
                className="rounded-xl border border-[rgba(61,93,72,0.1)] bg-[rgba(255,248,239,0.55)] p-4"
              >
                <p className="font-tech text-xs uppercase tracking-[0.16em] text-[color:var(--accent-dark)]">
                  {prompt.label}
                </p>
                <p className="mt-2 text-[color:var(--foreground)]">
                  {prompt.prompt}
                </p>
                <p className="mt-1.5 text-sm">{prompt.note}</p>
              </article>
            ))}
          </div>
        </ReportSection>

        <div className="border-t border-[rgba(61,93,72,0.16)] pt-6">
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm font-semibold text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)] hover:text-white"
          >
            Return to dashboard
          </Link>
        </div>
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
