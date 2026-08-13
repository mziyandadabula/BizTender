import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. BYPASSES RLS. Server-side only (route handlers, edge functions,
 * cron jobs). Never import this file from a client component — importing it in
 * "use client" code will fail at build time because SUPABASE_SERVICE_ROLE_KEY
 * is not exposed via NEXT_PUBLIC_*, which is intentional.
 */
export function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
