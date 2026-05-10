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
    <div className="shell py-12">
      <div className="mb-10 max-w-3xl space-y-4">
        <span className="font-tech section-kicker">EcoHome Studio</span>
        <h1 className="font-tech text-5xl leading-[1.04] tracking-[0.03em] text-[color:var(--foreground)]">
          Turn your brief into a sustainable home concept
        </h1>
        <p className="text-lg leading-8 text-[color:var(--muted)]">
          Bring in your home idea, layer on inspiration, then ground it in
          climate and budget so the concept feels thoughtful from the start.
        </p>
      </div>
      <StudioWizard initialDescription={initialDescription} />
    </div>
  );
}
