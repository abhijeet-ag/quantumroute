import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. ONLY use inside server-side API routes,
// never in client components. Used for privileged writes after we've verified
// the caller is an admin.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
