import { getServerSupabase } from "@/lib/supabase/server";
import { ReadinessSeal } from "@/components/ui/ReadinessSeal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { tenderReadinessScore } from "@/lib/matching/tenderReadiness";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const { data: memberships } = await supabase
    .from("company_users")
    .select("company_id, companies(*)")
    .eq("user_id", user.id);

  const activeCompany = memberships?.[0]?.companies as any;

  if (!activeCompany) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-2xl font-semibold">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""} 👋</h1>
        <p className="mt-3 text-slate">You don't have a company yet — add one to unlock your dashboard.</p>
        <Link href="/companies/new" className="focus-ring mt-6 inline-block rounded-card bg-ink px-5 py-2.5 text-sm font-medium text-paper">
          Add your company
        </Link>
      </main>
    );
  }

  const [{ data: complianceItems }, { data: matches }, { data: fundingMatches }, { data: documents }] = await Promise.all([
    supabase.from("compliance_items").select("*").eq("company_id", activeCompany.id),
    supabase.from("tender_matches").select("*, tenders(*)").eq("company_id", activeCompany.id).order("score", { ascending: false }).limit(5),
    supabase.from("funding_matches").select("*, funding_opportunities(*)").eq("company_id", activeCompany.id).order("score", { ascending: false }).limit(4),
    supabase.from("documents").select("*").eq("company_id", activeCompany.id),
  ]);

  const csd = complianceItems?.find((c) => c.item_key === "csd")?.status ?? "unknown";
  const bbbee = complianceItems?.find((c) => c.item_key === "bbbee")?.status ?? "unknown";
  const expiringSoon = (documents ?? []).filter((d) => d.status === "expiring_soon" || d.status === "expired");

  const { overall, improvements } = tenderReadinessScore({
    cipcRegistered: !!activeCompany.cipc_verified,
    csdStatus: csd as any,
    bbbeeStatus: bbbee as any,
    hasCompanyProfile: !!activeCompany.description,
    industryRegistrationsPct: 60,
    documentsCompletePct: documents?.length ? Math.min(100, documents.length * 20) : 0,
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Good day, {profile?.full_name?.split(" ")[0] ?? "there"} 👋</h1>
          <p className="mt-1 font-mono text-sm uppercase tracking-wide text-seal">{activeCompany.name}</p>
        </div>
        <Link href="/tools/tender-readiness" className="focus-ring text-sm text-slate hover:text-ink">
          View full readiness breakdown →
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="flex items-center gap-5 rounded-card border border-ink/10 bg-white/60 p-6 md:col-span-1">
          <ReadinessSeal pct={overall} />
          <div>
            <p className="text-sm font-medium">Tender Readiness</p>
            <p className="mt-1 text-xs text-slate">{improvements.length} thing{improvements.length === 1 ? "" : "s"} to fix</p>
          </div>
        </div>

        <div className="rounded-card border border-ink/10 bg-white/60 p-6 md:col-span-1">
          <p className="text-sm font-medium">🔥 Tender matches</p>
          <p className="mt-1 font-display text-3xl">{matches?.length ?? 0}</p>
          <Link href="/tenders/matches" className="focus-ring mt-3 inline-block text-sm text-seal-dark">View tenders →</Link>
        </div>

        <div className="rounded-card border border-ink/10 bg-white/60 p-6 md:col-span-1">
          <p className="text-sm font-medium">💰 Funding matches</p>
          <p className="mt-1 font-display text-3xl">{fundingMatches?.length ?? 0}</p>
          <Link href="/funding" className="focus-ring mt-3 inline-block text-sm text-seal-dark">Find funding →</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-card border border-ink/10 bg-white/60 p-6">
          <p className="text-sm font-medium">⚠️ Business actions</p>
          <ul className="mt-3 space-y-2 text-sm text-slate">
            {improvements.length === 0 && expiringSoon.length === 0 ? (
              <li>Nothing needs attention right now.</li>
            ) : (
              <>
                {improvements.map((i) => <li key={i}>• {i}</li>)}
                {expiringSoon.map((d) => <li key={d.id}>• {d.filename} — {d.status.replace("_", " ")}</li>)}
              </>
            )}
          </ul>
          <div className="mt-4 flex gap-3">
            <StatusBadge status={csd as any} label={`CSD: ${csd}`} />
            <StatusBadge status={bbbee as any} label={`B-BBEE: ${bbbee}`} />
          </div>
        </section>

        <section className="rounded-card border border-ink/10 bg-white/60 p-6">
          <p className="text-sm font-medium">📄 Recent documents</p>
          <ul className="mt-3 space-y-2 text-sm text-slate">
            {(documents ?? []).slice(0, 5).map((d) => (
              <li key={d.id} className="flex items-center justify-between">
                <span>{d.filename}</span>
                <StatusBadge status={d.status === "valid" ? "green" : d.status === "expiring_soon" ? "amber" : d.status === "expired" ? "red" : "unknown"} />
              </li>
            ))}
            {(!documents || documents.length === 0) && <li>No documents uploaded yet.</li>}
          </ul>
          <Link href={`/companies/${activeCompany.id}/documents`} className="focus-ring mt-4 inline-block text-sm text-seal-dark">
            Open document vault →
          </Link>
        </section>
      </div>
    </main>
  );
}
