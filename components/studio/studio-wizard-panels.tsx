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

function OptionCard({
  active,
  label,
  hint,
  onClick
}: {
  active: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[1.5rem] border p-4 text-left transition",
        active
          ? "border-[color:var(--accent)] bg-[color:var(--surface-strong)]"
          : "border-[color:var(--border)] bg-transparent hover:bg-[color:var(--surface-strong)]"
      )}
    >
      <p className="text-lg text-[color:var(--foreground)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{hint}</p>
    </button>
  );
}

export function StudioWizardSteps({ stepIndex }: { stepIndex: number }) {
  const steps = ["Vision", "Inspiration", "Context", "Review"];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {steps.map((step, index) => {
        const active = index === stepIndex;
        const complete = index < stepIndex;

        return (
          <div
            key={step}
            className={cn(
              "rounded-[1.5rem] border p-4 transition",
              active
                ? "border-[color:var(--accent)] bg-[color:var(--surface-strong)]"
                : "border-[color:var(--border)] bg-transparent",
              complete && "bg-[color:var(--accent-soft)]"
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Step {index + 1}
            </p>
            <p className="font-tech mt-2 text-xl tracking-[0.03em] text-[color:var(--foreground)]">
              {step}
            </p>
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
    <div className="space-y-6">
      <StepHeader
        title="Upload inspiration images"
        description="The current flow uses a lightweight vision placeholder to pull style cues from filenames and metadata, giving you a clean place to wire richer image analysis later."
      />
      <label className="block rounded-[1.75rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-8 text-center">
        <span className="text-lg font-semibold text-[color:var(--foreground)]">
          Drop JPG, PNG, or WEBP inspiration images here
        </span>
        <span className="mt-2 block text-sm leading-6 text-[color:var(--muted)]">
          Up to {MAX_INSPIRATION_IMAGES} files. Use filenames like
          `warm-wood-modern-home.jpg` to make the mocked analysis feel more intentional.
        </span>
        <input
          aria-label="Upload inspiration images"
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          className="mt-6 block w-full cursor-pointer text-sm text-[color:var(--muted)]"
          onChange={onFileSelection}
        />
      </label>
      {uploadError ? (
        <p className="rounded-2xl bg-[rgba(211,139,66,0.16)] px-4 py-3 text-sm text-[color:var(--foreground)]">
          {uploadError}
        </p>
      ) : null}
      {analysisPending ? (
        <p className="text-sm font-semibold text-[color:var(--accent)]">
          Analyzing inspiration direction...
        </p>
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
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            Climate region
          </p>
          <div className="grid gap-3">
            {climateOptions.map((option) => (
              <OptionCard
                key={option.value}
                active={climateRegion === option.value}
                label={option.label}
                hint={option.hint}
                onClick={() => onClimateRegionChange(option.value)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            Budget level
          </p>
          <div className="grid gap-3">
            {budgetOptions.map((option) => (
              <OptionCard
                key={option.value}
                active={budgetLevel === option.value}
                label={option.label}
                hint={option.hint}
                onClick={() => onBudgetLevelChange(option.value)}
              />
            ))}
          </div>
        </div>
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
