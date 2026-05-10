import { ResultsClient } from "@/components/results/results-client";

export default async function ResultsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden">
      <ResultsClient projectId={projectId} />
    </div>
  );
}
