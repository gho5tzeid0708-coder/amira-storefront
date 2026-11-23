import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVICE ROLE client — bypasses Row Level Security entirely.
// Import this ONLY from files under app/admin/** (or other trusted server code).
// Never import it into a Client Component or expose the key to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lvgkftiziteuijytmava.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
