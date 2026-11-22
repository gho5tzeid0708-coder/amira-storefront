import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used for public reads (products/variants) and for public inserts (orders).
// Respects Row Level Security — never use this for admin-only data.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // called from a Server Component with no response to write to — safe to ignore
          }
        }
      }
    }
  );
}
