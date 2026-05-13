"use client";

import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className={cn(
        "transition text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
        className,
      )}
    >
      Sign out
    </button>
  );
}
