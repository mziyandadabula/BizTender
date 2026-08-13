import { getServerSupabase } from "@/lib/supabase/server";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  const supabase = getServerSupabase();
  const { data: order } = searchParams.order
    ? await supabase.from("orders").select("*, products(name)").eq("id", searchParams.order).single()
    : { data: null };

  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="font-display text-2xl font-semibold">Thanks — we're confirming your payment</h1>
      <p className="mt-3 text-slate">
        {order?.status === "paid"
          ? "Your payment is confirmed and your order is being processed."
          : "PayFast is finalising your payment. This page updates automatically once it's confirmed — access is only granted after PayFast verifies the payment server-to-server, which is usually within a few seconds."}
      </p>
      <a href="/dashboard" className="focus-ring mt-6 inline-block rounded-card bg-ink px-5 py-2.5 text-sm font-medium text-paper">
        Go to dashboard
      </a>
    </main>
  );
}
