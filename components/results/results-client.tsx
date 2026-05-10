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

export function ResultsClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<GeneratedHomeConcept | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
  }, [projectId]);

  if (!ready) {
    return (
      <Card className="p-8">
        <CardTitle>Loading your concept</CardTitle>
        <CardDescription>
          Pulling the latest generated project from session storage.
        </CardDescription>
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
