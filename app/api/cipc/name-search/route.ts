import { NextRequest, NextResponse } from "next/server";
import { getCIPCProvider } from "@/lib/providers/cipc";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { name, companyId } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length < 3) {
    return NextResponse.json({ error: "Enter at least 3 characters." }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const provider = getCIPCProvider();
  const result = await provider.searchCompanyName(name.trim());

  await supabase.from("company_name_searches").insert({
    user_id: user.id,
    company_id: companyId ?? null,
    query_name: name.trim(),
    results: result.results,
    overall_signal: result.overallSignal,
    source: result.source,
  });

  return NextResponse.json(result);
}
