import { Suspense } from "react";

import { BackgroundScene } from "@/components/site/background-scene";
import { SiteBrand } from "@/components/site/site-brand";
import { buttonStyles } from "@/components/ui/button";
import Link from "next/link";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradient atmosphere — matches home page */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(77,121,91,0.12),transparent_20%),radial-gradient(circle_at_18%_18%,rgba(214,182,137,0.16),transparent_16%),radial-gradient(circle_at_82%_12%,rgba(114,153,124,0.08),transparent_18%)]" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[rgba(127,165,136,0.12)] blur-3xl" />

      <BackgroundScene />

      <div className="shell relative flex min-h-screen flex-col py-4 md:py-6">
        <header className="fade-up flex items-center justify-between gap-4">
          <SiteBrand
            href="/"
            subtitle="Sustainable concept assistant"
            subtitleClassName="text-sm"
            className="max-w-fit text-sm"
            showSubtitle
          />
          <Link href="/signup" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Create account
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-10">
          <div className="fade-up-delay mb-8 text-center">
            <span className="font-tech inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Your projects
            </span>
          </div>
          <div className="fade-up-slower w-full max-w-sm">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
