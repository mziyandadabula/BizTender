export interface CreatePaymentInput {
  orderId: string;
  amountCents: number;
  itemName: string;
  buyerEmail: string;
  buyerFirstName?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

export interface CreatePaymentResult {
  /** Fields to render as a hidden auto-submit form POSTing to `processUrl`. */
  processUrl: string;
  fields: Record<string, string>;
}

export interface VerifiedNotification {
  valid: boolean;
  orderId: string | null;
  amountCents: number;
  status: "COMPLETE" | "FAILED" | "PENDING";
  providerPaymentId: string;
  raw: Record<string, string>;
  reason?: string;
}

/**
 * Payment provider abstraction. PayFastProvider is the only implementation today,
 * but nothing outside this interface should know PayFast-specific field names.
 */
export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): CreatePaymentResult;
  /**
   * Verifies an inbound server-to-server notification (ITN). MUST perform:
   * signature check, amount check, and a callback to the provider's validate
   * endpoint before treating the payment as real. Never trust the browser redirect.
   */
  verifyNotification(payload: Record<string, string>, sourceIp?: string): Promise<VerifiedNotification>;
}
