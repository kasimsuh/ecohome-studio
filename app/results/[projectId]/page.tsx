import { ResultsClient } from "@/components/results/results-client";

export default async function ResultsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="shell py-12">
      <ResultsClient projectId={projectId} />
    </div>
  );
}
