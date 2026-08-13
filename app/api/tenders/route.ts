import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const supabase = getServerSupabase();

  let query = supabase.from("tenders").select("*").order("closing_date", { ascending: true });

  const keyword = searchParams.get("q");
  const province = searchParams.get("province");
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  if (keyword) query = query.ilike("title", `%${keyword}%`);
  if (province) query = query.eq("province", province);
  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tenders: data });
}
