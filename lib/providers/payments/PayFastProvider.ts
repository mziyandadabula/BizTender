import crypto from "crypto";
import {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  VerifiedNotification,
} from "./PaymentProvider";
import { logApiUsage } from "../logApiUsage";

const SANDBOX_VALIDATE_URL = "https://sandbox.payfast.co.za/eng/query/validate";
const LIVE_VALIDATE_URL = "https://www.payfast.co.za/eng/query/validate";

function pfParamString(fields: Record<string, string>, passphrase?: string): string {
  const parts = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, "+")}`);
  let str = parts.join("&");
  if (passphrase) str += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  return str;
}

export class PayFastProvider implements PaymentProvider {
  private mode = process.env.PAYFAST_MODE === "live" ? "live" : "sandbox";
  private merchantId = process.env.PAYFAST_MERCHANT_ID!;
  private merchantKey = process.env.PAYFAST_MERCHANT_KEY!;
  private passphrase = process.env.PAYFAST_PASSPHRASE;

  createPayment(input: CreatePaymentInput): CreatePaymentResult {
    const fields: Record<string, string> = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      notify_url: input.notifyUrl,
      m_payment_id: input.orderId,
      amount: (input.amountCents / 100).toFixed(2),
      item_name: input.itemName,
      email_address: input.buyerEmail,
      name_first: input.buyerFirstName ?? "",
    };
    const paramString = pfParamString(fields, this.passphrase);
    const signature = crypto.createHash("md5").update(paramString).digest("hex");

    return {
      processUrl:
        this.mode === "live"
          ? "https://www.payfast.co.za/eng/process"
          : "https://sandbox.payfast.co.za/eng/process",
      fields: { ...fields, signature },
    };
  }

  async verifyNotification(payload: Record<string, string>, sourceIp?: string): Promise<VerifiedNotification> {
    const { signature: receivedSignature, ...rest } = payload;

    // 1. Signature check
    const expected = crypto.createHash("md5").update(pfParamString(rest, this.passphrase)).digest("hex");
    if (expected !== receivedSignature) {
      await logApiUsage({ provider: "payfast", operation: "itn_verify", success: false, meta: { reason: "bad_signature" } });
      return { valid: false, orderId: payload.m_payment_id ?? null, amountCents: 0, status: "FAILED", providerPaymentId: payload.pf_payment_id ?? "", raw: payload, reason: "signature_mismatch" };
    }

    // 2. Server-to-server validate call back to PayFast (never trust the POST alone)
    const validateUrl = this.mode === "live" ? LIVE_VALIDATE_URL : SANDBOX_VALIDATE_URL;
    const start = Date.now();
    const res = await fetch(validateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: pfParamString(rest),
    });
    const text = await res.text();
    const isValid = text.trim() === "VALID";
    await logApiUsage({
      provider: "payfast",
      operation: "itn_verify",
      success: isValid,
      durationMs: Date.now() - start,
      meta: { sourceIp },
    });

    if (!isValid) {
      return { valid: false, orderId: payload.m_payment_id ?? null, amountCents: 0, status: "FAILED", providerPaymentId: payload.pf_payment_id ?? "", raw: payload, reason: "payfast_validate_rejected" };
    }

    const amountCents = Math.round(parseFloat(payload.amount_gross ?? "0") * 100);
    const status = payload.payment_status === "COMPLETE" ? "COMPLETE" : payload.payment_status === "FAILED" ? "FAILED" : "PENDING";

    return {
      valid: true,
      orderId: payload.m_payment_id ?? null,
      amountCents,
      status,
      providerPaymentId: payload.pf_payment_id ?? "",
      raw: payload,
    };
  }
}
