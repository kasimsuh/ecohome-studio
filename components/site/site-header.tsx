import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[rgba(248,241,230,0.8)] backdrop-blur-xl">
      <div className="shell flex items-center justify-between py-4">
        <Link href="/" className="block">
          <div>
            <p className="font-tech text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
              EcoHome Studio
            </p>
            <p className="text-sm text-[color:var(--muted)]">
              Sustainable home concept lab
            </p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-[color:var(--muted)] md:flex">
          <Link
            href="/studio"
            className="transition hover:text-[color:var(--foreground)]"
          >
            Studio
          </Link>
          <Link
            href="/results/demo"
            className="transition hover:text-[color:var(--foreground)]"
          >
            Sample result
          </Link>
          <Link href="/studio" className={buttonStyles({ size: "sm" })}>
            Start building
          </Link>
        </nav>
      </div>
    </header>
  );
}
