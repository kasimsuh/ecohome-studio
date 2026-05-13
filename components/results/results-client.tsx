"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ResultsView } from "@/components/results/results-view";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
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

  return <ResultsView project={project} />;
}
