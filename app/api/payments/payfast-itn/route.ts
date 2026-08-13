import { NextRequest, NextResponse } from "next/server";
import { PayFastProvider } from "@/lib/providers/payments/PayFastProvider";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

/**
 * PayFast posts Instant Transaction Notifications here. This is the ONLY code path
 * that flips an order to "paid" and grants product/service access.
 * The /checkout/success page (browser redirect) must never do this itself.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const payload = Object.fromEntries(new URLSearchParams(body));
  const sourceIp = req.headers.get("x-forwarded-for") ?? undefined;

  const provider = new PayFastProvider();
  const result = await provider.verifyNotification(payload, sourceIp);

  const supabase = getServiceRoleClient();

  // Always record the raw notification, valid or not, for audit purposes.
  const { data: order } = result.orderId
    ? await supabase.from("orders").select("*").eq("id", result.orderId).single()
    : { data: null };

  await supabase.from("payments").insert({
    order_id: order?.id ?? null,
    provider: "payfast",
    provider_payment_id: result.providerPaymentId,
    amount_cents: result.amountCents,
    status: result.status,
    raw_itn: payload,
    verified: result.valid,
  });

  if (!result.valid || !order) {
    return new NextResponse("ok", { status: 200 }); // Ack receipt even on failure; PayFast retries otherwise.
  }

  // Amount must match what we expect — never trust the posted amount alone.
  if (result.amountCents !== order.amount_cents) {
    await supabase.from("audit_logs").insert({
      action: "payfast_amount_mismatch",
      entity_type: "order",
      entity_id: order.id,
      meta: { expected: order.amount_cents, received: result.amountCents },
    });
    return new NextResponse("ok", { status: 200 });
  }

  if (result.status === "COMPLETE") {
    await supabase
      .from("orders")
      .update({ status: "paid", payfast_payment_id: result.providerPaymentId, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    // Kick off fulfilment: create a service_job from the product's checklist template.
    const { data: product } = await supabase.from("products").select("*").eq("id", order.product_id).single();
    if (product) {
      const { data: job } = await supabase
        .from("service_jobs")
        .insert({ order_id: order.id, company_id: order.company_id, title: product.name, status: "payment_confirmed" })
        .select()
        .single();
      if (job) {
        const { data: features } = await supabase.from("product_features").select("label").eq("product_id", product.id).order("sort_order");
        if (features?.length) {
          await supabase.from("service_job_tasks").insert(
            features.map((f, i) => ({ service_job_id: job.id, label: f.label, sort_order: i }))
          );
        }
      }
    }

    await supabase.from("notifications").insert({
      user_id: order.user_id,
      company_id: order.company_id,
      type: "payment_successful",
      title: "Payment received",
      body: "Your payment was confirmed and your order is now being processed.",
    });
  } else if (result.status === "FAILED") {
    await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
  }

  return new NextResponse("ok", { status: 200 });
}
