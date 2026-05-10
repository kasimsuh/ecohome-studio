import type { ChangeEvent } from "react";

import { CardDescription, CardTitle } from "@/components/ui/card";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_INSPIRATION_IMAGES,
  MIN_DESCRIPTION_LENGTH,
  budgetOptions,
  climateOptions
} from "@/lib/domain/constants";
import type { ClimateRegion, StyleAnalysis } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

type FormState = {
  description: string;
  location: string;
  climateRegion: ClimateRegion;
  budgetLevel: "low" | "medium" | "premium";
};

type ReviewSummary = {
  description: string;
  location: string;
  climateRegion: string;
  budgetLevel: string;
  inspirationCount: number;
};

function StepHeader({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <CardTitle className="font-tech tracking-[0.03em]">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </div>
  );
}


export function StudioWizardSteps({ stepIndex }: { stepIndex: number }) {
  const steps = ["Vision", "Inspiration", "Context", "Review"];

  return (
    <div className="flex items-start gap-0">
      {steps.map((step, index) => {
        const active = index === stepIndex;
        const complete = index < stepIndex;

        return (
          <div key={step} className="flex flex-1 items-start">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition",
                  complete
                    ? "bg-[color:var(--accent)] text-white"
                    : active
                      ? "bg-[color:var(--foreground)] text-[color:var(--surface)]"
                      : "border border-[color:var(--border)] text-[color:var(--muted)]"
                )}
              >
                {complete ? (
                  <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-current stroke-2">
                    <polyline points="1,5 4.5,8.5 11,1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  active || complete
                    ? "text-[color:var(--foreground)]"
                    : "text-[color:var(--muted)]"
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div className="mx-2 mt-4 h-px flex-1 bg-[color:var(--border)]" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function StudioBriefStep({
  description,
  onDescriptionChange
}: {
  description: string;
  onDescriptionChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        title="Describe the dream home"
        description="Capture style, atmosphere, lifestyle, and spaces that matter so the sustainability layer has something real to work with."
      />
      <label className="block">
        <span className="mb-3 block text-sm font-semibold text-[color:var(--foreground)]">
          Dream home brief
        </span>
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className="min-h-52 w-full rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-4 text-[color:var(--foreground)] outline-none ring-0 transition focus:border-[color:var(--accent)]"
          placeholder="Example: A light-filled family home with a warm modern exterior, flexible office space, durable finishes, and a strong connection to the garden."
        />
      </label>
      <p className="text-sm text-[color:var(--muted)]">
        Minimum {MIN_DESCRIPTION_LENGTH} characters. The better the brief, the stronger the generated concept.
      </p>
    </div>
  );
}

export function StudioInspirationStep({
  analysisPending,
  styleAnalysis,
  uploadError,
  onFileSelection
}: {
  analysisPending: boolean;
  styleAnalysis: StyleAnalysis | null;
  uploadError: string | null;
  onFileSelection: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <StepHeader
        title="Upload inspiration images"
        description="The current flow uses a lightweight vision placeholder to pull style cues from filenames and metadata, giving you a clean place to wire richer image analysis later."
      />
      <label className="block rounded-[1.75rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] px-6 py-5 text-center">
        <span className="text-lg font-semibold text-[color:var(--foreground)]">
          Drop JPG, PNG, or WEBP inspiration images here
        </span>
        <span className="mt-1.5 block text-sm leading-6 text-[color:var(--muted)]">
          Up to {MAX_INSPIRATION_IMAGES} files. Use filenames like
          `warm-wood-modern-home.jpg` to make the mocked analysis feel more intentional.
        </span>
        <input
          aria-label="Upload inspiration images"
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          className="mt-3 block w-full cursor-pointer text-sm text-[color:var(--muted)]"
          onChange={onFileSelection}
        />
      </label>
      {uploadError ? (
        <p className="rounded-2xl bg-[rgba(211,139,66,0.16)] px-4 py-3 text-sm text-[color:var(--foreground)]">
          {uploadError}
        </p>
      ) : null}
      {analysisPending ? (
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--accent)]" />
          <p className="text-sm font-semibold text-[color:var(--accent)]">
            Analyzing your inspiration images...
          </p>
        </div>
      ) : null}
      {styleAnalysis ? (
        <div className="grid gap-4 rounded-[1.75rem] bg-[color:var(--surface-muted)] p-5 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Extracted style
            </p>
            <p className="text-xl text-[color:var(--foreground)]">
              {styleAnalysis.aesthetic}
            </p>
            <p className="leading-7 text-[color:var(--muted)]">{styleAnalysis.summary}</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Palette and materials
            </p>
            <p className="text-[color:var(--foreground)]">
              {styleAnalysis.palette.join(", ")}
            </p>
            <p className="text-[color:var(--foreground)]">
              {styleAnalysis.materials.join(", ")}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function StudioContextStep({
  budgetLevel,
  climateRegion,
  location,
  onBudgetLevelChange,
  onClimateRegionChange,
  onLocationChange
}: {
  budgetLevel: FormState["budgetLevel"];
  climateRegion: ClimateRegion;
  location: string;
  onBudgetLevelChange: (value: FormState["budgetLevel"]) => void;
  onClimateRegionChange: (value: ClimateRegion) => void;
  onLocationChange: (value: string) => void;
}) {
  return (
    <div className="space-y-8">
      <StepHeader
        title="Set climate and budget context"
        description="This drives the recommendation engine, score weighting, and climate narrative on the results page."
      />
      <label className="block">
        <span className="mb-3 block text-sm font-semibold text-[color:var(--foreground)]">
          Location
        </span>
        <input
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          className="w-full rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
          placeholder="Toronto, Canada"
        />
      </label>
      <div className="grid gap-6 lg:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[color:var(--foreground)]">
            Climate region
          </span>
          <div className="relative">
            <select
              value={climateRegion}
              onChange={(e) => onClimateRegionChange(e.target.value as ClimateRegion)}
              className="w-full appearance-none rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 pr-10 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
            >
              {climateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 12 8"
              className="pointer-events-none absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2 fill-none stroke-[color:var(--muted)] stroke-2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1,1 6,7 11,1" />
            </svg>
          </div>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            {climateOptions.find((o) => o.value === climateRegion)?.hint}
          </p>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[color:var(--foreground)]">
            Budget level
          </span>
          <div className="relative">
            <select
              value={budgetLevel}
              onChange={(e) => onBudgetLevelChange(e.target.value as FormState["budgetLevel"])}
              className="w-full appearance-none rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 pr-10 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
            >
              {budgetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 12 8"
              className="pointer-events-none absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2 fill-none stroke-[color:var(--muted)] stroke-2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1,1 6,7 11,1" />
            </svg>
          </div>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            {budgetOptions.find((o) => o.value === budgetLevel)?.hint}
          </p>
        </label>
      </div>
    </div>
  );
}

export function StudioReviewStep({
  styleAnalysis,
  summary
}: {
  styleAnalysis: StyleAnalysis | null;
  summary: ReviewSummary;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        title="Review before generation"
        description="Submit the form to generate a concept package and route into the results dashboard shell."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] bg-[color:var(--surface-muted)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Brief
          </p>
          <p className="mt-3 leading-7 text-[color:var(--foreground)]">
            {summary.description || "No brief added yet."}
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-[color:var(--surface-muted)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Context
          </p>
          <div className="mt-3 space-y-2 text-[color:var(--foreground)]">
            <p>{summary.location}</p>
            <p>{summary.climateRegion}</p>
            <p>{summary.budgetLevel}</p>
            <p>{summary.inspirationCount} inspiration image(s)</p>
          </div>
        </div>
      </div>
      {styleAnalysis ? (
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Inspiration analysis preview
          </p>
          <p className="mt-3 leading-7 text-[color:var(--foreground)]">
            {styleAnalysis.summary}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function StudioWizardAlert({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-6 rounded-2xl bg-[rgba(211,139,66,0.16)] px-4 py-3 text-sm text-[color:var(--foreground)]"
    >
      {message}
    </p>
  );
}
