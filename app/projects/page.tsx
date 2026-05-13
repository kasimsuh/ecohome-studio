import Link from "next/link";
import { redirect } from "next/navigation";

import { BackgroundScene } from "@/components/site/background-scene";
import { SiteBrand } from "@/components/site/site-brand";
import { buttonStyles } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GeneratedHomeConcept } from "@/lib/domain/types";

const climateLabels: Record<string, string> = {
  "hot-arid": "Hot & Arid",
  temperate: "Temperate",
  cold: "Cold",
  tropical: "Tropical",
  "flood-prone": "Flood-Prone",
};

const budgetLabels: Record<string, string> = {
  low: "Budget",
  medium: "Mid-Range",
  premium: "Premium",
};

type ProjectRow = {
  id: string;
  name: string;
  project_id: string;
  created_at: string;
  data: GeneratedHomeConcept;
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
      : score >= 60
        ? "bg-amber-50 text-amber-700"
        : "bg-[color:var(--surface-muted)] text-[color:var(--muted)]";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      {score}
    </span>
  );
}

function ProjectCard({ row }: { row: ProjectRow }) {
  const concept = row.data;
  const score = concept.sustainabilityScore?.total ?? 0;
  const date = new Date(row.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/results/${row.project_id}`}
      className="group flex flex-col rounded-[1.75rem] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,250,242,0.94),rgba(247,239,227,0.96))] p-6 shadow-[0_8px_32px_rgba(90,81,61,0.08)] backdrop-blur-xl transition hover:shadow-[0_12px_40px_rgba(90,81,61,0.14)] hover:-translate-y-0.5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <ScoreBadge score={score} />
        <span className="text-xs text-[color:var(--muted)]">{date}</span>
      </div>

      <h2 className="font-tech mb-1 text-lg font-semibold leading-snug tracking-[0.02em] text-[color:var(--foreground)] group-hover:text-[color:var(--accent)] transition-colors">
        {concept.heroTitle}
      </h2>

      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[color:var(--muted)]">
        {concept.summary}
      </p>

      <div className="mt-auto flex flex-wrap gap-2">
        <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
          {concept.architecturalStyle}
        </span>
        <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
          {climateLabels[concept.climateRegion] ?? concept.climateRegion}
        </span>
        <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
          {budgetLabels[concept.budgetLevel] ?? concept.budgetLevel}
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-[color:var(--accent)]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
          <path d="M9 21V12h6v9" />
        </svg>
      </div>
      <div>
        <p className="font-tech text-xl font-semibold text-[color:var(--foreground)]">
          No projects yet
        </p>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Generate your first sustainable home concept to get started.
        </p>
      </div>
      <Link href="/studio" className={buttonStyles({ size: "md" })}>
        Start a concept
      </Link>
    </div>
  );
}

export default async function ProjectsDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/projects");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, project_id, created_at, data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (projects ?? []) as ProjectRow[];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(77,121,91,0.12),transparent_20%),radial-gradient(circle_at_18%_18%,rgba(214,182,137,0.16),transparent_16%),radial-gradient(circle_at_82%_12%,rgba(114,153,124,0.08),transparent_18%)]" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[rgba(127,165,136,0.12)] blur-3xl" />
      <BackgroundScene />

      <div className="shell relative py-4 md:py-6">
        <header className="fade-up flex items-center justify-between gap-4">
          <SiteBrand
            href="/"
            subtitle="Sustainable concept assistant"
            subtitleClassName="text-sm"
            className="max-w-fit text-sm"
            showSubtitle
          />
          <Link href="/studio" className={buttonStyles({ size: "sm" })}>
            New concept
          </Link>
        </header>

        <main className="py-10">
          <div className="fade-up-delay mb-8">
            <span className="font-tech inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Your projects
            </span>
            <h1 className="font-tech mt-4 text-[clamp(1.6rem,3vw,2.4rem)] font-semibold leading-tight tracking-[0.02em] text-[color:var(--foreground)]">
              Saved concepts
            </h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {rows.length > 0
                ? `${rows.length} concept${rows.length === 1 ? "" : "s"} saved to your account`
                : "Your generated home concepts will appear here"}
            </p>
          </div>

          {rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="fade-up-slower grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((row) => (
                <ProjectCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
