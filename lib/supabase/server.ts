import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicConfig } from "./config";

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll called from a Server Component — cookies will be set by middleware instead
        }
      },
    },
  });
}
