/** All amounts in Rand (not cents) for calculator UX simplicity; convert at persistence boundary. */

const SA_VAT_RATE = 0.15;

export function vatCalculator(amount: number, mode: "exclusive" | "inclusive") {
  if (mode === "exclusive") {
    const vat = amount * SA_VAT_RATE;
    return { subtotal: round2(amount), vat: round2(vat), total: round2(amount + vat) };
  }
  const subtotal = amount / (1 + SA_VAT_RATE);
  const vat = amount - subtotal;
  return { subtotal: round2(subtotal), vat: round2(vat), total: round2(amount) };
}

export function markupToMargin(costPrice: number, markupPct: number) {
  const sellingPrice = costPrice * (1 + markupPct / 100);
  const profit = sellingPrice - costPrice;
  const marginPct = (profit / sellingPrice) * 100;
  return { sellingPrice: round2(sellingPrice), profit: round2(profit), marginPct: round2(marginPct) };
}

export interface TenderPricingInput {
  materials: number;
  labour: number;
  transport: number;
  equipment: number;
  subcontractors: number;
  overheadsPct: number; // % of direct costs
  contingencyPct: number;
  profitMarginPct: number; // desired margin on final price
  discountPct?: number;
  vatInclusive: boolean;
}

export interface TenderPricingOutput {
  directCosts: number;
  overheads: number;
  contingency: number;
  costSubtotal: number;
  profitAmount: number;
  priceBeforeDiscount: number;
  discountAmount: number;
  priceExVat: number;
  vat: number;
  finalPrice: number;
  grossMarginPct: number;
}

export function tenderPricingCalculator(input: TenderPricingInput): TenderPricingOutput {
  const directCosts = input.materials + input.labour + input.transport + input.equipment + input.subcontractors;
  const overheads = directCosts * (input.overheadsPct / 100);
  const contingency = (directCosts + overheads) * (input.contingencyPct / 100);
  const costSubtotal = directCosts + overheads + contingency;

  // Solve for price such that (price - costSubtotal) / price = desired margin
  const margin = Math.min(Math.max(input.profitMarginPct, 0), 95) / 100;
  const priceBeforeDiscount = margin < 1 ? costSubtotal / (1 - margin) : costSubtotal;
  const profitAmount = priceBeforeDiscount - costSubtotal;

  const discountAmount = priceBeforeDiscount * ((input.discountPct ?? 0) / 100);
  const priceExVat = priceBeforeDiscount - discountAmount;
  const vat = input.vatInclusive ? 0 : priceExVat * SA_VAT_RATE;
  const finalPrice = priceExVat + vat;
  const grossMarginPct = ((priceExVat - costSubtotal) / priceExVat) * 100;

  return {
    directCosts: round2(directCosts),
    overheads: round2(overheads),
    contingency: round2(contingency),
    costSubtotal: round2(costSubtotal),
    profitAmount: round2(profitAmount),
    priceBeforeDiscount: round2(priceBeforeDiscount),
    discountAmount: round2(discountAmount),
    priceExVat: round2(priceExVat),
    vat: round2(vat),
    finalPrice: round2(finalPrice),
    grossMarginPct: round2(grossMarginPct),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
