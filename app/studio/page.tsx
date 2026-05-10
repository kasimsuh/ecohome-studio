import { StudioWizard } from "@/components/studio/studio-wizard";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ brief?: string | string[] }>;
}) {
  const { brief } = await searchParams;
  const initialDescription =
    typeof brief === "string"
      ? brief
      : Array.isArray(brief)
        ? (brief[0] ?? "")
        : "";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="shell shrink-0 pb-4 pt-8">
        <span className="font-tech section-kicker">EcoHome Studio</span>
        <h1 className="font-tech mt-1 text-2xl tracking-[0.03em] text-[color:var(--foreground)]">
          Turn your brief into a sustainable home concept
        </h1>
      </div>
      <div className="shell flex min-h-0 flex-1 pb-6">
        <StudioWizard initialDescription={initialDescription} />
      </div>
    </div>
  );
}
