"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_INSPIRATION_IMAGES,
  MIN_DESCRIPTION_LENGTH,
  budgetOptions,
  climateOptions
} from "@/lib/domain/constants";
import { createInspirationImageRecord } from "@/lib/domain/mock-data";
import {
  adaptStructuredConceptToGeneratedHomeConcept,
  isStructuredGeneratedHomeConceptPayload
} from "@/lib/domain/structured-home-adapter";
import type { GenerateHomeRequest } from "@/lib/domain/home-concept-schema";
import type {
  BudgetLevel,
  ClimateRegion,
  GeneratedHomeConcept,
  InspirationImage,
  StyleAnalysis
} from "@/lib/domain/types";
import { getProjectStorageKey } from "@/lib/session";
import { cn } from "@/lib/utils";

const steps = ["Vision", "Inspiration", "Context", "Review"];

interface FormState {
  description: string;
  location: string;
  climateRegion: ClimateRegion;
  budgetLevel: BudgetLevel;
}

const initialFormState: FormState = {
  description: "",
  location: "Toronto, Canada",
  climateRegion: "cold",
  budgetLevel: "medium"
};

export function StudioWizard({
  initialDescription = ""
}: {
  initialDescription?: string;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<FormState>(() => ({
    ...initialFormState,
    description: initialDescription.trim()
  }));
  const [inspirationImages, setInspirationImages] = useState<InspirationImage[]>([]);
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisPending, setAnalysisPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reviewSummary = useMemo(
    () => ({
      description: formState.description,
      location: formState.location,
      climateRegion:
        climateOptions.find((option) => option.value === formState.climateRegion)?.label ??
        formState.climateRegion,
      budgetLevel:
        budgetOptions.find((option) => option.value === formState.budgetLevel)?.label ??
        formState.budgetLevel,
      inspirationCount: inspirationImages.length
    }),
    [formState, inspirationImages.length]
  );

  function updateFormState<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  async function analyzeImages(files: File[]) {
    if (!files.length) {
      setStyleAnalysis(null);
      setInspirationImages([]);
      return;
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file, file.name);
    });

    setAnalysisPending(true);
    setUploadError(null);

    try {
      const response = await fetch("/api/analyze-inspiration", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Could not analyze those images.");
      }

      const payload = (await response.json()) as {
        styleAnalysis: StyleAnalysis;
        inspirationImages: InspirationImage[];
      };

      setStyleAnalysis(payload.styleAnalysis);
      setInspirationImages(payload.inspirationImages);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Could not analyze those images."
      );
      setStyleAnalysis(null);
      setInspirationImages(files.map((file) => createInspirationImageRecord(file)));
    } finally {
      setAnalysisPending(false);
    }
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setUploadError(null);

    if (!files.length) {
      setStyleAnalysis(null);
      setInspirationImages([]);
      return;
    }

    if (files.length > MAX_INSPIRATION_IMAGES) {
      setUploadError(`Upload up to ${MAX_INSPIRATION_IMAGES} inspiration images.`);
      return;
    }

    const invalidFile = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));

    if (invalidFile) {
      setUploadError("Only JPG, PNG, and WEBP files are supported in this starter.");
      return;
    }

    await analyzeImages(files);
  }

  function validateStep(index: number) {
    if (index === 0 && formState.description.trim().length < MIN_DESCRIPTION_LENGTH) {
      setFormError(
        `Describe the dream home in at least ${MIN_DESCRIPTION_LENGTH} characters so the concept has enough context.`
      );
      return false;
    }

    if (index === 2 && !formState.location.trim()) {
      setFormError("Add a location so climate-specific recommendations stay grounded.");
      return false;
    }

    setFormError(null);
    return true;
  }

  function handleNext() {
    if (!validateStep(stepIndex)) {
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleBack() {
    setFormError(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateStep(0) || !validateStep(2)) {
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const requestBody: GenerateHomeRequest = {
      ...formState,
      inspirationImages,
      styleAnalysis
    };

    try {
      const response = await fetch("/api/generate-home", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error("Could not generate a structured home concept.");
      }

      const payload = (await response.json()) as unknown;

      if (!isStructuredGeneratedHomeConceptPayload(payload)) {
        throw new Error("Structured concept response was incomplete.");
      }

      const concept = adaptStructuredConceptToGeneratedHomeConcept(payload);
      window.sessionStorage.setItem(
        getProjectStorageKey(concept.projectId),
        JSON.stringify(concept)
      );
      router.push(`/results/${concept.projectId}`);
    } catch (error) {
      try {
        const fallbackResponse = await fetch("/api/generate-concept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        if (!fallbackResponse.ok) {
          const payload = (await fallbackResponse.json()) as { error?: string };
          throw new Error(payload.error || "Could not generate a home concept.");
        }

        const concept = (await fallbackResponse.json()) as GeneratedHomeConcept;
        window.sessionStorage.setItem(
          getProjectStorageKey(concept.projectId),
          JSON.stringify(concept)
        );
        router.push(`/results/${concept.projectId}`);
      } catch (fallbackError) {
        const message =
          fallbackError instanceof Error
            ? fallbackError.message
            : error instanceof Error
              ? error.message
              : "Could not generate a home concept.";

        setFormError(message);
        setSubmitting(false);
      }
    }
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-8">
      <Card className="rounded-[2rem] p-6">
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
      </Card>

      <Card className="rounded-[2rem] p-8">
        {stepIndex === 0 ? (
          <div className="space-y-6">
            <div>
              <CardTitle className="font-tech tracking-[0.03em]">
                Describe the dream home
              </CardTitle>
              <CardDescription>
                Capture style, atmosphere, lifestyle, and spaces that matter so
                the sustainability layer has something real to work with.
              </CardDescription>
            </div>
            <label className="block">
              <span className="mb-3 block text-sm font-semibold text-[color:var(--foreground)]">
                Dream home brief
              </span>
              <textarea
                value={formState.description}
                onChange={(event) => updateFormState("description", event.target.value)}
                className="min-h-52 w-full rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-4 text-[color:var(--foreground)] outline-none ring-0 transition focus:border-[color:var(--accent)]"
                placeholder="Example: A light-filled family home with a warm modern exterior, flexible office space, durable finishes, and a strong connection to the garden."
              />
            </label>
            <p className="text-sm text-[color:var(--muted)]">
              Minimum {MIN_DESCRIPTION_LENGTH} characters. The better the brief,
              the stronger the generated concept.
            </p>
          </div>
        ) : null}

        {stepIndex === 1 ? (
          <div className="space-y-6">
            <div>
              <CardTitle className="font-tech tracking-[0.03em]">
                Upload inspiration images
              </CardTitle>
              <CardDescription>
                The current flow uses a lightweight vision placeholder to pull
                style cues from filenames and metadata, giving you a clean place
                to wire richer image analysis later.
              </CardDescription>
            </div>
            <label className="block rounded-[1.75rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-8 text-center">
              <span className="text-lg font-semibold text-[color:var(--foreground)]">
                Drop JPG, PNG, or WEBP inspiration images here
              </span>
              <span className="mt-2 block text-sm leading-6 text-[color:var(--muted)]">
                Up to {MAX_INSPIRATION_IMAGES} files. Use filenames like
                `warm-wood-modern-home.jpg` to make the mocked analysis feel
                more intentional.
              </span>
              <input
                aria-label="Upload inspiration images"
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                multiple
                className="mt-6 block w-full cursor-pointer text-sm text-[color:var(--muted)]"
                onChange={handleFileSelection}
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
                  <p className="leading-7 text-[color:var(--muted)]">
                    {styleAnalysis.summary}
                  </p>
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
        ) : null}

        {stepIndex === 2 ? (
          <div className="space-y-8">
            <div>
              <CardTitle className="font-tech tracking-[0.03em]">
                Set climate and budget context
              </CardTitle>
              <CardDescription>
                This drives the recommendation engine, score weighting, and
                climate narrative on the results page.
              </CardDescription>
            </div>
            <label className="block">
              <span className="mb-3 block text-sm font-semibold text-[color:var(--foreground)]">
                Location
              </span>
              <input
                value={formState.location}
                onChange={(event) => updateFormState("location", event.target.value)}
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
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormState("climateRegion", option.value)}
                      className={cn(
                        "rounded-[1.5rem] border p-4 text-left transition",
                        formState.climateRegion === option.value
                          ? "border-[color:var(--accent)] bg-[color:var(--surface-strong)]"
                          : "border-[color:var(--border)] bg-transparent hover:bg-[color:var(--surface-strong)]"
                      )}
                    >
                      <p className="text-lg text-[color:var(--foreground)]">{option.label}</p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        {option.hint}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  Budget level
                </p>
                <div className="grid gap-3">
                  {budgetOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormState("budgetLevel", option.value)}
                      className={cn(
                        "rounded-[1.5rem] border p-4 text-left transition",
                        formState.budgetLevel === option.value
                          ? "border-[color:var(--accent)] bg-[color:var(--surface-strong)]"
                          : "border-[color:var(--border)] bg-transparent hover:bg-[color:var(--surface-strong)]"
                      )}
                    >
                      <p className="text-lg text-[color:var(--foreground)]">{option.label}</p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        {option.hint}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {stepIndex === 3 ? (
          <div className="space-y-6">
            <div>
              <CardTitle className="font-tech tracking-[0.03em]">
                Review before generation
              </CardTitle>
              <CardDescription>
                Submit the form to generate a concept package and route into the
                results dashboard shell.
              </CardDescription>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-[color:var(--surface-muted)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Brief
                </p>
                <p className="mt-3 leading-7 text-[color:var(--foreground)]">
                  {reviewSummary.description || "No brief added yet."}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-[color:var(--surface-muted)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Context
                </p>
                <div className="mt-3 space-y-2 text-[color:var(--foreground)]">
                  <p>{reviewSummary.location}</p>
                  <p>{reviewSummary.climateRegion}</p>
                  <p>{reviewSummary.budgetLevel}</p>
                  <p>{reviewSummary.inspirationCount} inspiration image(s)</p>
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
        ) : null}

        {formError ? (
          <p
            role="alert"
            className="mt-6 rounded-2xl bg-[rgba(211,139,66,0.16)] px-4 py-3 text-sm text-[color:var(--foreground)]"
          >
            {formError}
          </p>
        ) : null}
      </Card>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm leading-6 text-[color:var(--muted)]">
          Want to inspect a complete sample without generating one?
          {" "}
          <Link href="/results/demo" className="font-semibold text-[color:var(--accent)]">
            Open the demo result
          </Link>
          .
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={stepIndex === 0 || submitting}
          >
            Back
          </Button>
          {stepIndex < steps.length - 1 ? (
            <Button onClick={handleNext}>Continue</Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? "Generating concept..." : "Generate concept"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
