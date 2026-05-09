import { cn } from "@/lib/utils";

export function SectionHeading({
  kicker,
  title,
  description,
  className
}: {
  kicker: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <span className="section-kicker">{kicker}</span>
      <h2 className="text-3xl text-[color:var(--foreground)] md:text-4xl">{title}</h2>
      {description ? (
        <p className="max-w-3xl leading-7 text-[color:var(--muted)]">{description}</p>
      ) : null}
    </div>
  );
}
