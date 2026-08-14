import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Use in server components / route handlers. Runs AS the logged-in user — RLS applies. */
export function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: any) => cookieStore.set({ name, value: "", ...options }),
      },
    }
  );
}
