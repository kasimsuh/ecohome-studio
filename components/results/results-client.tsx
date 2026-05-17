"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ResultsView } from "@/components/results/results-view";
import { StudioMode } from "@/components/results/studio-mode";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { deriveReportMetrics } from "@/lib/domain/derive-report-metrics";
import {
  adaptStructuredConceptToGeneratedHomeConcept,
  isStructuredGeneratedHomeConceptPayload
} from "@/lib/domain/structured-home-adapter";
import { sampleGeneratedHomeConcept } from "@/lib/domain/sample-project";
import type { GeneratedHomeConcept } from "@/lib/domain/types";
import { getProjectStorageKey } from "@/lib/session";

export function ResultsClient({
  projectId,
  initialProject = null,
}: {
  projectId: string;
  initialProject?: GeneratedHomeConcept | null;
}) {
  const [project, setProject] = useState<GeneratedHomeConcept | null>(initialProject);
  const [ready, setReady] = useState(initialProject !== null);
  const [isStudioOpen, setStudioOpen] = useState(false);
  const thumbnailSaved = useRef(false);

  const handleCapture = useCallback(
    (dataUrl: string) => {
      if (thumbnailSaved.current || projectId === "demo") return;
      thumbnailSaved.current = true;
      fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnail: dataUrl }),
      }).catch(() => {/* non-fatal */});
    },
    [projectId],
  );

  const handleSaveStudio = useCallback(
    async (updated: GeneratedHomeConcept) => {
      const enriched = deriveReportMetrics(updated);
      setProject(enriched);

      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            getProjectStorageKey(projectId),
            JSON.stringify(enriched),
          );
        } catch {/* sessionStorage may be unavailable */}
      }

      if (projectId === "demo") return;

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: enriched }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          payload.error ||
            (response.status === 401
              ? "Sign in to save changes."
              : "Could not save changes."),
        );
      }
    },
    [projectId],
  );

  useEffect(() => {
    // Server already loaded the project from the DB — skip sessionStorage
    if (initialProject !== null) return;

    if (projectId === "demo") {
      setProject(sampleGeneratedHomeConcept);
      setReady(true);
      return;
    }

    const stored = window.sessionStorage.getItem(getProjectStorageKey(projectId));

    if (!stored) {
      setReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as unknown;

      if (isStructuredGeneratedHomeConceptPayload(parsed)) {
        setProject(adaptStructuredConceptToGeneratedHomeConcept(parsed));
      } else {
        setProject(parsed as GeneratedHomeConcept);
      }
    } catch {
      window.sessionStorage.removeItem(getProjectStorageKey(projectId));
    } finally {
      setReady(true);
    }
  }, [projectId, initialProject]);

  if (!ready) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[color:var(--border)] border-t-[color:var(--accent)]" />
          <div>
            <CardTitle>Preparing your results</CardTitle>
            <CardDescription>
              Just a moment while we load your concept.
            </CardDescription>
          </div>
        </div>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="p-8">
        <CardTitle>Project not found</CardTitle>
        <CardDescription>
          This starter keeps generated projects in session storage by default.
          Generate a new concept or open the sample result.
        </CardDescription>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/studio" className={buttonStyles()}>
            Generate a concept
          </Link>
          <Link
            href="/results/demo"
            className={buttonStyles({ variant: "secondary" })}
          >
            Open sample result
          </Link>
        </div>
      </Card>
    );
  }

  const canOpenStudio = Boolean(project.floorPlan && project.model3D);

  return (
    <>
      <ResultsView
        project={project}
        onCapture={handleCapture}
        onOpenStudio={canOpenStudio ? () => setStudioOpen(true) : undefined}
      />
      {isStudioOpen && canOpenStudio && (
        <StudioMode
          project={project}
          projectId={projectId}
          onClose={() => setStudioOpen(false)}
          onSave={handleSaveStudio}
        />
      )}
    </>
  );
}
