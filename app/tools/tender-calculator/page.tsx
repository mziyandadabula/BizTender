"use client";

import { useState } from "react";
import { tenderPricingCalculator, TenderPricingInput } from "@/lib/calculators/calculators";
import { Button } from "@/components/ui/Button";

const DEFAULT_INPUT: TenderPricingInput = {
  materials: 0, labour: 0, transport: 0, equipment: 0, subcontractors: 0,
  overheadsPct: 10, contingencyPct: 5, profitMarginPct: 15, discountPct: 0, vatInclusive: false,
};

const FIELDS: { key: keyof TenderPricingInput; label: string; suffix?: string }[] = [
  { key: "materials", label: "Materials (R)" },
  { key: "labour", label: "Labour (R)" },
  { key: "transport", label: "Transport (R)" },
  { key: "equipment", label: "Equipment (R)" },
  { key: "subcontractors", label: "Subcontractors (R)" },
  { key: "overheadsPct", label: "Overheads", suffix: "%" },
  { key: "contingencyPct", label: "Contingency", suffix: "%" },
  { key: "profitMarginPct", label: "Target profit margin", suffix: "%" },
  { key: "discountPct", label: "Discount", suffix: "%" },
];

export default function TenderCalculatorPage() {
  const [input, setInput] = useState<TenderPricingInput>(DEFAULT_INPUT);
  const output = tenderPricingCalculator(input);

  function update(key: keyof TenderPricingInput, value: string) {
    setInput((prev) => ({ ...prev, [key]: key === "vatInclusive" ? value === "true" : Number(value) }));
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Tender pricing calculator</h1>
      <p className="mt-2 text-slate">Build your tender price from direct costs up to a final, VAT-aware price.</p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <label key={f.key} className="text-sm">
              <span className="text-slate">{f.label}</span>
              <input
                type="number"
                value={input[f.key] as number}
                onChange={(e) => update(f.key, e.target.value)}
                className="focus-ring mt-1 w-full rounded-card border border-ink/15 bg-white px-3 py-2"
              />
            </label>
          ))}
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={input.vatInclusive}
              onChange={(e) => setInput((prev) => ({ ...prev, vatInclusive: e.target.checked }))}
            />
            Price should be VAT-inclusive already (skip adding VAT)
          </label>
        </div>

        <div className="rounded-card border border-ink/10 bg-white/70 p-6">
          <h2 className="font-display text-lg font-semibold">Result</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Direct costs" value={output.directCosts} />
            <Row label="Overheads" value={output.overheads} />
            <Row label="Contingency" value={output.contingency} />
            <Row label="Cost subtotal" value={output.costSubtotal} strong />
            <Row label="Profit" value={output.profitAmount} />
            <Row label="Discount" value={-output.discountAmount} />
            <Row label="Price (ex VAT)" value={output.priceExVat} />
            <Row label="VAT (15%)" value={output.vat} />
            <Row label="Final tender price" value={output.finalPrice} strong large />
            <Row label="Gross margin" value={output.grossMarginPct} isPct />
          </dl>
          <Button className="mt-6 w-full" disabled>Save to tender workspace (sign in required)</Button>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, strong, large, isPct }: { label: string; value: number; strong?: boolean; large?: boolean; isPct?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : ""} ${large ? "text-lg" : ""}`}>
      <dt className="text-slate">{label}</dt>
      <dd className="font-mono">{isPct ? `${value.toFixed(1)}%` : `R ${value.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`}</dd>
    </div>
  );
}
