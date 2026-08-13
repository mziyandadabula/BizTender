import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { PayFastProvider } from "@/lib/providers/payments/PayFastProvider";

export async function POST(req: NextRequest) {
  const { productSlug, companyId } = await req.json();
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: product } = await supabase.from("products").select("*").eq("slug", productSlug).eq("is_active", true).single();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      company_id: companyId ?? null,
      product_id: product.id,
      amount_cents: product.price_cents,
      status: "pending_payment",
    })
    .select()
    .single();
  if (error || !order) return NextResponse.json({ error: error?.message ?? "Order creation failed" }, { status: 500 });

  await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    quantity: 1,
    unit_price_cents: product.price_cents,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const payfast = new PayFastProvider();
  const payment = payfast.createPayment({
    orderId: order.id,
    amountCents: product.price_cents,
    itemName: product.name,
    buyerEmail: user.email!,
    returnUrl: `${siteUrl}/checkout/success?order=${order.id}`,
    cancelUrl: `${siteUrl}/checkout/cancelled?order=${order.id}`,
    notifyUrl: `${siteUrl}/api/payments/payfast-itn`,
  });

  return NextResponse.json({ orderId: order.id, payment });
}
