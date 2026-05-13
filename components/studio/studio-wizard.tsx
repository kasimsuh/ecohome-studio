"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  StudioBriefStep,
  StudioContextStep,
  StudioInspirationStep,
  StudioReviewStep,
  StudioWizardAlert,
  StudioWizardSteps,
} from "@/components/studio/studio-wizard-panels";
import {
  MAX_INSPIRATION_IMAGES,
  MIN_DESCRIPTION_LENGTH,
  budgetOptions,
  climateOptions,
} from "@/lib/domain/constants";
import { createInspirationImageRecord } from "@/lib/domain/mock-data";
import {
  adaptStructuredConceptToGeneratedHomeConcept,
  isStructuredGeneratedHomeConceptPayload,
} from "@/lib/domain/structured-home-adapter";
import type { GenerateHomeRequest } from "@/lib/domain/home-concept-schema";
import type {
  BudgetLevel,
  ClimateRegion,
  GeneratedHomeConcept,
  InspirationImage,
  StyleAnalysis,
} from "@/lib/domain/types";
import { getProjectStorageKey } from "@/lib/session";

interface FormState {
  description: string;
  location: string;
  climateRegion: ClimateRegion;
  budgetLevel: BudgetLevel;
}

const initialFormState: FormState = {
  description: "",
  location: "",
  climateRegion: "temperate",
  budgetLevel: "medium",
};

const steps = ["Vision", "Inspiration", "Context", "Review"];

export function StudioWizard({
  initialDescription = "",
}: {
  initialDescription?: string;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<FormState>(() => ({
    ...initialFormState,
    description: initialDescription.trim(),
  }));
  const [inspirationImages, setInspirationImages] = useState<
    InspirationImage[]
  >([]);
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisPending, setAnalysisPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reviewSummary = useMemo(
    () => ({
      description: formState.description,
      location: formState.location,
      climateRegion:
        climateOptions.find(
          (option) => option.value === formState.climateRegion,
        )?.label ?? formState.climateRegion,
      budgetLevel:
        budgetOptions.find((option) => option.value === formState.budgetLevel)
          ?.label ?? formState.budgetLevel,
      inspirationCount: inspirationImages.length,
    }),
    [formState, inspirationImages],
  );

  function updateFormState<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
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
        body: formData,
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
        error instanceof Error
          ? error.message
          : "Could not analyze those images.",
      );
      setStyleAnalysis(null);
      setInspirationImages(
        files.map((file) => createInspirationImageRecord(file)),
      );
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
      setUploadError(
        `Upload up to ${MAX_INSPIRATION_IMAGES} inspiration images.`,
      );
      return;
    }

    const invalidFile = files.find(
      (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type),
    );

    if (invalidFile) {
      setUploadError(
        "Only JPG, PNG, and WEBP files are supported in this starter.",
      );
      return;
    }

    await analyzeImages(files);
  }

  function validateStep(index: number) {
    if (
      index === 0 &&
      formState.description.trim().length < MIN_DESCRIPTION_LENGTH
    ) {
      setFormError(
        `Describe the dream home in at least ${MIN_DESCRIPTION_LENGTH} characters so the concept has enough context.`,
      );
      return false;
    }

    if (index === 2 && !formState.location.trim()) {
      setFormError(
        "Add a location so climate-specific recommendations stay grounded.",
      );
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
      styleAnalysis,
    };

    try {
      const response = await fetch("/api/generate-home", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
        JSON.stringify(concept),
      );
      router.push(`/results/${concept.projectId}`);
    } catch (error) {
      try {
        const fallbackResponse = await fetch("/api/generate-concept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!fallbackResponse.ok) {
          const payload = (await fallbackResponse.json()) as { error?: string };
          throw new Error(
            payload.error || "Could not generate a home concept.",
          );
        }

        const concept = (await fallbackResponse.json()) as GeneratedHomeConcept;
        window.sessionStorage.setItem(
          getProjectStorageKey(concept.projectId),
          JSON.stringify(concept),
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
    <form onSubmit={handleGenerate} className="flex h-full w-full flex-col">
      <div className="shrink-0 pb-4">
        <StudioWizardSteps stepIndex={stepIndex} />
      </div>

      {submitting ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[color:var(--border)] border-t-[color:var(--accent)]" />
          <div className="space-y-2 text-center">
            <p className="font-tech text-xl tracking-[0.03em] text-[color:var(--foreground)]">
              Designing your home concept
            </p>
            <p className="text-sm text-[color:var(--muted)]">
              This takes about 1 minute. Your concept is being generated now.
            </p>
          </div>
        </div>
      ) : (
        <>
          <Card className="min-h-0 flex-1 overflow-y-auto rounded-[2rem] p-8">
            {stepIndex === 0 ? (
              <StudioBriefStep
                description={formState.description}
                onDescriptionChange={(value) =>
                  updateFormState("description", value)
                }
              />
            ) : null}

            {stepIndex === 1 ? (
              <StudioInspirationStep
                analysisPending={analysisPending}
                styleAnalysis={styleAnalysis}
                uploadError={uploadError}
                onFileSelection={handleFileSelection}
              />
            ) : null}

            {stepIndex === 2 ? (
              <StudioContextStep
                budgetLevel={formState.budgetLevel}
                climateRegion={formState.climateRegion}
                location={formState.location}
                onBudgetLevelChange={(value) =>
                  updateFormState("budgetLevel", value)
                }
                onClimateRegionChange={(value) =>
                  updateFormState("climateRegion", value)
                }
                onLocationChange={(value) => updateFormState("location", value)}
              />
            ) : null}

            {stepIndex === 3 ? (
              <StudioReviewStep
                styleAnalysis={styleAnalysis}
                summary={reviewSummary}
              />
            ) : null}

            {formError ? <StudioWizardAlert message={formError} /> : null}
          </Card>

          <div className="flex shrink-0 flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm leading-6 text-[color:var(--muted)]">
              Want to inspect a complete sample without generating one?{" "}
              <Link
                href="/results/demo"
                className="font-semibold text-[color:var(--accent)]"
              >
                Open the demo result
              </Link>
              .
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={stepIndex === 0}
              >
                Back
              </Button>
              {stepIndex < steps.length - 1 ? (
                <Button onClick={handleNext}>Continue</Button>
              ) : (
                <Button type="submit">Generate concept</Button>
              )}
            </div>
          </div>
        </>
      )}
    </form>
  );
}
