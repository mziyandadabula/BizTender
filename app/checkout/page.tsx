"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CheckoutPage() {
  const params = useSearchParams();
  const productSlug = params.get("product");
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<{ processUrl: string; fields: Record<string, string> } | null>(null);

  useEffect(() => {
    if (!productSlug) return;
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Could not start checkout");
        return res.json();
      })
      .then((d) => setPayment(d.payment))
      .catch((e) => setError(e.message));
  }, [productSlug]);

  useEffect(() => {
    if (payment) {
      // Auto-submit the hidden PayFast form once fields are ready.
      const form = document.getElementById("payfast-form") as HTMLFormElement | null;
      form?.submit();
    }
  }, [payment]);

  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="font-display text-2xl font-semibold">Redirecting you to PayFast…</h1>
      {error && <p className="mt-4 text-signal-red">{error}</p>}
      {!error && <p className="mt-3 text-slate">Please wait, this only takes a moment.</p>}

      {payment && (
        <form id="payfast-form" action={payment.processUrl} method="POST" className="hidden">
          {Object.entries(payment.fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </main>
  );
}
