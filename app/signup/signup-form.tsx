"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm rounded-[2rem] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,250,242,0.96),rgba(247,239,227,0.98))] p-8 text-center shadow-[0_20px_55px_rgba(90,81,61,0.12)] backdrop-blur-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent-soft)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-[color:var(--accent)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-tech mb-2 text-xl font-semibold text-[color:var(--foreground)]">
          Check your inbox
        </h2>
        <p className="text-sm leading-relaxed text-[color:var(--muted)]">
          We sent a confirmation link to <span className="font-medium text-[color:var(--foreground)]">{email}</span>. Click it to activate your account and start saving projects.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-[color:var(--accent)] transition hover:text-[color:var(--accent-dark)]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-[2rem] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,250,242,0.96),rgba(247,239,227,0.98))] p-8 shadow-[0_20px_55px_rgba(90,81,61,0.12)] backdrop-blur-2xl"
    >
      <h1 className="font-tech mb-1 text-2xl font-semibold tracking-[0.03em] text-[color:var(--foreground)]">
        Create account
      </h1>
      <p className="mb-7 text-sm text-[color:var(--muted)]">
        Save and revisit your dream home concepts.
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)]/60 focus:ring-2 focus:ring-[color:var(--accent)]/25"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <p className="mt-5 text-center text-sm text-[color:var(--muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[color:var(--accent)] transition hover:text-[color:var(--accent-dark)]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
