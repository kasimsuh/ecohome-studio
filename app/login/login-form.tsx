"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/projects";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-[2rem] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,250,242,0.96),rgba(247,239,227,0.98))] p-8 shadow-[0_20px_55px_rgba(90,81,61,0.12)] backdrop-blur-2xl"
    >
      <h1 className="font-tech mb-1 text-2xl font-semibold tracking-[0.03em] text-[color:var(--foreground)]">
        Welcome back
      </h1>
      <p className="mb-7 text-sm text-[color:var(--muted)]">
        Sign in to access your saved projects.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)]/60 focus:ring-2 focus:ring-[color:var(--accent)]/25"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)]/60 focus:ring-2 focus:ring-[color:var(--accent)]/25"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="mt-6 w-full"
        size="md"
      >
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <p className="mt-5 text-center text-sm text-[color:var(--muted)]">
        No account yet?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[color:var(--accent)] transition hover:text-[color:var(--accent-dark)]"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
