import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used for public reads (products/variants) and for public inserts (orders).
// Respects Row Level Security — never use this for admin-only data.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lvgkftiziteuijytmava.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2Z2tmdGl6aXRldWlqeXRtYXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyNjgwMTQsImV4cCI6MjExMDg0NDAxNH0.0lEpHaER80PYCuLqmhxIQ_5qtHvxUyRsgnWSKzzj45I",
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
