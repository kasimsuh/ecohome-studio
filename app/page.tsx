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

function BackgroundScene() {
  return (
    <svg
      viewBox="0 0 1440 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {/* ── Solar disc – upper right ── */}
      <circle cx="1090" cy="105" r="130" fill="rgba(196,155,104,0.045)" />
      <circle cx="1090" cy="105" r="78" fill="rgba(196,155,104,0.07)" />
      <circle cx="1090" cy="105" r="38" fill="rgba(196,155,104,0.12)" />

      {/* Sun rays */}
      <g stroke="rgba(196,155,104,0.22)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="1090" y1="50" x2="1090" y2="16" />
        <line x1="1090" y1="160" x2="1090" y2="196" />
        <line x1="1035" y1="105" x2="1001" y2="105" />
        <line x1="1145" y1="105" x2="1181" y2="105" />
        <line x1="1051" y1="66" x2="1027" y2="42" />
        <line x1="1129" y1="144" x2="1153" y2="168" />
        <line x1="1051" y1="144" x2="1027" y2="168" />
        <line x1="1129" y1="66" x2="1153" y2="42" />
      </g>

      {/* Longer faint rays */}
      <g stroke="rgba(196,155,104,0.08)" strokeWidth="1" strokeLinecap="round">
        <line x1="1090" y1="50" x2="1090" y2="-10" />
        <line x1="1145" y1="105" x2="1210" y2="105" />
        <line x1="1051" y1="66" x2="1012" y2="27" />
        <line x1="1129" y1="66" x2="1168" y2="27" />
      </g>

      {/* Solar panel grid near sun */}
      <g
        stroke="rgba(196,155,104,0.16)"
        strokeWidth="1"
        fill="rgba(196,155,104,0.05)"
      >
        <rect x="1190" y="52" width="72" height="48" rx="4" />
        <line x1="1190" y1="76" x2="1262" y2="76" />
        <line x1="1214" y1="52" x2="1214" y2="100" />
        <line x1="1238" y1="52" x2="1238" y2="100" />
      </g>
      {/* Panel glint */}
      <circle cx="1200" cy="62" r="2" fill="rgba(196,155,104,0.3)" />
      <circle cx="1250" cy="88" r="1.5" fill="rgba(196,155,104,0.25)" />

      {/* ── Energy flow line from sun toward center ── */}
      <path
        d="M 1060 140 Q 880 220 720 280 Q 560 340 400 370"
        stroke="rgba(196,155,104,0.09)"
        strokeWidth="1.5"
        strokeDasharray="5 8"
        strokeLinecap="round"
      />
      {/* Energy dots along flow */}
      <g fill="rgba(196,155,104,0.28)">
        <circle cx="1020" cy="155" r="2.5" />
        <circle cx="950" cy="188" r="2" />
        <circle cx="880" cy="218" r="2.5" />
        <circle cx="800" cy="248" r="2" />
        <circle cx="720" cy="278" r="2.5" />
        <circle cx="630" cy="310" r="2" />
        <circle cx="530" cy="340" r="2.5" />
        <circle cx="440" cy="362" r="2" />
      </g>

      {/* ── Left large tree ── */}
      {/* Trunk */}
      <path
        d="M 112 920 C 114 820 119 720 121 600 C 123 510 116 450 119 375"
        stroke="rgba(61,93,72,0.2)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Canopy – stacked ellipses */}
      <ellipse cx="132" cy="560" rx="96" ry="68" fill="rgba(61,117,88,0.085)" />
      <ellipse cx="110" cy="488" rx="82" ry="60" fill="rgba(61,117,88,0.10)" />
      <ellipse cx="138" cy="416" rx="70" ry="54" fill="rgba(61,117,88,0.11)" />
      <ellipse cx="118" cy="352" rx="58" ry="46" fill="rgba(61,117,88,0.10)" />
      <ellipse cx="128" cy="294" rx="44" ry="36" fill="rgba(61,117,88,0.09)" />
      <ellipse cx="120" cy="246" rx="30" ry="26" fill="rgba(61,117,88,0.08)" />
      {/* Branch hints */}
      <path
        d="M 119 440 Q 170 420 200 408"
        stroke="rgba(61,93,72,0.12)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 121 390 Q 68 370 46 358"
        stroke="rgba(61,93,72,0.11)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* ── Left edge slender tree ── */}
      <path
        d="M 28 920 C 30 840 33 760 34 672"
        stroke="rgba(61,93,72,0.13)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse cx="38" cy="644" rx="46" ry="34" fill="rgba(61,117,88,0.068)" />
      <ellipse cx="26" cy="596" rx="38" ry="30" fill="rgba(61,117,88,0.076)" />
      <ellipse cx="34" cy="552" rx="30" ry="24" fill="rgba(61,117,88,0.07)" />
      <ellipse cx="28" cy="514" rx="20" ry="17" fill="rgba(61,117,88,0.062)" />

      {/* ── Right large tree ── */}
      <path
        d="M 1328 920 C 1326 820 1321 720 1319 600 C 1317 510 1324 450 1321 375"
        stroke="rgba(61,93,72,0.2)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <ellipse cx="1308" cy="560" rx="96" ry="68" fill="rgba(61,117,88,0.085)" />
      <ellipse cx="1330" cy="488" rx="82" ry="60" fill="rgba(61,117,88,0.10)" />
      <ellipse cx="1302" cy="416" rx="70" ry="54" fill="rgba(61,117,88,0.11)" />
      <ellipse cx="1322" cy="352" rx="58" ry="46" fill="rgba(61,117,88,0.10)" />
      <ellipse cx="1312" cy="294" rx="44" ry="36" fill="rgba(61,117,88,0.09)" />
      <ellipse cx="1320" cy="246" rx="30" ry="26" fill="rgba(61,117,88,0.08)" />
      <path
        d="M 1321 440 Q 1270 420 1240 408"
        stroke="rgba(61,93,72,0.12)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 1319 390 Q 1372 370 1394 358"
        stroke="rgba(61,93,72,0.11)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* ── Right edge slender tree ── */}
      <path
        d="M 1412 920 C 1410 840 1407 760 1406 672"
        stroke="rgba(61,93,72,0.13)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse cx="1402" cy="644" rx="46" ry="34" fill="rgba(61,117,88,0.068)" />
      <ellipse cx="1414" cy="596" rx="38" ry="30" fill="rgba(61,117,88,0.076)" />
      <ellipse cx="1406" cy="552" rx="30" ry="24" fill="rgba(61,117,88,0.07)" />
      <ellipse cx="1412" cy="514" rx="20" ry="17" fill="rgba(61,117,88,0.062)" />

      {/* ── Ground grass line ── */}
      <path
        d="M 0 890 Q 180 876 360 884 Q 540 892 720 882 Q 900 872 1080 880 Q 1260 888 1440 878"
        stroke="rgba(61,93,72,0.08)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Grass tufts left */}
      <g stroke="rgba(61,93,72,0.14)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="60" y1="896" x2="58" y2="880" />
        <line x1="68" y1="896" x2="70" y2="878" />
        <line x1="76" y1="896" x2="74" y2="882" />
        <line x1="160" y1="894" x2="158" y2="878" />
        <line x1="168" y1="894" x2="170" y2="876" />
        <line x1="176" y1="894" x2="174" y2="880" />
      </g>
      {/* Grass tufts right */}
      <g stroke="rgba(61,93,72,0.14)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="1264" y1="896" x2="1262" y2="880" />
        <line x1="1272" y1="896" x2="1274" y2="878" />
        <line x1="1280" y1="896" x2="1278" y2="882" />
        <line x1="1370" y1="892" x2="1368" y2="876" />
        <line x1="1378" y1="892" x2="1380" y2="874" />
        <line x1="1386" y1="892" x2="1384" y2="878" />
      </g>

      {/* ── Floating leaves ── */}
      {/* Each leaf: filled teardrop + midrib stroke */}
      <g transform="translate(290,310) rotate(-28)">
        <path d="M 0 0 Q -9 -15 0 -28 Q 9 -15 0 0 Z" fill="rgba(61,117,88,0.15)" />
        <line x1="0" y1="0" x2="0" y2="-28" stroke="rgba(61,93,72,0.12)" strokeWidth="0.8" />
      </g>
      <g transform="translate(460,175) rotate(22)">
        <path d="M 0 0 Q -11 -18 0 -34 Q 11 -18 0 0 Z" fill="rgba(61,117,88,0.11)" />
        <line x1="0" y1="0" x2="0" y2="-34" stroke="rgba(61,93,72,0.10)" strokeWidth="0.8" />
      </g>
      <g transform="translate(660,148) rotate(-18)">
        <path d="M 0 0 Q -7 -12 0 -22 Q 7 -12 0 0 Z" fill="rgba(61,117,88,0.13)" />
        <line x1="0" y1="0" x2="0" y2="-22" stroke="rgba(61,93,72,0.10)" strokeWidth="0.7" />
      </g>
      <g transform="translate(820,192) rotate(38)">
        <path d="M 0 0 Q -10 -17 0 -30 Q 10 -17 0 0 Z" fill="rgba(61,117,88,0.10)" />
        <line x1="0" y1="0" x2="0" y2="-30" stroke="rgba(61,93,72,0.09)" strokeWidth="0.8" />
      </g>
      <g transform="translate(980,268) rotate(-42)">
        <path d="M 0 0 Q -8 -14 0 -25 Q 8 -14 0 0 Z" fill="rgba(61,117,88,0.12)" />
        <line x1="0" y1="0" x2="0" y2="-25" stroke="rgba(61,93,72,0.10)" strokeWidth="0.7" />
      </g>
      <g transform="translate(1170,315) rotate(-22)">
        <path d="M 0 0 Q -9 -15 0 -27 Q 9 -15 0 0 Z" fill="rgba(61,117,88,0.13)" />
        <line x1="0" y1="0" x2="0" y2="-27" stroke="rgba(61,93,72,0.10)" strokeWidth="0.8" />
      </g>
      {/* Warm-toned leaf */}
      <g transform="translate(360,490) rotate(14)">
        <path d="M 0 0 Q -7 -11 0 -20 Q 7 -11 0 0 Z" fill="rgba(196,155,104,0.18)" />
        <line x1="0" y1="0" x2="0" y2="-20" stroke="rgba(196,155,104,0.14)" strokeWidth="0.7" />
      </g>
      <g transform="translate(1060,440) rotate(-10)">
        <path d="M 0 0 Q -6 -10 0 -18 Q 6 -10 0 0 Z" fill="rgba(196,155,104,0.14)" />
        <line x1="0" y1="0" x2="0" y2="-18" stroke="rgba(196,155,104,0.11)" strokeWidth="0.7" />
      </g>

      {/* ── Energy lightning bolts ── */}
      <g fill="rgba(196,155,104,0.22)" transform="translate(572,158)">
        <path d="M 7 0 L 1 11 L 5 11 L -1 22 L 9 9 L 5 9 L 11 0 Z" />
      </g>
      <g fill="rgba(196,155,104,0.16)" transform="translate(870,128) scale(0.75)">
        <path d="M 7 0 L 1 11 L 5 11 L -1 22 L 9 9 L 5 9 L 11 0 Z" />
      </g>
      <g fill="rgba(61,117,88,0.18)" transform="translate(1240,310) scale(0.65)">
        <path d="M 7 0 L 1 11 L 5 11 L -1 22 L 9 9 L 5 9 L 11 0 Z" />
      </g>

      {/* ── Wind turbine (subtle, bottom-left quadrant) ── */}
      <g
        stroke="rgba(61,93,72,0.13)"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform="translate(230, 620)"
      >
        {/* Tower */}
        <line x1="0" y1="0" x2="0" y2="80" />
        <line x1="-4" y1="80" x2="4" y2="80" />
        {/* Hub */}
        <circle cx="0" cy="0" r="3" fill="rgba(61,93,72,0.14)" stroke="none" />
        {/* Blades */}
        <line x1="0" y1="0" x2="0" y2="-26" />
        <line x1="0" y1="0" x2="22" y2="13" />
        <line x1="0" y1="0" x2="-22" y2="13" />
      </g>

      {/* ── Second wind turbine (right, smaller) ── */}
      <g
        stroke="rgba(61,93,72,0.10)"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform="translate(1210, 680)"
      >
        <line x1="0" y1="0" x2="0" y2="60" />
        <line x1="-3" y1="60" x2="3" y2="60" />
        <circle cx="0" cy="0" r="2.5" fill="rgba(61,93,72,0.11)" stroke="none" />
        <line x1="0" y1="0" x2="0" y2="-20" />
        <line x1="0" y1="0" x2="17" y2="10" />
        <line x1="0" y1="0" x2="-17" y2="10" />
      </g>

      {/* ── Scattered energy orbs / particles ── */}
      <g fill="rgba(61,117,88,0.14)">
        <circle cx="320" cy="240" r="3.5" />
        <circle cx="340" cy="218" r="2.5" />
        <circle cx="365" cy="200" r="3" />
        <circle cx="395" cy="188" r="2" />
        <circle cx="428" cy="178" r="3" />
      </g>
      <g fill="rgba(196,155,104,0.2)">
        <circle cx="1010" cy="320" r="2.5" />
        <circle cx="1030" cy="300" r="2" />
        <circle cx="1054" cy="285" r="3" />
        <circle cx="1080" cy="275" r="2" />
      </g>
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="relative h-screen overflow-hidden">
      {/* Gradient atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(77,121,91,0.12),transparent_20%),radial-gradient(circle_at_18%_18%,rgba(214,182,137,0.16),transparent_16%),radial-gradient(circle_at_82%_12%,rgba(114,153,124,0.08),transparent_18%)]" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[rgba(127,165,136,0.12)] blur-3xl" />

      {/* SVG illustrated background */}
      <BackgroundScene />

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
