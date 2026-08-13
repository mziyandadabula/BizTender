import { getServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

export default async function PricingPage() {
  const supabase = getServerSupabase();
  const { data: products } = await supabase
    .from("products")
    .select("*, product_features(*)")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="font-display text-3xl font-semibold">Pricing</h1>
      <p className="mt-2 text-slate">One-time packages to get registered and tender-ready, or a monthly plan for ongoing matching and alerts.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {(products ?? []).map((p) => (
          <div key={p.id} className="flex flex-col rounded-card border border-ink/10 bg-white/60 p-6">
            <p className="font-mono text-xs uppercase tracking-wide text-seal">{p.type === "subscription" ? "Monthly plan" : "Once-off package"}</p>
            <h2 className="mt-2 font-display text-xl font-semibold">{p.name}</h2>
            <p className="mt-2 text-2xl font-semibold">
              R{(p.price_cents / 100).toLocaleString("en-ZA")}
              {p.billing_interval && <span className="text-sm font-normal text-slate">/{p.billing_interval}</span>}
            </p>
            <p className="mt-2 text-sm text-slate">{p.description}</p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm">
              {(p.product_features ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((f: any) => (
                <li key={f.id}>✓ {f.label}</li>
              ))}
            </ul>
            <Button href={`/checkout?product=${p.slug}`} className="mt-6">Get started</Button>
          </div>
        ))}
        {(!products || products.length === 0) && (
          <p className="text-sm text-slate">No packages published yet — add products from the admin panel.</p>
        )}
      </div>
    </main>
  );
}
