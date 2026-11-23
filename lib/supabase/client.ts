import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lvgkftiziteuijytmava.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2Z2tmdGl6aXRldWlqeXRtYXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyNjgwMTQsImV4cCI6MjExMDg0NDAxNH0.0lEpHaER80PYCuLqmhxIQ_5qtHvxUyRsgnWSKzzj45I"
  );
}
