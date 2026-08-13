import { getServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isAdmin } = await supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!isAdmin) redirect("/dashboard");

  const [{ count: userCount }, { count: companyCount }, { data: orders }, { data: apiLogs }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("amount_cents, status, created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("api_usage_logs").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  const revenueToday = (orders ?? [])
    .filter((o) => o.status === "paid" && new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.amount_cents, 0);

  const cipcLogs = (apiLogs ?? []).filter((l) => l.provider === "cipc");
  const cipcErrorRate = cipcLogs.length ? Math.round((cipcLogs.filter((l) => !l.success).length / cipcLogs.length) * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold">Admin overview</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        <Metric label="Revenue today" value={`R ${(revenueToday / 100).toLocaleString("en-ZA")}`} />
        <Metric label="Users" value={String(userCount ?? 0)} />
        <Metric label="Companies" value={String(companyCount ?? 0)} />
        <Metric label="Orders (200 recent)" value={String(orders?.length ?? 0)} />
      </div>

      <section className="mt-8 rounded-card border border-ink/10 bg-white/60 p-6">
        <h2 className="font-display text-lg font-semibold">CIPC API health</h2>
        <p className="mt-1 text-sm text-slate">{cipcLogs.length} calls logged · {cipcErrorRate}% error rate</p>
        <p className="mt-3 text-xs text-slate">
          {cipcLogs.length === 0
            ? "No CIPC calls yet — this deployment is running on MockCIPCProvider until CIPC credentials are configured."
            : ""}
        </p>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-ink/10 bg-white/60 p-5">
      <p className="text-xs uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
