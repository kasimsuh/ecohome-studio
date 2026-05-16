"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Home3DPreview } from "@/components/results/home-3d-preview";
import { StudioModeEditor } from "@/components/results/studio-mode-editor";
import { buttonStyles } from "@/components/ui/button";
import { normalizeStudioModel3D } from "@/lib/domain/normalize-model3d";
import type { GeneratedHomeConcept, Model3D } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

// Note: Studio Mode edits `model3D` independently of `floorPlan`. The 3D
// renderer tolerates floor count / body style changes that don't match the
// original 2D room layout; we intentionally do NOT regenerate the floor plan.
export function StudioMode({
  project,
  onClose,
  onSave,
}: {
  project: GeneratedHomeConcept;
  projectId: string;
  onClose: () => void;
  onSave: (updated: GeneratedHomeConcept) => Promise<void>;
}) {
  const initialModel = project.model3D;

  const [draftModel, setDraftModel] = useState<Model3D>(() =>
    normalizeStudioModel3D(initialModel ?? defaultModel()),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const setDraftNormalized = useCallback(
    (next: Model3D | ((prev: Model3D) => Model3D)) => {
      setDraftModel((prev) => {
        const candidate = typeof next === "function" ? next(prev) : next;
        return normalizeStudioModel3D(candidate);
      });
    },
    [],
  );

  const isDirty = useMemo(
    () =>
      initialModel ? !shallowModelEqual(draftModel, initialModel) : true,
    [draftModel, initialModel],
  );

  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        "Discard your unsaved changes and close Studio Mode?",
      );
      if (!confirmed) return;
    }
    onClose();
  }, [isDirty, onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  async function handleSave() {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({ ...project, model3D: draftModel });
      onClose();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save changes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    if (initialModel) setDraftModel(initialModel);
  }

  if (!project.floorPlan || !initialModel) return null;

  // TODO: re-capture a thumbnail after save via the existing ScreenshotCapture
  // pipeline so the project card shows the customized home.

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[color:var(--background)] lg:flex-row"
      role="dialog"
      aria-modal="true"
      aria-label="Studio Mode"
    >
      <div className="relative flex-1 overflow-hidden">
        <Home3DPreview
          floorPlan={project.floorPlan}
          model3D={draftModel}
          upgrades={project.upgrades}
          materials={project.materials}
          architecturalStyle={project.architecturalStyle}
          summary={project.summary}
          location={project.location}
          climateRegion={project.climateRegion}
          budgetLevel={project.budgetLevel}
          visualPrompts={project.visualPrompts}
          styleAnalysis={project.styleAnalysis}
          sceneSeed={`${project.projectId}:${project.location}:${project.architecturalStyle}`}
          variant="workspace"
          hideOverlayChrome
        />

        <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-3 sm:inset-x-5 sm:top-5">
          <button
            type="button"
            onClick={handleClose}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-[rgba(61,93,72,0.18)] bg-[rgba(255,250,242,0.78)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] shadow-[0_12px_35px_rgba(45,39,28,0.12)] backdrop-blur-xl transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-dark)]"
          >
            <span aria-hidden>←</span>
            Back to results
          </button>
        </div>
      </div>

      <aside className="flex h-[55vh] w-full flex-col border-t border-[color:var(--border)] bg-[color:var(--surface)] lg:h-auto lg:w-[400px] lg:border-l lg:border-t-0 xl:w-[440px]">
        <div className="flex shrink-0 justify-center pt-2 lg:hidden">
          <span
            className="h-1 w-10 rounded-full bg-[color:var(--border)]"
            aria-hidden
          />
        </div>

        <header className="shrink-0 border-b border-[color:var(--border)] px-5 py-5">
          <p className="font-tech text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Customize
          </p>
          <h2 className="font-tech mt-1 text-xl tracking-[0.02em] text-[color:var(--foreground)]">
            Your dream home
          </h2>
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            Tweak the look and structure, then save.
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          <StudioModeEditor draft={draftModel} onChange={setDraftNormalized} />
        </div>

        <footer className="shrink-0 border-t border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4">
          {saveError && (
            <p className="mb-2.5 text-xs font-medium text-[color:var(--danger,#b03a2e)]">
              {saveError}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || isSaving}
              className={cn(
                buttonStyles({ variant: "secondary", size: "md" }),
                "flex-1",
              )}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className={cn(
                buttonStyles({ variant: "primary", size: "md" }),
                "flex-1",
              )}
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function shallowModelEqual(a: Model3D, b: Model3D): boolean {
  if (
    a.floors !== b.floors ||
    a.roofType !== b.roofType ||
    a.wallMaterial !== b.wallMaterial ||
    a.exteriorColor !== b.exteriorColor ||
    a.facadeMaterial !== b.facadeMaterial ||
    a.roofMaterial !== b.roofMaterial ||
    a.chimneyCount !== b.chimneyCount ||
    a.hasDeck !== b.hasDeck ||
    a.bodyStyle !== b.bodyStyle ||
    a.dormerCount !== b.dormerCount ||
    a.roofDesign !== b.roofDesign
  ) {
    return false;
  }
  const af = a.sustainabilityFeatures;
  const bf = b.sustainabilityFeatures;
  if (
    af.solarPanels !== bf.solarPanels ||
    af.greenRoof !== bf.greenRoof ||
    af.rainwaterTank !== bf.rainwaterTank ||
    af.trees !== bf.trees ||
    af.permeableDriveway !== bf.permeableDriveway ||
    af.crossVentilation !== bf.crossVentilation
  ) {
    return false;
  }
  if (a.windows.length !== b.windows.length) return false;
  if (a.doors.length !== b.doors.length) return false;
  return true;
}

function defaultModel(): Model3D {
  return {
    floors: 1,
    roofType: "gable",
    wallMaterial: "timber",
    exteriorColor: "warm-white",
    windows: [],
    doors: [],
    sustainabilityFeatures: {
      solarPanels: false,
      greenRoof: false,
      rainwaterTank: false,
      trees: false,
      permeableDriveway: false,
      crossVentilation: false,
    },
  };
}
