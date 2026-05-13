import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteBrand } from "@/components/site/site-brand";
import { SignOutButton } from "@/components/site/sign-out-button";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[rgba(248,241,230,0.8)] backdrop-blur-xl">
      <div className="shell flex items-center justify-between py-4">
        <SiteBrand href="/" className="text-sm" />

        <nav className="hidden items-center gap-6 text-sm font-medium text-[color:var(--muted)] md:flex">
          <Link href="/studio" className="transition hover:text-[color:var(--foreground)]">
            Studio
          </Link>
          <Link href="/results/demo" className="transition hover:text-[color:var(--foreground)]">
            Sample result
          </Link>

          {user ? (
            <>
              <Link
                href="/projects"
                className="transition hover:text-[color:var(--foreground)]"
              >
                My projects
              </Link>
              <UserChip email={user.email ?? ""} />
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="transition hover:text-[color:var(--foreground)]"
            >
              Sign in
            </Link>
          )}

          <Link href="/studio" className={buttonStyles({ size: "sm" })}>
            Start building
          </Link>
        </nav>
      </div>
    </header>
  );
}

function UserChip({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase();
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[0.65rem] font-bold text-[color:var(--accent)]">
        {initial}
      </span>
      <span className="max-w-[140px] truncate text-[color:var(--foreground)]">{email}</span>
    </span>
  );
}
