import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

const quickStarts = [
  {
    label: "Passive family home",
    prompt:
      "A light-filled family home with passive solar gain, flexible work space, durable low-carbon materials, and a close connection to the garden.",
  },
  {
    label: "Rain-ready coastal retreat",
    prompt:
      "A calm coastal home designed for storm resilience, natural ventilation, moisture-tolerant materials, and easy long-term maintenance.",
  },
  {
    label: "Compact urban infill",
    prompt:
      "A compact urban infill home that feels spacious, uses smart daylighting, supports a tight footprint, and keeps energy use low.",
  },
];

function ArrowUpIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M12 6v12" />
      <path d="m7 11 5-5 5 5" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="relative h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(77,121,91,0.12),transparent_20%),radial-gradient(circle_at_18%_18%,rgba(214,182,137,0.16),transparent_16%),radial-gradient(circle_at_82%_12%,rgba(114,153,124,0.08),transparent_18%)]" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[rgba(127,165,136,0.12)] blur-3xl" />

      <div className="shell relative flex h-screen flex-col py-4 md:py-6">
        <header className="fade-up flex items-center justify-between gap-4">
          <Link href="/" className="block">
            <div>
              <p className="font-tech text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
                EcoHome Studio
              </p>
              <p className="text-sm text-[color:var(--muted)]">
                Sustainable concept assistant
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/results/demo"
              className="hidden rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--foreground)] md:inline-flex"
            >
              Sample result
            </Link>
            <Link href="/studio" className={buttonStyles({ size: "sm" })}>
              Open studio
            </Link>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 py-5 md:gap-7 md:py-6">
          <section className="fade-up-delay mx-auto max-w-xl text-center">
            <span className="font-tech inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Eco-conscious home design
            </span>

            <div className="mt-4 space-y-2 md:mt-5 md:space-y-3">
              <h1 className="font-tech text-[clamp(2rem,4.4vw,3.65rem)] leading-[1.02] tracking-[0.03em] text-[color:var(--foreground)]">
                Start with a home idea.
                <span className="block text-[color:var(--accent)]">
                  We shape the sustainable concept.
                </span>
              </h1>
              <p className="mx-auto max-w-lg text-[0.95rem] leading-7 text-[color:var(--muted)] md:text-base">
                A quiet starting point for climate-aware home design, balancing
                mood, materials, resilience, and budget before the details.
              </p>
            </div>
          </section>

          <section className="fade-up-slower w-full max-w-[920px]">
            <form
              action="/studio"
              className="rounded-[2rem] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,250,242,0.94),rgba(247,239,227,0.96))] p-4 shadow-[0_20px_55px_rgba(90,81,61,0.12)] backdrop-blur-2xl"
            >
              <label htmlFor="brief" className="sr-only">
                Describe the home you want to design
              </label>
              <textarea
                id="brief"
                name="brief"
                rows={2}
                className="min-h-[72px] w-full resize-none bg-transparent px-2 py-2 text-[0.95rem] leading-7 text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--muted)]/80 md:min-h-[88px] md:text-base"
                placeholder="Describe the home you want to design: the atmosphere, the way it should live, the climate it sits in, and how lightly it should tread on the planet."
              />

              <div className="mt-3 flex justify-end border-t border-[color:var(--border)] pt-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-[0.95rem] font-semibold text-white transition hover:bg-[color:var(--accent-dark)]"
                >
                  Start concept
                  <ArrowUpIcon />
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-3">
                {quickStarts.map((item) => (
                  <Link
                    key={item.label}
                    href={{
                      pathname: "/studio",
                      query: { brief: item.prompt },
                    }}
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
